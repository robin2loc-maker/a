/**
 * Orchestration du conseiller avec le fournisseur mock (conseiller-ia.md
 * §7, §9, §10.5) : relance, replis, budget, journal, écartés.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { lireConfig } from "@/lib/config";
import { chargerIndexMoteur } from "@/lib/moteur/donnees";
import { resultatAvecPistes } from "@/lib/moteur/resultat";
import { reponsesSchema } from "@/lib/questionnaire/reponses";
import profils from "../../../tests/fixtures/profils-conseiller.json";
import valide from "../../../tests/fixtures/conseil-exemple-valide.json";
import { CompteurMemoire, type ConfigBudget } from "./budget";
import { composerPourquoi } from "./composer";
import { choisirFournisseur, ErreurLlm } from "./fournisseur";
import { FournisseurMock, type EtapeMock } from "./fournisseurs/mock";
import { FournisseurXai } from "./fournisseurs/xai";
import { conseiller, type OptionsConseiller } from "./index";
import type { LigneJournal } from "./journal";
import type { SortieLlm } from "./types";

const index = chargerIndexMoteur();
const config = lireConfig({});
const reponses = reponsesSchema.parse(profils.profils.exemple_recit);
const copie = (): SortieLlm => structuredClone(valide) as SortieLlm;

class MockReel extends FournisseurMock {
  override readonly reel = true;
}

const sortie = (s: unknown): EtapeMock => ({ type: "sortie", sortie: s });

function lancer(etapes: EtapeMock[], options: Partial<OptionsConseiller> = {}, reel = false) {
  const fournisseur = reel
    ? new MockReel({ type: "sequence", etapes })
    : new FournisseurMock({ type: "sequence", etapes });
  const journal: LigneJournal[] = [];
  const compteur = options.compteur ?? new CompteurMemoire();
  const promesse = conseiller(reponses, {
    config,
    index,
    fournisseur,
    compteur,
    journal: (l) => journal.push(l),
    ...options,
  });
  return { fournisseur, journal, compteur, promesse };
}

const texteInvalide = (): SortieLlm => {
  const s = copie();
  s.pistes[0].metier_simplement = "Il dirige des chantiers.";
  return s;
};
const choixInvalide = (): SortieLlm => {
  const s = copie();
  s.pistes[2].code = "F1135";
  return s;
};
/** Réponse à une relance ciblée : la piste `i` de la sortie valide, qui remplace `remplace`. */
const correction = (i: number, remplace: string) => ({
  pistes: [{ remplace, ...copie().pistes[i] }],
});

afterEach(() => vi.restoreAllMocks());

describe("sans clé et sans LLM_REEL", () => {
  it("sans fournisseur : calcul seul, tous les champs remplis, aucun appel", async () => {
    const { conseil, resultat } = await conseiller(reponses, {
      config,
      index,
      fournisseur: null,
      journal: () => {},
    });
    expect(conseil.source).toBe("repli");
    expect(conseil.motifRepli).toBe("sans_cle");
    expect(conseil.appels).toBe(0);
    expect(conseil.pistes.map((p) => p.code_rome)).toEqual(resultat.pistes.map((p) => p.code_rome));
    for (const p of conseil.pistes) {
      expect(p.metierSimplement.texte.length).toBeGreaterThan(40);
      expect(p.pourquoiParent.texte).toMatch(/\.$/);
      expect(p.pourquoiEnfant.texte).toMatch(/\.$/);
      expect(p.iaPhrase).toBeNull();
    }
    expect(conseil.ecartes.every((e) => e.raison.endsWith(".") && e.origine === "gabarit")).toBe(
      true,
    );
  });

  it("une clé sans LLM_REEL donne le mock, quel que soit NODE_ENV ; LLM_REEL=1 donne xAI", async () => {
    for (const NODE_ENV of ["production", "development"]) {
      const f = await choisirFournisseur(
        lireConfig({ XAI_API_KEY: "xai-exemple-de-cle", NODE_ENV }),
      );
      expect(f?.nom).toBe("mock");
      expect(f?.reel).toBe(false);
    }
    const reel = await choisirFournisseur(
      lireConfig({ XAI_API_KEY: "xai-exemple-de-cle", LLM_REEL: "1" }),
    );
    expect(reel).toBeInstanceOf(FournisseurXai);
    expect(await choisirFournisseur(lireConfig({}))).toBeNull();
  });

  it("le mock « gabarits » ne fait aucun appel réseau et ne touche pas le compteur", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const compteur = new CompteurMemoire();
    const { conseil } = await conseiller(reponses, {
      config: lireConfig({ XAI_API_KEY: "xai-exemple-de-cle" }),
      index,
      compteur,
      journal: () => {},
    });
    expect(fetch).not.toHaveBeenCalled();
    expect((await compteur.etat()).total.utilises).toBe(0);
    expect(conseil.fournisseur?.nom).toBe("mock");
    expect(conseil.pistes).toHaveLength(3);
  });
});

describe("relance et replis", () => {
  it("sortie valide : un appel, conseil « llm », textes composés par le code", async () => {
    const { promesse, fournisseur } = lancer([sortie(valide)]);
    const { conseil } = await promesse;
    expect(fournisseur.requetes).toHaveLength(1);
    expect(conseil.source).toBe("llm");
    expect(conseil.champsRemplaces).toEqual([]);
    expect(conseil.pistes.map((p) => p.code_rome)).toEqual(["F1201", "G1802", "A1301"]);
    expect(conseil.pistes[0].pourquoiParent.texte).toBe(
      composerPourquoi(valide.pistes[0].pourquoi_parent),
    );
    expect(conseil.pistes[0].metier).toBe("Conducteur de travaux du bâtiment");
    expect(conseil.analyse).toBe(valide.analyse);
  });

  it("invalide puis corrigé : la relance ciblée ne demande que la piste fautive", async () => {
    const { promesse, fournisseur } = lancer([
      sortie(texteInvalide()),
      sortie(correction(0, "F1201")),
    ]);
    const { conseil } = await promesse;
    expect(fournisseur.requetes).toHaveLength(2);
    const relance = fournisseur.requetes[1];
    expect(relance.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(relance.messages[2].contenu).toMatch(/^Ta réponse ne respecte pas les règles/);
    expect(relance.messages[2].contenu).toContain("metier_simplement");
    expect(relance.messages[2].contenu).toContain("Réécris seulement 1 piste(s), parmi : F1201.");
    expect(relance.nomSchema).toBe("correction");
    expect(relance.maxJetonsSortie).toBe(1500);
    const schema = relance.schema as {
      properties: { pistes: { maxItems: number; items: { properties: Record<string, unknown> } } };
    };
    expect(schema.properties.pistes.maxItems).toBe(1);
    expect(schema.properties.pistes.items.properties.remplace).toEqual({
      type: "string",
      enum: ["F1201"],
    });
    expect(conseil.source).toBe("llm");
    expect(conseil.champsRemplaces).toEqual([]);
    expect(conseil.pistes[0].metierSimplement.origine).toBe("llm");
  });

  it("choix invalide deux fois : trio partiel, les pistes compatibles du modèle sont gardées", async () => {
    const { promesse, fournisseur } = lancer([
      sortie(choixInvalide()),
      sortie({ pistes: [{ remplace: "F1135", ...choixInvalide().pistes[2] }] }),
    ]);
    const { conseil, tentatives } = await promesse;
    expect(fournisseur.requetes[1].messages[2].contenu).toContain("parmi : F1201, F1135.");
    expect(tentatives.map((t) => t.echecs.some((e) => e.code === "V05"))).toEqual([true, true]);
    expect(conseil.source).toBe("partiel");
    expect(conseil.pistes.map((p) => p.code_rome).slice(0, 2)).toEqual(["F1201", "G1802"]);
    const ajoutee = conseil.pistes[2];
    expect(ajoutee.code_rome).not.toBe("F1135");
    expect(conseil.champsRemplaces).toContain(`${ajoutee.code_rome}.piste`);
    expect(ajoutee.pourquoiParent.origine).toBe("gabarit");
    expect(conseil.pistes[0].pourquoiParent.origine).toBe("llm");
  });

  it("aucune piste du modèle n'est gardable : repli total", async () => {
    const s = copie();
    for (const p of s.pistes) p.code = "F1101"; // hors présélection
    const { conseil, resultat } = await lancer([sortie(s), sortie(s)]).promesse;
    expect(conseil.source).toBe("repli");
    expect(conseil.motifRepli).toBe("validation");
    expect(conseil.pistes.map((p) => p.code_rome)).toEqual(resultat.pistes.map((p) => p.code_rome));
  });

  it("texte invalide deux fois : repli par champ, le choix est gardé", async () => {
    const { promesse } = lancer([sortie(texteInvalide()), sortie(texteInvalide())]);
    const { conseil } = await promesse;
    expect(conseil.source).toBe("llm");
    expect(conseil.champsRemplaces).toContain("F1201.metier_simplement");
    expect(conseil.pistes[0].metierSimplement.origine).toBe("gabarit");
    expect(conseil.pistes[1].metierSimplement.origine).toBe("llm");
  });

  it("un lien inventé est retiré : le reste du texte du modèle est gardé, sans gabarit", async () => {
    const s = copie();
    s.pistes[0].pourquoi_parent[0].rappel = "il adore le foot";
    const { conseil } = await lancer([sortie(s), sortie(s)]).promesse;
    expect(conseil.source).toBe("llm");
    const p = conseil.pistes[0].pourquoiParent;
    expect(p.origine).toBe("llm");
    expect(p.liens).toHaveLength(valide.pistes[0].pourquoi_parent.length - 1);
    expect(p.texte).not.toContain("foot");
    expect(conseil.champsRemplaces).toContain("F1201.pourquoi_parent");
  });

  it("un rappel qui colle deux réponses est coupé ; la virgule de la citation est rendue", async () => {
    const s = copie();
    s.pistes[0].pourquoi_parent[0] = {
      reponses: ["seul_groupe=groupe", "rester_assis=besoin_de_bouger"],
      rappel: "il est plus à l'aise en groupe et il n'aime pas rester assis",
      metier: "il passe ses journées avec les ouvriers, les artisans et les sous-traitants",
      faits: ["F1201.d4"],
    };
    s.pistes[0].pourquoi_parent[1].rappel =
      "sa plus grande fierté c'est d'avoir organisé, tout seul, un week-end entre copains";
    const { conseil } = await lancer([sortie(s), sortie(s)]).promesse;
    const liens = conseil.pistes[0].pourquoiParent.liens;
    expect(conseil.pistes[0].pourquoiParent.origine).toBe("llm");
    expect(liens[0].reponses).toHaveLength(1);
    expect(["il est plus à l'aise en groupe", "il n'aime pas rester assis"]).toContain(
      liens[0].rappel,
    );
    expect(liens[1].rappel).toMatch(/^sa plus grande fierté, c'est d'avoir organisé/);
  });

  it("délai dépassé : un appel, repli, pas de relance", async () => {
    const { promesse, fournisseur } = lancer([{ type: "delai" }], { delais: { appelMs: 20 } });
    const { conseil } = await promesse;
    expect(fournisseur.requetes).toHaveLength(1);
    expect(conseil.motifRepli).toBe("delai");
  });

  it("HTTP 429 puis valide : deux appels, conseil « llm »", async () => {
    const { promesse, fournisseur } = lancer([
      { type: "erreur", erreur: new ErreurLlm("http", 429, true) },
      sortie(valide),
    ]);
    const { conseil } = await promesse;
    expect(fournisseur.requetes).toHaveLength(2);
    expect(conseil.source).toBe("llm");
  });

  it("HTTP 401 : pas de relance, repli « http »", async () => {
    const { promesse, fournisseur } = lancer([
      { type: "erreur", erreur: new ErreurLlm("http", 401, false) },
    ]);
    expect((await promesse).conseil.motifRepli).toBe("http");
    expect(fournisseur.requetes).toHaveLength(1);
  });

  it("pas de relance si plus de 40 s se sont écoulées ; relance jusqu'à 40 s", async () => {
    const essai = async (pas: number) => {
      let t = 0;
      const etapes: EtapeMock[] = [sortie(texteInvalide()), sortie(correction(0, "F1201"))];
      const f = new FournisseurMock({ type: "sequence", etapes });
      const generer = f.generer.bind(f);
      f.generer = async (r, sig) => {
        t += pas;
        return generer(r, sig);
      };
      await conseiller(reponses, {
        config,
        index,
        fournisseur: f,
        maintenant: () => t,
        journal: () => {},
      });
      return f.requetes.length;
    };
    expect(await essai(39_000)).toBe(2);
    let t = 0;
    const maintenant = () => t;
    const etapes: EtapeMock[] = [sortie(texteInvalide()), sortie(valide)];
    const fournisseur = new FournisseurMock({ type: "sequence", etapes });
    const generer = fournisseur.generer.bind(fournisseur);
    fournisseur.generer = async (r, sig) => {
      t += 41_000;
      return generer(r, sig);
    };
    const { conseil } = await conseiller(reponses, {
      config,
      index,
      fournisseur,
      maintenant,
      journal: () => {},
    });
    expect(fournisseur.requetes).toHaveLength(1);
    expect(conseil.champsRemplaces).toContain("F1201.metier_simplement");
  });
});

describe("budget (§9.1)", () => {
  const budget = (b: Partial<ConfigBudget>): ConfigBudget => ({
    total: 150,
    parts: { essai: 8, etiquetage: 40, evaluation: 84 },
    reserve: false,
    ...b,
  });

  it("budget atteint (total ou part) : aucun appel, repli « budget »", async () => {
    for (const b of [
      budget({ total: 0 }),
      budget({ parts: { essai: 0, etiquetage: 40, evaluation: 84 } }),
    ]) {
      const { promesse, fournisseur } = lancer(
        [sortie(valide)],
        { compteur: new CompteurMemoire(b) },
        true,
      );
      const { conseil } = await promesse;
      expect(fournisseur.requetes).toHaveLength(0);
      expect(conseil.motifRepli).toBe("budget");
    }
  });

  it("un appel échoué reste compté", async () => {
    const compteur = new CompteurMemoire();
    const erreur = { type: "erreur", erreur: new ErreurLlm("http", 503, true) } as const;
    const { promesse } = lancer([erreur, erreur], { compteur }, true);
    const { conseil } = await promesse;
    expect(conseil.appels).toBe(2);
    expect((await compteur.etat()).total.utilises).toBe(2);
  });

  it("le mock ne consomme rien", async () => {
    const compteur = new CompteurMemoire();
    await lancer([sortie(valide)], { compteur }).promesse;
    expect((await compteur.etat()).total.utilises).toBe(0);
  });
});

describe("journal sans donnée personnelle (§9.3)", () => {
  it("ne contient ni prénom, ni mot des réponses écrites, ni citation, ni texte produit", async () => {
    const r = reponsesSchema.parse(profils.profils.complet);
    const lignes: LigneJournal[] = [];
    const fournisseur = new FournisseurMock({
      type: "sequence",
      etapes: [sortie(copie()), sortie(copie())],
    });
    await conseiller(r, {
      config,
      index,
      fournisseur,
      journal: (l) => lignes.push(l),
      bilanId: "bilan-42",
    });
    const texte = JSON.stringify(lignes).toLowerCase();
    expect(lignes.length).toBeGreaterThan(0);
    for (const interdit of [
      "lucas",
      "scooter",
      "mobylette",
      "copains",
      "chantier",
      "aise",
      "dont il",
    ]) {
      expect(texte).not.toContain(interdit);
    }
    expect(lignes[0].bilan).toMatch(/^[0-9a-f]{12}$/);
    expect(lignes[0].bilan).not.toContain("bilan-42");
  });
});

describe("écartés après le choix du LLM (§7.4)", () => {
  it("un métier choisi n'est plus écarté (A1221)", () => {
    const resultat = resultatAvecPistes(reponses, ["A1221", "F1201", "G1802"], index);
    expect(resultat.pistes.map((p) => p.code_rome)).toEqual(["A1221", "F1201", "G1802"]);
    expect(resultat.ecartes.some((e) => e.code_rome === "A1221")).toBe(false);
  });

  it("une variante cite toujours une piste finale, jamais une piste du calcul seul abandonnée", async () => {
    const { conseil, resultat } = await lancer([sortie(valide)]).promesse;
    const finales = new Set(conseil.pistes.map((p) => p.code_rome));
    for (const e of resultat.ecartes) {
      if (e.raison.code === "variante") expect(finales.has(e.raison.de)).toBe(true);
    }
    for (const e of conseil.ecartes) expect(e.raison).not.toContain("Chargé d'affaires BTP");
  });

  it("les raisons des écartés sont écrites par le code : le LLM ne les rédige plus", async () => {
    const { conseil, charge } = await lancer([sortie(valide)]).promesse;
    expect(conseil.ecartes.length).toBeGreaterThan(0);
    for (const e of conseil.ecartes) expect(e.origine).toBe("gabarit");
    const commun = charge.ecartes.find((x) => conseil.ecartes.some((e) => e.code_rome === x.code));
    expect(commun).toBeDefined();
    expect(conseil.ecartes.find((e) => e.code_rome === commun?.code)?.raison).toBe(
      commun?.phrase_de_base,
    );
  });
});
