import { describe, expect, it } from "vitest";
import { accorder, dePrenom, eliderDevant, prenomOuNull, quePrenom, rendreTexte } from "./accords";

describe("élision du prénom", () => {
  // Les sept prénoms de la conception (§1, « Notation »), plus deux cas limites.
  it.each([
    ["Anaïs", "d'Anaïs", "qu'Anaïs"],
    ["Élise", "d'Élise", "qu'Élise"],
    ["Hugo", "d'Hugo", "qu'Hugo"],
    ["Yves", "d'Yves", "qu'Yves"],
    ["Lucas", "de Lucas", "que Lucas"],
    ["Yanis", "de Yanis", "que Yanis"],
    ["Théo", "de Théo", "que Théo"],
    ["Inès", "d'Inès", "qu'Inès"],
    ["  Océane ", "d'Océane", "qu'Océane"],
  ])("%s → « %s », « %s »", (prenom, de, que) => {
    expect(dePrenom(prenom)).toBe(de);
    expect(quePrenom(prenom)).toBe(que);
  });

  it("un y seul ou suivi d'une consonne élide, suivi d'une voyelle non", () => {
    expect(eliderDevant("Y")).toBe(true);
    expect(eliderDevant("Ylan")).toBe(true);
    expect(eliderDevant("Yaël")).toBe(false);
    expect(eliderDevant("")).toBe(false);
  });
});

describe("accorder", () => {
  const il = { genre: "il" as const };
  const elle = { genre: "elle" as const };

  it("choisit la forme masculine ou féminine", () => {
    const gabarit = "{Il|Elle} est plus à l'aise {seul|seule} ou en groupe ?";
    expect(accorder(gabarit, il)).toBe("Il est plus à l'aise seul ou en groupe ?");
    expect(accorder(gabarit, elle)).toBe("Elle est plus à l'aise seule ou en groupe ?");
  });

  it("accepte une forme vide d'un côté", () => {
    expect(accorder("{|e}", elle)).toBe("e");
    expect(accorder("{|e}", il)).toBe("");
  });

  it("remplit le prénom et ses formes élidées", () => {
    const contexte = { genre: "elle" as const, prenom: "Anaïs" };
    expect(accorder("Voir les 3 pistes {de_prenom}", contexte)).toBe("Voir les 3 pistes d'Anaïs");
    expect(accorder("Ce {que_prenom} préfère", contexte)).toBe("Ce qu'Anaïs préfère");
    expect(accorder("Où en est {prenom} ?", contexte)).toBe("Où en est Anaïs ?");
  });

  it("remplit les variables", () => {
    expect(accorder("Question {n} sur {total}", { ...il, variables: { n: 3, total: 29 } })).toBe(
      "Question 3 sur 29",
    );
  });

  it("refuse un texte à trou : variable inconnue, prénom absent, trois formes", () => {
    expect(() => accorder("Il en manque {manque}.", il)).toThrow(/manque/);
    expect(() => accorder("de {prenom}", { genre: "il", prenom: "  " })).toThrow(/prénom/);
    expect(() => accorder("{a|b|c}", il)).toThrow(/deux formes/);
  });
});

describe("rendreTexte", () => {
  const texte = {
    avecPrenom: "Où en est {prenom} aujourd'hui ?",
    sansPrenom: "Où en est-{il|elle} aujourd'hui ?",
  };

  it("prend la version avec prénom quand il y en a un", () => {
    expect(rendreTexte(texte, { genre: "il", prenom: "Théo" })).toBe(
      "Où en est Théo aujourd'hui ?",
    );
  });

  it("prend la version sans prénom quand il est vide", () => {
    expect(rendreTexte(texte, { genre: "elle", prenom: "" })).toBe("Où en est-elle aujourd'hui ?");
    expect(rendreTexte(texte, { genre: "il" })).toBe("Où en est-il aujourd'hui ?");
  });

  it("normalise le prénom", () => {
    expect(prenomOuNull("  Lucas ")).toBe("Lucas");
    expect(prenomOuNull("   ")).toBeNull();
    expect(prenomOuNull(undefined)).toBeNull();
  });
});
