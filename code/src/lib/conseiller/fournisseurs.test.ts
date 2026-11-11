/**
 * Fournisseurs (conseiller-ia.md §2), compteur (§9.1) et prompts (§4), sans réseau.
 */
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PROMPT_RELANCE,
  PROMPT_RELANCE_CIBLEE,
  PROMPT_SYSTEME,
  PROMPT_UTILISATEUR,
  VERSION_PROMPT,
} from "@content/prompt-conseiller";
import { reponsesSchema } from "@/lib/questionnaire/reponses";
import profils from "../../../tests/fixtures/profils-conseiller.json";
import { CompteurFichier, CompteurMemoire, decider } from "./budget";
import { construireCharge } from "./charge";
import { ErreurLlm, type RequeteLlm } from "./fournisseur";
import { FournisseurAnthropic } from "./fournisseurs/anthropic";
import { corpsXai, FournisseurXai } from "./fournisseurs/xai";
import { construireRequete } from "./index";

const requete: RequeteLlm = {
  systeme: "système",
  messages: [{ role: "user", contenu: "bonjour" }],
  schema: { type: "object" },
  nomSchema: "conseil",
  maxJetonsSortie: 4000,
  temperature: 0.4,
};

const reponseHttp = (statut: number, corps: unknown) =>
  new Response(typeof corps === "string" ? corps : JSON.stringify(corps), { status: statut });

afterEach(() => vi.restoreAllMocks());

describe("xAI", () => {
  it("envoie la sortie structurée stricte et lit l'usage et le coût", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      reponseHttp(200, {
        model: "grok-test",
        choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          prompt_tokens_details: { cached_tokens: 50 },
          completion_tokens_details: { reasoning_tokens: 0 },
          cost_in_usd_ticks: 80_900_000,
        },
      }),
    );
    const r = await new FournisseurXai("cle-de-test", "grok-test").generer(
      requete,
      new AbortController().signal,
    );
    const corps = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(corps.response_format).toMatchObject({
      type: "json_schema",
      json_schema: { name: "conseil", strict: true },
    });
    expect(corps.messages[0]).toEqual({ role: "system", content: "système" });
    expect(r).toMatchObject({ brut: "{}", fin: "complete", modeleServi: "grok-test" });
    expect(r.usage).toMatchObject({ entree: 100, entreeEnCache: 50, sortie: 20 });
    expect(r.usage.coutUsd).toBeCloseTo(0.00809, 6);
  });

  it("refus de json_schema : nouvel essai en json_object, le schéma recopié dans le prompt", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(reponseHttp(400, "unsupported response_format"))
      .mockResolvedValueOnce(
        reponseHttp(200, { choices: [{ message: { content: "{}" }, finish_reason: "length" }] }),
      );
    const r = await new FournisseurXai("cle-de-test", "grok-test").generer(
      requete,
      new AbortController().signal,
    );
    const second = JSON.parse(String(fetch.mock.calls[1][1]?.body));
    expect(second.response_format).toEqual({ type: "json_object" });
    expect(second.messages[0].content).toContain('"type":"object"');
    expect(r).toMatchObject({ schemaDegrade: true, fin: "longueur" });
  });

  it("429 et 5xx se relancent, 401 non ; un abandon est un délai", async () => {
    const f = new FournisseurXai("cle-de-test", "grok-test");
    for (const [statut, relancable] of [
      [429, true],
      [503, true],
      [401, false],
    ] as const) {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(reponseHttp(statut, ""));
      await expect(f.generer(requete, new AbortController().signal)).rejects.toMatchObject({
        statut,
        relancable,
      });
    }
    const controle = new AbortController();
    controle.abort();
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new DOMException("abandon", "AbortError"));
    await expect(f.generer(requete, controle.signal)).rejects.toMatchObject({ type: "delai" });
  });

  it("le corps de requête ne contient pas la clé", () => {
    expect(JSON.stringify(corpsXai(requete, "grok-test", false))).not.toContain("cle-de-test");
  });
});

describe("Anthropic", () => {
  it("force l'outil rendre_conseil et rend son entrée", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      reponseHttp(200, {
        model: "m",
        content: [{ type: "tool_use", name: "rendre_conseil", input: { a: 1 } }],
        usage: { input_tokens: 3, output_tokens: 4 },
      }),
    );
    const r = await new FournisseurAnthropic("cle", "m").generer(
      requete,
      new AbortController().signal,
    );
    const corps = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(corps.tool_choice).toEqual({ type: "tool", name: "rendre_conseil" });
    expect(r.brut).toBe('{"a":1}');
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(reponseHttp(200, { content: [] }));
    await expect(
      new FournisseurAnthropic("cle", "m").generer(requete, new AbortController().signal),
    ).rejects.toBeInstanceOf(ErreurLlm);
  });
});

describe("compteur bloquant", () => {
  it("20 réservations concurrentes avec une part de 10 : exactement 10 acceptées", async () => {
    const dossier = mkdtempSync(join(tmpdir(), "compteur-"));
    try {
      const c = new CompteurFichier(join(dossier, "compteur.json"), {
        total: 150,
        parts: { essai: 10, etiquetage: 40, evaluation: 84 },
        reserve: false,
      });
      const resultats = await Promise.all(Array.from({ length: 20 }, () => c.reserver("essai")));
      expect(resultats.filter(Boolean)).toHaveLength(10);
      expect((await c.etat()).parSeau.essai.utilises).toBe(10);
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });

  it("la réserve ne sert qu'avec LLM_RESERVE=1 ; le total bloque même sous les parts", async () => {
    const parts = { essai: 1, etiquetage: 40, evaluation: 84 };
    const sans = new CompteurMemoire({ total: 150, parts, reserve: false });
    expect([await sans.reserver("essai"), await sans.reserver("essai")]).toEqual([true, false]);
    const avec = new CompteurMemoire({ total: 150, parts, reserve: true });
    expect([await avec.reserver("essai"), await avec.reserver("essai")]).toEqual([true, true]);
    expect((await avec.etat()).parSeau.reserve.utilises).toBe(1);
    expect(
      decider({ essai: 0, etiquetage: 0, evaluation: 0, reserve: 0 }, "essai", {
        total: 0,
        parts,
        reserve: true,
      }),
    ).toBeNull();
    expect(
      decider({ essai: 0, etiquetage: 0, evaluation: 0, reserve: 0 }, "bilan", {
        total: 150,
        parts,
        reserve: false,
      }),
    ).toBe("essai");
  });
});

describe("prompts (§4)", () => {
  it("le texte est figé avec sa version : un changement exige d'incrémenter VERSION_PROMPT", () => {
    const empreinte = createHash("sha256")
      .update(
        [PROMPT_SYSTEME, PROMPT_UTILISATEUR, PROMPT_RELANCE, PROMPT_RELANCE_CIBLEE].join("\u0000"),
      )
      .digest("hex")
      .slice(0, 16);
    expect({ version: VERSION_PROMPT, empreinte }).toEqual({ version: 4, empreinte: EMPREINTE_V4 });
  });

  it("aucun code ROME de la présélection de l'exemple dans le prompt", () => {
    const charge = construireCharge(reponsesSchema.parse(profils.profils.exemple_recit));
    for (const c of charge.envoi.candidats) expect(PROMPT_SYSTEME).not.toContain(c.code);
    expect(PROMPT_SYSTEME).not.toContain("probleme_exemple");
  });

  it("la requête porte le nombre de pistes en chiffres et la charge en JSON", () => {
    const charge = construireCharge(reponsesSchema.parse(profils.profils.exemple_recit));
    const r = construireRequete(charge);
    expect(r.messages[0].contenu).toMatch(
      /^Voici les réponses du parent et la présélection\. Choisis 3 pistes/,
    );
    expect(JSON.parse(r.messages[0].contenu.split("\n\n")[1])).toEqual(charge.envoi);
  });
});

const EMPREINTE_V4 = "71d38d7e510e9f33";
