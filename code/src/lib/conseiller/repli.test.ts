/**
 * Gabarits (conseiller-ia.md §7.3, §10.5) : ils passent le même validateur
 * que le LLM, avec les exceptions de la critique 2 (R4) : pour un texte
 * d'origine gabarit, T11 ne contrôle que la longueur composée, T14 n'exige
 * pas deux liens, V08 ne s'applique pas ; T28 est journalisé, pas bloquant.
 */
import { describe, expect, it } from "vitest";
import { conseiller as textes } from "@content/conseiller";
import { chargerIndexMoteur } from "@/lib/moteur/donnees";
import { panelAleatoire } from "@/lib/moteur/profils-aleatoires";
import { QUESTIONS } from "@/lib/questionnaire/definition";
import { accorder } from "@/lib/questionnaire/accords";
import { reponsesSchema } from "@/lib/questionnaire/reponses";
import profils from "../../../tests/fixtures/profils-conseiller.json";
import { construireCharge, interditeEnfant } from "./charge";
import { traitSansDeuxPoints } from "./composer";
import { phraseDeBase } from "./raisons";
import { metierSimplementGabarit, preuveEnMinuscule, sortieGabarits } from "./repli";
import { minusculeInitiale } from "./texte";
import type { CandidatInterne } from "./types";
import { echecsPiste, valider } from "./validateur";

const index = chargerIndexMoteur();

describe("les gabarits passent le validateur", () => {
  it("sur les 150 profils du panel aléatoire (graine 7) : aucun échec T01 à T29 hors T28", () => {
    const fautes: string[] = [];
    for (const [k, reponses] of panelAleatoire(7, 150).entries()) {
      const charge = construireCharge(reponses, { index });
      const sortie = sortieGabarits(charge);
      for (const e of valider(sortie, charge, { gabarit: true }).echecs) {
        if (e.nature === "texte" && e.code !== "T28")
          fautes.push(`profil ${k} : ${e.code} ${e.message}`);
      }
    }
    expect(fautes.slice(0, 10)).toEqual([]);
  }, 180_000);

  it("sur les profils du conseiller", () => {
    for (const p of Object.values(profils.profils)) {
      const charge = construireCharge(reponsesSchema.parse(p), { index });
      const echecs = valider(sortieGabarits(charge), charge, { gabarit: true }).echecs;
      expect(echecs.filter((e) => e.nature === "texte" && e.code !== "T28")).toEqual([]);
    }
  });

  it("« Le métier, simplement » des 545 métiers passe T05 à T11 (longueur : d1 seul au-delà de 420)", () => {
    const charge = construireCharge(reponsesSchema.parse(profils.profils.exemple_recit), { index });
    const modele = [...charge.candidats.values()][0];
    const fautes: string[] = [];
    for (const metier of index.metiers) {
      for (const genre of ["il", "elle"] as const) {
        const candidat = {
          ...modele,
          metier,
          libelle: metier.libelle,
          envoye: {
            ...modele.envoye,
            code: metier.code_rome,
            faits: [{ id: `${metier.code_rome}.d1`, texte: metier.definition }],
          },
        } as CandidatInterne;
        const texte = metierSimplementGabarit(candidat, genre);
        expect(texte.length).toBeGreaterThan(20);
        const echecs = echecsPiste(
          {
            code: metier.code_rome,
            raison_du_choix: "",
            metier_simplement: texte,
            ia_phrase: "",
            pourquoi_parent: [],
            pourquoi_enfant: [],
          },
          0,
          { ...charge, genre, candidats: new Map([[metier.code_rome, candidat]]) },
          { gabarit: true },
        ).filter((e) => ["T05", "T06", "T07", "T08", "T09", "T10", "T11"].includes(e.code));
        for (const e of echecs) fautes.push(`${metier.code_rome} ${genre} ${e.code} ${e.message}`);
      }
    }
    expect(fautes.slice(0, 10)).toEqual([]);
  });

  it("le gabarit de F1201 remplace le sujet et corrige « ils coordonne »", () => {
    const charge = construireCharge(reponsesSchema.parse(profils.profils.exemple_recit), { index });
    const texte = metierSimplementGabarit(charge.candidats.get("F1201") as CandidatInterne, "il");
    expect(texte).toMatch(/^Il supervise un ou plusieurs chantiers/);
    expect(texte).toContain("dont il coordonne");
    expect(texte).toContain("Concrètement, il définit et organise les moyens de production,");
    expect(texte).not.toContain("(");
  });

  it("rend l'accent aux infinitifs du ROME écrits sans (« Elaborer »)", () => {
    expect(preuveEnMinuscule("Elaborer un budget")).toBe("élaborer un budget");
    expect(preuveEnMinuscule("Effectuer un relevé")).toBe("effectuer un relevé");
  });
});

describe("traits enfant (§7.3.4, 2.4-7)", () => {
  it("chaque option citable a un trait, ou est interdite à l'enfant", () => {
    const manquants: string[] = [];
    for (const q of QUESTIONS) {
      for (const v of q.variantes) {
        for (const champ of v.champs) {
          if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") continue;
          for (const o of champ.options) {
            const id = `${champ.cle}=${o.id}`;
            if (o.citation === undefined || champ.cle === "refus" || interditeEnfant(id)) continue;
            if (textes.traitsEnfant[id] === undefined) manquants.push(id);
          }
        }
      }
    }
    expect(manquants).toEqual([]);
  });

  it("aucune ligne pour les questions retirées (mains_tete, ecrit_oral)", () => {
    const cles = Object.keys(textes.traitsEnfant).join(" ");
    expect(cles).not.toMatch(/mains_tete|ecrit_oral/);
  });

  it("chaque trait passe T17 à T20 et T12", () => {
    const charge = construireCharge(reponsesSchema.parse(profils.profils.complet), { index });
    const candidat = [...charge.candidats.values()][0];
    const code = candidat.envoye.code;
    for (const [id, gabarit] of [
      ...Object.entries(textes.traitsEnfant),
      ...Object.entries(textes.traitsEnfantApresBac),
    ]) {
      for (const genre of ["il", "elle"] as const) {
        const trait = minusculeInitiale(
          traitSansDeuxPoints(accorder(gabarit, { genre, prenom: null })),
        );
        const reponses = new Map(charge.reponses);
        reponses.set(id, {
          id,
          question: "",
          citation: trait,
          trait_enfant: trait,
          citable: true,
          contrainte: false,
          enfant: true,
        });
        const echecs = echecsPiste(
          {
            code,
            raison_du_choix: "",
            metier_simplement: "",
            ia_phrase: "",
            pourquoi_parent: [],
            pourquoi_enfant: [
              {
                reponses: [id],
                trait,
                metier: "une proposition de métier assez longue",
                faits: [`${code}.d1`],
              },
            ],
          },
          0,
          { ...charge, reponses },
          { gabarit: true },
        ).filter((e) => ["T12", "T17", "T18", "T19", "T20"].includes(e.code));
        expect(echecs.map((e) => `${id} ${e.code} ${e.message}`)).toEqual([]);
      }
    }
  });
});

describe("raison d'écart « salaire » (passe qualité de 2.4)", () => {
  const smic = index.metiers.find((m) => m.salaire.forme === "smic");
  it("dit le Smic sans redite : ni « proche du Smic : le Smic »", () => {
    expect(smic).toBeDefined();
    if (!smic) return;
    const phrase = phraseDeBase(
      { code: "salaire", salaire: smic.salaire } as Parameters<typeof phraseDeBase>[0],
      { genre: "il", libelleDe: (c) => c },
    );
    expect(phrase).toMatch(/^Le salaire de départ y est le Smic, soit \d[\d ]* € /);
    expect(phrase).not.toContain("proche du Smic : le Smic");
    expect(phrase).toMatch(/\(source : .+\)\.$/);
  });
});
