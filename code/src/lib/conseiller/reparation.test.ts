/**
 * Réparation par le code (passe qualité de 2.4, reparation.ts) : coupe d'un
 * rappel qui colle deux réponses, ponctuation rendue, trio partiel, texte
 * trop long raccourci. Chaque lien gardé passe le validateur.
 */
import { describe, expect, it } from "vitest";
import { chargerIndexMoteur } from "@/lib/moteur/donnees";
import { reponsesSchema } from "@/lib/questionnaire/reponses";
import profils from "../../../tests/fixtures/profils-conseiller.json";
import { construireCharge } from "./charge";
import { composerPourquoi } from "./composer";
import { reparer, reponctuer, scinderLien, trioPartiel } from "./reparation";
import { sortieGabarits } from "./repli";
import type { LienParent } from "./types";
import { echecsDuChoix, valider } from "./validateur";

const index = chargerIndexMoteur();
const complet = construireCharge(reponsesSchema.parse(profils.profils.complet), { index });
const code = complet.envoi.candidats[0].code;

describe("un lien qui colle deux réponses (T30)", () => {
  it("est coupé : la plus longue moitié qui passe seule est gardée, avec sa réponse", () => {
    const lien: LienParent = {
      reponses: ["ecrans=depanne", "matieres=technologie"],
      rappel:
        "c'est lui qu'on appelle quand un appareil ne marche pas et il est à l'aise en technologie et en informatique",
      metier: "il cherche la panne et remet les appareils en état",
      faits: [`${code}.d1`],
    };
    const coupe = scinderLien(code, "parent", lien, complet);
    expect(coupe?.reponses).toHaveLength(1);
    expect([
      "c'est lui qu'on appelle quand un appareil ne marche pas",
      "il est à l'aise en technologie et en informatique",
    ]).toContain(coupe?.rappel);
  });

  it("garde le texte entier quand la seconde réponse était citée pour rien", () => {
    const lien: LienParent = {
      reponses: ["temps_libre=comprendre", "fierte_recit"],
      rappel: "il passe du temps à chercher comment marchent les choses",
      metier: "il cherche la panne et remet les appareils en état",
      faits: [`${code}.d1`],
    };
    expect(scinderLien(code, "parent", lien, complet)).toEqual({
      ...lien,
      reponses: ["temps_libre=comprendre"],
    });
  });
});

describe("ponctuation rendue", () => {
  it("le rappel qui reprend la citation sans ses virgules la retrouve, sans mot ajouté", () => {
    const lien: LienParent = {
      reponses: ["week_end=nature"],
      rappel: "le week-end il file dehors dans la nature",
      metier: "x",
      faits: [],
    };
    expect(reponctuer(lien, "rappel", complet).rappel).toBe(
      "le week-end, il file dehors, dans la nature",
    );
    const suite = { ...lien, rappel: "le week-end il file dehors dans la nature avec ses amis" };
    expect(reponctuer(suite, "rappel", complet).rappel).toBe(
      "le week-end, il file dehors, dans la nature avec ses amis",
    );
    const autre = { ...lien, rappel: "il aime la nature" };
    expect(reponctuer(autre, "rappel", complet)).toBe(autre);
  });

  it("le trait retrouve les virgules de la table (« bricoler, construire, réparer »)", () => {
    const lien = {
      reponses: ["temps_libre=bricoler"],
      trait: "tu aimes bricoler construire réparer",
      metier: "x",
      faits: [],
    };
    expect(reponctuer(lien, "trait", complet).trait).toBe("tu aimes bricoler, construire, réparer");
  });
});

describe("trio partiel", () => {
  it("garde les pistes compatibles du modèle et complète par le calcul", () => {
    const [premier] = complet.envoi.candidats;
    const a = premier.code;
    const b = complet.envoi.candidats.find(
      (c) =>
        c.code !== a &&
        !c.incompatibles.includes(a) &&
        c.grand_domaine !== premier.grand_domaine &&
        !c.connu,
    )?.code as string;
    const proche = complet.envoi.candidats.find(
      (c) => c.incompatibles.includes(a) && !c.incompatibles.includes(b),
    )?.code;
    expect(b).toBeDefined();
    expect(proche).toBeDefined();
    const trio = trioPartiel(complet, [a, b, proche as string]);
    expect(trio?.garder).toEqual([a, b]);
    expect(trio?.ajouter).toHaveLength(1);
    expect(echecsDuChoix([...(trio?.garder ?? []), ...(trio?.ajouter ?? [])], complet)).toEqual([]);
  });

  it("rend null quand aucune piste du modèle n'est un candidat", () => {
    expect(trioPartiel(complet, ["F1101", "F1101", "F1101"])).toBeNull();
  });
});

describe("texte parent trop long (T11)", () => {
  it("perd son dernier lien de trait au lieu de passer au gabarit", () => {
    const sortie = sortieGabarits(complet);
    const p = sortie.pistes[0];
    const candidat = complet.candidats.get(p.code);
    const citables = complet.envoi.reponses.filter(
      (r) =>
        r.citation !== undefined &&
        r.reponse !== undefined &&
        !r.contrainte &&
        (r.citable === true ||
          (typeof r.citable === "object" &&
            candidat?.envoye.drapeaux.includes(r.citable.si_metier))),
    );
    expect(citables.length).toBeGreaterThanOrEqual(4);
    const fins = ["pour le client", "pour son équipe", "avant la livraison", "chaque matin"];
    p.pourquoi_parent = citables.slice(0, 4).map((r, k) => ({
      reponses: [r.id],
      rappel: r.citation as string,
      metier: `il règle, contrôle et remet en état les appareils un par un, puis il vérifie chaque réglage avec soin ${fins[k]}`,
      faits: [`${p.code}.d1`],
    }));
    expect(composerPourquoi(p.pourquoi_parent).length).toBeGreaterThan(720);
    const v = valider(sortie, complet);
    expect(v.echecs.some((e) => e.code === "T11" && e.champ === "pistes[0].pourquoi_parent")).toBe(
      true,
    );
    const m = reparer(complet, sortie, v.echecs);
    const parent = m?.pistes[0].parent;
    expect(parent?.origine).toBe("llm");
    // Le dernier lien part (T11) ; un autre peut partir ensuite pour T15 (trois pistes).
    expect(parent?.liens.length).toBeGreaterThanOrEqual(2);
    expect(parent?.liens.flatMap((l) => l.reponses)).not.toContain(citables[3].id);
    expect(composerPourquoi(parent?.liens ?? []).length).toBeLessThanOrEqual(720);
  });
});
