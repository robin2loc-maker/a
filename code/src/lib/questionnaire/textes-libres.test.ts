import { describe, expect, it } from "vitest";
import {
  CLES_TEXTES_LIBRES,
  detecterSante,
  NON_REPONSES,
  nettoyerTextesLibres,
  normaliserReponseLibre,
  preparerReponseLibre,
  retirerPassagesSante,
  termeSante,
} from "./textes-libres";
import { reponsesVides } from "./reponses";

describe("detecterSante (questions ouvertes §3.2)", () => {
  it.each([
    ["malgré sa dyslexie", "dys…"],
    ["il a un TDAH", "tdah"],
    ["suivie par une orthophoniste", "orthophon…"],
    ["il voit un psy", "psy"],
    ["elle est surdouée", "surdou…"],
    ["les dys", "dys…"],
    ["il est en ULIS", "ulis"],
    ["il prend de la Ritaline", "ritaline"],
    ["hospitalisé l'an dernier", "hospitalis…"],
    ["des crises d'angoisse", "angoiss…"],
    ["ses maladies", "maladie"],
    ["trouble de l'attention", "trouble de l attention"],
    ["des troubles alimentaires", "trouble alimentaire"],
    ["il a des TOCs", "toc"],
    ["elle est HPI", "hpi"],
    ["un enfant à haut potentiel", "haut potentiel"],
    ["Il est AUTISTE", "autis…"],
  ])("repère « %s » (%s)", (texte, terme) => {
    expect(detecterSante(texte)).toBe(true);
    expect(termeSante(texte)).toBe(terme);
  });

  it.each([
    "il démonte des scooters",
    "traitement de texte",
    "elle garde des enfants",
    "son stage de 3ᵉ à l'hôpital",
    "elle s'intéresse aux médicaments",
    "il soigne les animaux",
    "les tactiques de son équipe",
    "le CV de sa cousine",
    "une psychologie de vendeur",
    "il dessine des toques de cuisinier",
    "il a un métier en tête",
    "il imite les accents",
    "elle aime la paix et le calme",
    "il aime les papas qui cuisinent",
  ])("laisse passer « %s »", (texte) => {
    expect(detecterSante(texte)).toBe(false);
  });
});

describe("retirerPassagesSante (§3.3)", () => {
  it("retire le seul segment concerné et garde les autres", () => {
    expect(retirerPassagesSante("Il démonte des scooters. Malgré sa dyslexie, il lit.")).toBe(
      "Il démonte des scooters.",
    );
    expect(retirerPassagesSante("Elle coiffe ses copines ; elle a un TDAH ! Et elle filme.")).toBe(
      "Elle coiffe ses copines ; Et elle filme.",
    );
    expect(retirerPassagesSante("Refaire le CV de sa cousine\nil voit un psy")).toBe(
      "Refaire le CV de sa cousine",
    );
  });

  it("vide le champ quand rien ne reste", () => {
    expect(retirerPassagesSante("Le jour où il a eu son brevet malgré sa dyslexie.")).toBe("");
  });

  it("garde un texte sans terme de santé tel quel", () => {
    const texte = "Le jour où il a eu son brevet, après une année entière à s'accrocher";
    expect(retirerPassagesSante(texte)).toBe(texte);
  });
});

describe("normaliserReponseLibre (§3.4)", () => {
  it.each(NON_REPONSES.map((r) => [r]))("« %s » donne une chaîne vide", (nonReponse) => {
    expect(normaliserReponseLibre(nonReponse)).toBe("");
  });

  it.each([
    "Je ne sais pas.",
    "  RIEN de spécial !! ",
    "Pas grand-chose",
    "voir au-dessus",
    "Aucune idée...",
    "?",
    "ok",
    "",
    "   ",
  ])("« %s » (casse, accents, ponctuation) donne une chaîne vide", (texte) => {
    expect(normaliserReponseLibre(texte)).toBe("");
  });

  it("retire les espaces en trop et coupe à 140 caractères", () => {
    expect(normaliserReponseLibre("  démonter   des\nscooters  ")).toBe("démonter des scooters");
    expect(normaliserReponseLibre("a".repeat(200))).toHaveLength(140);
  });

  it("garde une vraie réponse courte", () => {
    expect(normaliserReponseLibre("le foot")).toBe("le foot");
  });
});

describe("preparerReponseLibre et nettoyerTextesLibres", () => {
  it("une non-réponse laissée après le retrait devient vide", () => {
    expect(preparerReponseLibre("Rien. Sa dyslexie.")).toBe("");
    expect(preparerReponseLibre("Réparer des vélos. Sa dyslexie.")).toBe("Réparer des vélos.");
  });

  it("s'applique aux trois phrases libres, pas au prénom ni aux métiers évoqués", () => {
    expect([...CLES_TEXTES_LIBRES.keys()].sort()).toEqual([
      "aide_exemple",
      "fierte_recit",
      "temps_libre_precis",
    ]);
    const reponses = {
      ...reponsesVides(),
      prenom: "Rien",
      metier_evoque: ["psy"],
      temps_libre_precis: "nsp",
      fierte_recit: "Le jour où elle a monté la cabane",
    };
    expect(nettoyerTextesLibres(reponses)).toEqual({
      ...reponsesVides(),
      prenom: "Rien",
      metier_evoque: ["psy"],
      fierte_recit: "Le jour où elle a monté la cabane",
    });
  });
});
