import { describe, expect, it } from "vitest";
import { decoderJeton, encoderJeton } from "@/lib/jeton-signe";
import { schemaReponses as schemaStockage } from "@/lib/stockage/types";
import { optionsAffichees, parcours, PARCOURS_TYPES } from "./parcours";
import { CODES_DEPARTEMENTS, reponsesSchema, reponsesVides, type Reponses } from "./reponses";

/** Un parent qui répond à tout : la première option affichée de chaque champ. */
function reponsesCompletes(base: Reponses): Reponses {
  const reponses: Reponses = { ...base };
  for (const { variante } of parcours(reponses)) {
    for (const champ of variante.champs) {
      if (reponses[champ.cle] !== undefined) continue;
      const premiere = optionsAffichees(champ, reponses).find((o) => !o.exclusive)?.id ?? "";
      switch (champ.type) {
        case "choix_unique":
          reponses[champ.cle] = premiere;
          break;
        case "choix_multiple":
          reponses[champ.cle] = [premiere];
          break;
        case "texte":
          reponses[champ.cle] =
            champ.cle === "prenom" ? "Anaïs" : "Le jour où elle a monté la cabane";
          break;
        case "departement":
          reponses[champ.cle] = "2A";
          break;
        case "metiers":
          reponses[champ.cle] = ["véto", "sage-femme"];
          reponses[champ.cleAppellations] = ["20672"];
          break;
      }
    }
  }
  return reponses;
}

const erreurs = (valeur: unknown): string[] => {
  const resultat = reponsesSchema.safeParse(valeur);
  return resultat.success ? [] : resultat.error.issues.map((i) => i.message);
};

describe("schéma des réponses", () => {
  it.each(PARCOURS_TYPES.map((p) => [p.nom, p.reponses] as const))(
    "%s : un questionnaire complet est valide",
    (_nom, base) => {
      expect(erreurs(reponsesCompletes(base))).toEqual([]);
    },
  );

  it("accepte des réponses partielles et des questions passées", () => {
    expect(erreurs(reponsesVides())).toEqual([]);
    expect(
      erreurs({ ...reponsesVides(), genre: "il", passees: ["temps_libre", "fierte"] }),
    ).toEqual([]);
  });

  it("passe dans un jeton signé et revient identique", () => {
    const reponses = reponsesCompletes(PARCOURS_TYPES[4].reponses);
    const jeton = encoderJeton(reponses, "cle-de-test");
    const relu = reponsesSchema.parse(decoderJeton(jeton, "cle-de-test"));
    expect(relu).toEqual(reponses);
    expect(jeton.length).toBeLessThan(2000);
  });

  it("est compatible avec le stockage (src/lib/stockage/types.ts)", () => {
    const reponses = reponsesCompletes(PARCOURS_TYPES[0].reponses);
    expect(schemaStockage.safeParse(reponses).success).toBe(true);
  });

  it("refuse ce qui ne correspond pas à la définition", () => {
    const base = reponsesVides();
    expect(erreurs({ ...base, version: 1 })).toEqual(["version 3 attendue"]);
    expect(erreurs({ ...base, passees: ["inconnue"] })).toEqual([
      "passees : question inconnue « inconnue »",
    ]);
    expect(erreurs({ ...base, couleur: "bleu" })).toEqual(["clé inconnue « couleur »"]);
    expect(erreurs({ ...base, seul_groupe: "parfois" })).toEqual(["seul_groupe : option inconnue"]);
    expect(erreurs({ ...base, seul_groupe: ["seul"] })).toEqual(["seul_groupe : option inconnue"]);
    expect(erreurs({ ...base, aide_demandee: ["reparer", "creer", "vendre"] })).toEqual([
      "aide_demandee : 3 choix pour 2 au plus",
    ]);
    expect(erreurs({ ...base, refus: ["nuit", "rien"] })).toEqual([
      "refus : une option exclusive est cochée avec d'autres",
    ]);
    expect(erreurs({ ...base, temps_libre: ["sport", "sport"] })).toEqual([
      "temps_libre : valeur en double",
    ]);
    expect(erreurs({ ...base, departement: "20" })).toEqual(["departement : département inconnu"]);
    expect(erreurs({ ...base, fierte_recit: "x".repeat(141) })).toEqual([
      "fierte_recit : texte de 140 caractères au plus attendu",
    ]);
    expect(erreurs({ ...base, metier_evoque_appellations: ["abc"] })).toEqual([
      "metier_evoque_appellations : valeur invalide « abc »",
    ]);
    expect(erreurs({ ...base, metier_evoque: ["a", "b", "c"] })).toEqual([
      "metier_evoque : 3 choix pour 2 au plus",
    ]);
  });

  it("version 3 : refuse une réponse de version 2 et les questions retirées (Q7, Q14)", () => {
    const base = reponsesVides();
    expect(erreurs({ ...base, version: 2 })).toEqual(["version 3 attendue"]);
    expect(erreurs({ ...base, mains_tete: "mains" })).toEqual(["clé inconnue « mains_tete »"]);
    expect(erreurs({ ...base, passees: ["ecrit_oral"] })).toEqual([
      "passees : question inconnue « ecrit_oral »",
    ]);
  });

  it("nettoie les phrases libres : non-réponse retirée, passage de santé retiré (questions ouvertes §3)", () => {
    const relu = reponsesSchema.parse({
      ...reponsesVides(),
      prenom: "Lucas",
      temps_libre_precis: "  je sais pas ",
      aide_exemple: "Pour réparer le vélo de son frère. Il a un TDAH.",
      fierte_recit: "Le jour où il a eu son brevet malgré sa dyslexie.",
    });
    expect(relu).toEqual({
      ...reponsesVides(),
      prenom: "Lucas",
      aide_exemple: "Pour réparer le vélo de son frère.",
    });
  });

  it("garde le texte d'un champ masqué, sans erreur (Q6, « Pas une chose plus qu'une autre »)", () => {
    const reponses = {
      ...reponsesVides(),
      aide_demandee: ["rien_de_particulier"],
      aide_exemple: "Pour réparer le vélo de son frère",
    };
    expect(reponsesSchema.parse(reponses)).toEqual(reponses);
  });

  it("garde une réponse devenue sans objet (spécialités de Première après un passage en Terminale)", () => {
    const reponses = {
      ...reponsesVides(),
      situation: "terminale_generale",
      specialites: ["maths", "svt", "ses"],
    };
    expect(erreurs(reponses)).toEqual([]);
  });

  it("connaît les 101 départements", () => {
    expect(CODES_DEPARTEMENTS).toHaveLength(101);
    expect(CODES_DEPARTEMENTS).toEqual(
      expect.arrayContaining(["01", "2A", "2B", "95", "971", "976"]),
    );
    expect(CODES_DEPARTEMENTS).not.toContain("20");
    expect(CODES_DEPARTEMENTS).not.toContain("975");
  });
});
