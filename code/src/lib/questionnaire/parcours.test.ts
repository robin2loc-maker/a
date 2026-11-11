import { describe, expect, it } from "vitest";
import { questionParId, QUESTIONS } from "./definition";
import {
  bilanObservation,
  champsAffiches,
  conditionVraie,
  dureeEstimeeSecondes,
  estRepondue,
  optionsAffichees,
  parcours,
  PARCOURS_TYPES,
  rangDansLeParcours,
  totalQuestions,
  varianteAffichee,
} from "./parcours";
import { reponsesVides, type Reponses } from "./reponses";
import type { Question } from "./types";

const avec = (valeurs: Record<string, string | string[]>): Reponses => ({
  ...reponsesVides(),
  ...valeurs,
});

function question(id: string): Question {
  const q = questionParId(id);
  if (q === undefined) throw new Error(`question inconnue : ${id}`);
  return q;
}

const idsOptions = (id: string, cle: string, reponses: Reponses) => {
  const champ = varianteAffichee(question(id), reponses).champs.find((c) => c.cle === cle);
  if (champ === undefined) throw new Error(`champ ${cle} absent`);
  return optionsAffichees(champ, reponses).map((o) => o.id);
};

describe("nombre de questions", () => {
  it("28 au plus, tant que la situation n'est pas connue", () => {
    expect(totalQuestions(reponsesVides())).toBe(28);
  });

  it.each(PARCOURS_TYPES.map((p) => [p.nom, p.reponses] as const))(
    "%s : entre 25 et 32 questions",
    (_nom, reponses) => {
      const n = totalQuestions(reponses);
      expect(n).toBeGreaterThanOrEqual(25);
      expect(n).toBeLessThanOrEqual(32);
    },
  );

  it("27 en Seconde et en « autre situation » (Q3 sautée), 28 sinon", () => {
    expect(totalQuestions(avec({ situation: "seconde" }))).toBe(27);
    expect(totalQuestions(avec({ situation: "autre" }))).toBe(27);
    expect(totalQuestions(avec({ situation: "bac_pro" }))).toBe(28);
    for (const { nom, reponses } of PARCOURS_TYPES) {
      const attendu = ["Seconde", "Autre situation"].includes(nom) ? 27 : 28;
      expect(totalQuestions(reponses), nom).toBe(attendu);
    }
    expect(rangDansLeParcours(question("seul_groupe"), avec({ situation: "seconde" }))).toBe(3);
    expect(
      rangDansLeParcours(question("situation_detail"), avec({ situation: "seconde" })),
    ).toBeNull();
  });

  it("chaque question affichée a une variante dont la condition est vraie, dans chaque situation", () => {
    for (const { nom, reponses } of PARCOURS_TYPES) {
      for (const { question: q } of parcours(reponses)) {
        const trouvee = q.variantes.some(
          (v) => v.si === undefined || conditionVraie(v.si, reponses),
        );
        expect(trouvee, `${nom}, Q${q.numero}`).toBe(true);
      }
    }
  });
});

describe("durée estimée", () => {
  it.each(PARCOURS_TYPES.map((p) => [p.nom, p.reponses] as const))(
    "%s : entre 8 et 12 minutes",
    (_nom, reponses) => {
      const secondes = dureeEstimeeSecondes(reponses);
      expect(secondes).toBeGreaterThanOrEqual(8 * 60);
      expect(secondes).toBeLessThanOrEqual(12 * 60);
    },
  );

  it("retrouve les durées de la conception (questions ouvertes §5, réserve R1)", () => {
    const total = QUESTIONS.reduce(
      (s, q) => s + q.variantes[q.variantes.length - 1].dureeSecondes,
      0,
    );
    // Somme des 28 questions, Q3 en variante « Après le bac » (33 s) au lieu des spécialités (27 s) :
    // 643 s en v2, + 21 (Q5) + 12 (Q6) − 17 (Q7) − 15 (Q14) + 1 (Q20).
    expect(total - 33 + 27).toBe(645);
    const duree = (q: string) => (id: string) =>
      question(q).variantes.find((v) => v.id === id)?.dureeSecondes;
    expect(duree("temps_libre")("principale")).toBe(57);
    expect(duree("temps_libre")("apres_bac")).toBe(59);
    expect(duree("aide_demandee")("principale")).toBe(48);
    expect(duree("fierte")("principale")).toBe(62);
    // v2 + 8 s : + 21 (Q5) + 12 (Q6) − 32 (Q7, Q14) + 1 (Q20) + 6 (transition).
    expect(dureeEstimeeSecondes(avec({ situation: "terminale_generale" }))).toBe(11 * 60 + 27);
    expect(dureeEstimeeSecondes(avec({ situation: "seconde" }))).toBe(11 * 60);
    expect(
      dureeEstimeeSecondes(avec({ situation: "deja_bac", apres_bac_formation: "licence" })),
    ).toBe(11 * 60 + 42);
    const parType = Object.fromEntries(
      PARCOURS_TYPES.map((p) => [p.nom, dureeEstimeeSecondes(p.reponses)]),
    );
    expect(parType).toEqual({
      "Première générale (spécialités)": 11 * 60 + 27,
      "Terminale générale (spécialités)": 11 * 60 + 27,
      "Première ou Terminale technologique": 11 * 60 + 13,
      "Bac pro": 11 * 60 + 23,
      "A déjà le bac, après une formation (réorientation)": 11 * 60 + 42,
      "A déjà le bac, sans formation après": 11 * 60 + 35,
      Seconde: 11 * 60,
      "Autre situation": 11 * 60,
    });
  });
});

describe("variantes et options conditionnelles", () => {
  it("Q3 : spécialités (3 en Première, 2 en Terminale), série, bac pro, après le bac", () => {
    const q3 = question("situation_detail");
    expect(varianteAffichee(q3, avec({ situation: "premiere_generale" })).id).toBe(
      "specialites_premiere",
    );
    expect(varianteAffichee(q3, avec({ situation: "terminale_generale" })).id).toBe(
      "specialites_terminale",
    );
    expect(varianteAffichee(q3, avec({ situation: "premiere_techno" })).id).toBe("serie");
    expect(varianteAffichee(q3, avec({ situation: "bac_pro" })).id).toBe("bac_pro");
    expect(varianteAffichee(q3, avec({ situation: "deja_bac" })).id).toBe("apres_bac");
  });

  it("Q3 : « Aucune après le bac » seulement pour un enfant qui a arrêté ses études (R9)", () => {
    const base = { situation: "deja_bac" };
    expect(idsOptions("situation_detail", "apres_bac_formation", avec(base))).not.toContain(
      "aucune",
    );
    expect(
      idsOptions(
        "situation_detail",
        "apres_bac_formation",
        avec({ ...base, apres_bac_activite: "premiere_annee" }),
      ),
    ).not.toContain("aucune");
    expect(
      idsOptions(
        "situation_detail",
        "apres_bac_formation",
        avec({ ...base, apres_bac_activite: "arrete" }),
      ),
    ).toContain("aucune");
  });

  it("Q22 : « après le bac » si une formation a été suivie, « au lycée » au passé sinon", () => {
    const q22 = question("scolarite");
    expect(varianteAffichee(q22, avec({ situation: "terminale_generale" })).id).toBe("lycee");
    expect(varianteAffichee(q22, avec({ situation: "deja_bac" })).id).toBe("lycee_passe");
    expect(
      varianteAffichee(q22, avec({ situation: "deja_bac", apres_bac_formation: "aucune" })).id,
    ).toBe("lycee_passe");
    expect(
      varianteAffichee(q22, avec({ situation: "deja_bac", apres_bac_formation: "bts" })).id,
    ).toBe("apres_bac");
  });

  it("Q5, Q12, Q21, Q23 : variante « après le bac » pour un enfant qui a le bac", () => {
    for (const id of ["temps_libre", "obtenir", "matieres", "annees_etudes"]) {
      expect(varianteAffichee(question(id), avec({ situation: "deja_bac" })).id, id).toBe(
        "apres_bac",
      );
      expect(varianteAffichee(question(id), avec({ situation: "seconde" })).id, id).toBe(
        "principale",
      );
    }
  });

  it("options conditionnelles : son travail, philosophie, atelier", () => {
    expect(idsOptions("temps_libre", "temps_libre", avec({ situation: "seconde" }))).not.toContain(
      "son_travail",
    );
    expect(idsOptions("temps_libre", "temps_libre", avec({ situation: "deja_bac" }))).toContain(
      "son_travail",
    );
    const matieres = (situation: string) => idsOptions("matieres", "matieres", avec({ situation }));
    expect(matieres("premiere_generale")).not.toContain("philosophie");
    expect(matieres("terminale_techno")).toContain("philosophie");
    expect(matieres("deja_bac")).toContain("philosophie");
    expect(matieres("bac_pro")).toContain("atelier");
    expect(matieres("terminale_generale")).not.toContain("atelier");
  });

  it("conditions composées", () => {
    const r = avec({ situation: "deja_bac", apres_bac_formation: "bts" });
    expect(conditionVraie({ non: { cle: "situation", parmi: ["seconde"] } }, r)).toBe(true);
    expect(
      conditionVraie(
        {
          tous: [
            { cle: "situation", parmi: ["deja_bac"] },
            { cle: "apres_bac_formation", parmi: ["licence"] },
          ],
        },
        r,
      ),
    ).toBe(false);
    expect(conditionVraie({ cle: "inconnue", parmi: ["x"] }, r)).toBe(false);
  });
});

describe("écran de fin (Q4 à Q20)", () => {
  const observation = QUESTIONS.filter((q) => q.numero >= 4 && q.numero <= 20);

  /** Répond aux `n` premières questions d'observation (premier champ, première option). */
  function repondreA(n: number): Reponses {
    const reponses = avec({ situation: "seconde" });
    for (const q of observation.slice(0, n)) {
      const champ = varianteAffichee(q, reponses).champs[0];
      if (champ.type === "choix_unique") reponses[champ.cle] = champ.options[0]?.id ?? "";
      if (champ.type === "choix_multiple") reponses[champ.cle] = [champ.options[0]?.id ?? ""];
    }
    return reponses;
  }

  it("compte 15 questions d'observation (Q7 et Q14 retirées)", () => {
    expect(observation).toHaveLength(15);
    expect(bilanObservation(repondreA(15))).toEqual({
      repondues: 15,
      passees: 0,
      manque: 0,
      cas: "general",
    });
  });

  it("6 questions passées ou plus, au moins 8 réponses : message doux", () => {
    expect(bilanObservation(repondreA(10)).cas).toBe("general");
    expect(bilanObservation(repondreA(9))).toEqual({
      repondues: 9,
      passees: 6,
      manque: 0,
      cas: "doux",
    });
    expect(bilanObservation(repondreA(8)).cas).toBe("doux");
  });

  it("moins de 8 réponses : message ferme, avec le nombre qui manque", () => {
    expect(bilanObservation(repondreA(5))).toEqual({
      repondues: 5,
      passees: 10,
      manque: 3,
      cas: "ferme",
    });
    expect(bilanObservation(repondreA(0)).manque).toBe(8);
  });
});

describe("phrases libres (questions ouvertes §2)", () => {
  const q6 = () => question("aide_demandee");
  const champsVus = (reponses: Reponses) =>
    champsAffiches(varianteAffichee(q6(), reponses), reponses).map((c) => c.cle);

  it("Q5, Q6 et Q20 ont chacune une phrase libre, sans effet sur le score", () => {
    for (const [id, cle] of [
      ["temps_libre", "temps_libre_precis"],
      ["aide_demandee", "aide_exemple"],
      ["fierte", "fierte_recit"],
    ] as const) {
      for (const v of question(id).variantes) {
        const champ = v.champs.find((c) => c.cle === cle);
        expect(champ?.type, `${id}/${v.id}`).toBe("texte");
        if (champ?.type === "texte") {
          expect(champ.longueurMax).toBe(140);
          expect(
            champ.effets !== "neutre" && champ.effets.every((e) => e.type === "contexte"),
          ).toBe(true);
        }
        expect(v.avanceAuto, `${id}/${v.id}`).toBe(false);
      }
    }
  });

  it("aide_exemple est masqué quand « Pas une chose plus qu'une autre » est cochée", () => {
    expect(champsVus(avec({}))).toEqual(["aide_demandee", "aide_exemple"]);
    expect(champsVus(avec({ aide_demandee: ["reparer"] }))).toEqual([
      "aide_demandee",
      "aide_exemple",
    ]);
    expect(champsVus(avec({ aide_demandee: ["rien_de_particulier"] }))).toEqual(["aide_demandee"]);
  });

  it("un écran dont seule la phrase libre est remplie compte comme répondu", () => {
    const etape = { question: q6(), variante: varianteAffichee(q6(), avec({})) };
    expect(estRepondue(etape, avec({ aide_exemple: "Pour réparer le vélo de son frère" }))).toBe(
      true,
    );
    expect(estRepondue(etape, avec({}))).toBe(false);
  });
});
