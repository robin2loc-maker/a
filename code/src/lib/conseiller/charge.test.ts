/**
 * Charge envoyée au LLM (conseiller-ia.md §3, §10.1, §10.2).
 */
import { describe, expect, it } from "vitest";
import { chargerIndexMoteur } from "@/lib/moteur/donnees";
import { QUESTIONS } from "@/lib/questionnaire/definition";
import { reponsesSchema } from "@/lib/questionnaire/reponses";
import profils from "../../../tests/fixtures/profils-conseiller.json";
import reference from "../../../tests/fixtures/profils-reference.json";
import {
  construireCharge,
  decouperDefinition,
  definitionCorrigee,
  nettoyerTexteLibre,
  seuilsSalaire,
  niveauSalaire,
} from "./charge";
import { schemaSortie } from "./schema";

const index = chargerIndexMoteur();
const exemple = construireCharge(reponsesSchema.parse(profils.profils.exemple_recit), { index });
const complet = construireCharge(reponsesSchema.parse(profils.profils.complet), { index });
const json = JSON.stringify(complet.envoi);

describe("aucune donnée identifiante ni chiffre de marché", () => {
  it("ni prénom, ni département, ni mobilité, ni code OGR", () => {
    expect(json).not.toMatch(/lucas/i);
    expect(json).toContain("[prénom]");
    expect(json).not.toMatch(/"(?:departement|mobilite|prenom|genre)/);
    expect(json).not.toMatch(/metier_evoque_appellations/);
  });

  it("ni montant, ni projets, ni pourcentage, ni établissement, ni score", () => {
    expect(json).not.toMatch(
      /€|%|"montant|"projets"|"tauxAcces"|"etablissement"|"commune"|"score"|"affinite"/,
    );
    for (const k of complet.candidats.values()) {
      expect(json).not.toContain(`"${k.metier.salaire.montant_min}"`);
    }
  });

  it("n'envoie plus le drapeau piste_du_calcul", () => {
    expect(json).not.toContain("piste_du_calcul");
    expect(json).not.toContain("pisteDuRepli");
  });

  it("nettoie emails, liens, téléphones, longs nombres et prénom (« d'Anaïs » compris)", () => {
    expect(nettoyerTexteLibre("écrire à a.b@c.fr ou au 06 12 34 56 78", null)).toBe(
      "écrire à [email] ou au [téléphone]",
    );
    expect(nettoyerTexteLibre("voir www.exemple.fr, code 123456", null)).toBe(
      "voir [lien] code [nombre]",
    );
    expect(nettoyerTexteLibre("le vélo d'Anaïs et ANAIS", "Anaïs")).toBe(
      "le vélo d'[prénom] et [prénom]",
    );
  });
});

describe("réponses envoyées", () => {
  const parId = (c: typeof complet, id: string) => c.envoi.reponses.find((r) => r.id === id);

  it("des identifiants uniques", () => {
    const ids = complet.envoi.reponses.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("les refus sont envoyés non citables, interdits à l'enfant", () => {
    expect(parId(complet, "refus=vente")).toMatchObject({ citable: false, enfant: false });
  });

  it("une option sans citation est envoyée non citable", () => {
    expect(parId(complet, "adultes_inconnus=poli")).toMatchObject({
      citable: false,
      enfant: false,
    });
    expect(parId(complet, "scolarite=bien")).toMatchObject({ citable: false, enfant: false });
  });

  it("« facile à rester assis » n'est citable que pour un métier de bureau", () => {
    const r = construireCharge(
      reponsesSchema.parse({ ...profils.profils.complet, rester_assis: "facile" }),
      { index },
    );
    expect(parId(r, "rester_assis=facile")?.citable).toEqual({
      si_metier: "bureau_toute_la_journee",
    });
  });

  it("la durée d'études est une contrainte", () => {
    expect(parId(complet, "annees_etudes=trois_ans")?.contrainte).toBe(true);
    expect(parId(complet, "seul_groupe=deux_trois_amis")?.contrainte).toBe(false);
  });

  it("les champs libres portent leur amorce (2.4-6), celle de la fierté toujours (R1)", () => {
    expect(parId(complet, "temps_libre_precis")?.citation).toBe("il peut passer des heures à");
    expect(parId(complet, "aide_exemple")?.citation).toBe("on lui a demandé de l'aide pour");
    expect(parId(complet, "fierte_recit")?.citation).toBe("sa plus grande fierté, c'est");
    expect(parId(exemple, "fierte_recit")?.citation).toBe("sa plus grande fierté, c'est");
    expect(parId(complet, "temps_libre_precis")).toMatchObject({ citable: true, enfant: true });
    expect(json).not.toContain("probleme_exemple");
  });

  it("une option citable porte son trait enfant (R2)", () => {
    expect(parId(exemple, "imprevu=calme")).toBeUndefined();
    expect(parId(complet, "imprevu=calme")?.trait_enfant).toBe(
      "Tu gardes ton calme quand ça s'agite autour de toi",
    );
    // Une réponse écrite porte l'amorce de sa question, au tutoiement (passe qualité de 2.4).
    expect(parId(complet, "temps_libre_precis")?.trait_enfant).toBe("tu peux passer des heures à");
    expect(parId(complet, "fierte_recit")?.trait_enfant).toBeUndefined();
  });

  it("« besoin de bouger » n'est citable que pour un métier de terrain (conditions ROME)", () => {
    expect(parId(exemple, "rester_assis=besoin_de_bouger")?.citable).toEqual({
      si_metier: "terrain",
    });
    const drapeaux = (code: string) => exemple.candidats.get(code)?.envoye.drapeaux ?? [];
    expect(drapeaux("F1135")).toContain("terrain"); // sur chantier
    expect(drapeaux("G1802")).toContain("terrain"); // station debout prolongée
    const bureau = [...complet.candidats.values()].find(
      (k) => !k.envoye.drapeaux.includes("terrain"),
    );
    expect(bureau?.envoye.faits.find((f) => f.id.endsWith(".c"))?.texte ?? "").not.toMatch(
      /chantier|extérieur|déplacements|debout/,
    );
  });

  it("chaque candidat porte ses conditions de travail ROME (fait « c »), sans parenthèse ni chiffre", () => {
    const c = exemple.candidats.get("G1802")?.envoye.faits.find((f) => f.id === "G1802.c");
    expect(c?.texte).toMatch(/^Conditions de travail : .*station debout prolongée.*\.$/);
    for (const k of complet.candidats.values()) {
      const fait = k.envoye.faits.find((f) => f.id.endsWith(".c"))?.texte ?? "";
      expect(fait).not.toMatch(/[()\d]/);
    }
  });

  it("chaque réponse connaît sa question (T30) : une case et sa précision écrite vont ensemble", () => {
    expect(complet.questions.get("temps_libre=bricoler")).toBe(
      complet.questions.get("temps_libre_precis"),
    );
    expect(complet.questions.get("fierte_recit")).toBe("fierte");
    expect(complet.questions.get("seul_groupe=deux_trois_amis")).not.toBe("fierte");
  });

  it("un champ libre marqué enfant: false est envoyé comme tel, sans changement de code", () => {
    const q = QUESTIONS.find((x) => x.id === "temps_libre");
    const champ = q?.variantes[0].champs.find((c) => c.cle === "temps_libre_precis");
    expect(champ?.type).toBe("texte");
    if (champ?.type !== "texte") return;
    champ.enfant = false;
    try {
      const c = construireCharge(reponsesSchema.parse(profils.profils.complet), { index });
      expect(c.envoi.reponses.find((r) => r.id === "temps_libre_precis")?.enfant).toBe(false);
    } finally {
      delete champ.enfant;
    }
  });

  it("une question passée est listée par son titre", () => {
    const r = reponsesSchema.parse({ ...profils.profils.complet, passees: ["week_end"] });
    const c = construireCharge(r, { index });
    expect(c.envoi.passees.some((t) => t.includes("week-end"))).toBe(true);
    expect(c.envoi.reponses.some((x) => x.id.startsWith("week_end="))).toBe(false);
  });
});

describe("candidats", () => {
  const f1201 = exemple.candidats.get("F1201")?.envoye;

  it("F1201 : définition corrigée, faits d, p, e, x, condition d'expérience, souvent proposé", () => {
    expect(f1201).toBeDefined();
    const ids = f1201?.faits.map((f) => f.id) ?? [];
    expect(ids).toEqual(
      expect.arrayContaining(["F1201.d1", "F1201.d8", "F1201.p1", "F1201.e", "F1201.x"]),
    );
    expect(f1201?.faits[0].texte).toContain("dont il coordonne");
    expect(f1201?.etudes.condition_experience).toMatch(/expérience professionnelle/);
    expect(f1201?.souvent_propose).toBe(true);
    expect(f1201?.incompatibles).toContain("F1135");
  });

  it("aucune définition ne garde une faute « ils … e » après corrections", () => {
    for (const m of index.metiers) expect(definitionCorrigee(m)).not.toMatch(/\bils [a-zéèê]+e\b/);
  });

  it("découpe une définition sans point après sa première phrase", () => {
    expect(
      decouperDefinition(
        "Le X fait ceci pour les gens Identifie les besoins Organise des réunions",
      ),
    ).toEqual(["Le X fait ceci pour les gens", "Identifie les besoins", "Organise des réunions"]);
  });

  it("positions de 1 à 20, dans l'ordre du rang", () => {
    const positions = exemple.envoi.candidats.map((c) => c.position);
    expect(positions).toEqual(positions.map((_, i) => i + 1));
    const rangs = exemple.envoi.candidats.map((c) => c.rang);
    expect([...rangs].sort((a, b) => a - b)).toEqual(rangs);
  });

  it("terciles de salaire : chacun compte un tiers des métiers", () => {
    seuilsSalaire(index);
    const comptes = { bas: 0, moyen: 0, haut: 0 };
    for (const m of index.metiers) {
      const n = niveauSalaire(m, index);
      if (n) comptes[n] += 1;
    }
    const total = comptes.bas + comptes.moyen + comptes.haut;
    for (const v of Object.values(comptes)) {
      expect(v).toBeGreaterThan(total / 3 - 25);
      expect(v).toBeLessThan(total / 3 + 25);
    }
  });

  it("seuls les écartés reformulables sont envoyés (jamais la variante ni le marché)", () => {
    const motifs = new Set(exemple.envoi.ecartes.map((e) => e.motif));
    for (const m of motifs)
      expect(["etudes_niveau", "formations", "refus", "encadrement"]).toContain(m);
    expect(exemple.envoi.ecartes.some((e) => e.code === "A1221")).toBe(false);
  });
});

describe("reproductibilité et taille", () => {
  it("même charge, octet pour octet, pour les mêmes réponses", () => {
    const encore = construireCharge(reponsesSchema.parse(profils.profils.complet), { index });
    expect(JSON.stringify(encore.envoi)).toBe(json);
  });

  it("charge du profil complet sous 70 Ko (JSON compact)", () => {
    expect(json.length).toBeLessThan(70_000);
  });

  it("charge constructible sans genre ni prénom (profil de référence « exemple »)", () => {
    const c = construireCharge(reference.profils.exemple.reponses as never, { index });
    expect(c.envoi.pronom).toBe("il");
    expect(c.envoi.coeur).toEqual({ dimension: "organiser", reponse: "fierte=organise" });
  });
});

describe("schéma de sortie (§10.2)", () => {
  const schema = schemaSortie(complet) as {
    properties: {
      pistes: { minItems: number; maxItems: number; items: { properties: Record<string, never> } };
    };
  };
  const pistes = schema.properties.pistes;
  const props = pistes.items.properties as Record<
    string,
    { items?: { properties: Record<string, { items: { enum: string[] } }> }; enum?: string[] }
  >;

  it("énumère exactement les codes de la présélection, N pistes", () => {
    expect(props.code.enum).toEqual(complet.envoi.candidats.map((c) => c.code));
    expect(pistes.minItems).toBe(complet.envoi.nombre_de_pistes);
    expect(pistes.maxItems).toBe(complet.envoi.nombre_de_pistes);
  });

  const enumDe = (champ: "pourquoi_parent" | "pourquoi_enfant", cle: string) =>
    (props[champ].items?.properties[cle] as unknown as { enum: string[] }).enum;

  it("l'énumération des réponses enfant exclut refus, scolarité et options non citables", () => {
    const enfant = enumDe("pourquoi_enfant", "reponse");
    expect(enfant).not.toContain("refus=vente");
    expect(enfant).not.toContain("scolarite=bien");
    expect(enfant).toContain("imprevu=calme");
    expect(enumDe("pourquoi_parent", "reponse")).toContain("refus=vente");
  });

  it("un lien cite une réponse, et au plus une précision écrite (passe qualité de 2.4)", () => {
    const precision = enumDe("pourquoi_parent", "precision");
    expect(precision).toContain("temps_libre_precis");
    expect(precision).toContain("");
    expect(precision).not.toContain("imprevu=calme");
    expect(schema.properties).not.toHaveProperty("ecartes");
  });
});
