/**
 * Composition par le code (conseiller-ia.md §6.5, §7.3.1, §10.4).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { chargerIndexMoteur } from "@/lib/moteur/donnees";
import { accorderLibelle, composerEnfant, composerPourquoi, eliderQue } from "./composer";

describe("« Pourquoi ça lui ressemble », parent", () => {
  it("reproduit mot pour mot la carte modèle de la page de vente", () => {
    // Liens écrits ici, pour un métier sans condition d'expérience (pas ceux du prompt).
    const texte = composerPourquoi([
      {
        rappel: "il est plus à l'aise en groupe",
        metier: "ce métier se fait au contact des ouvriers, des artisans et des clients",
      },
      {
        rappel: "sa plus grande fierté, c'est d'avoir organisé un week-end entre copains",
        metier: "organiser, c'est le cœur du métier",
      },
      {
        rappel: "il n'aime pas rester assis",
        metier: "il passe une bonne partie de ses journées sur le terrain",
      },
      { rappel: "il ne veut pas plus de 3 ans d'études", metier: "c'est accessible dès bac + 2" },
    ]);
    const page = readFileSync(join(__dirname, "../../../docs/page-de-vente.md"), "utf-8");
    const ligne = page.split("\n").find((l) => l.includes("**Pourquoi ça lui ressemble.**")) ?? "";
    expect(ligne.replace(/^> \*\*Pourquoi ça lui ressemble\.\*\* /, "")).toBe(texte);
  });

  it("élide « que » devant une voyelle ou un h muet, pas ailleurs", () => {
    expect(eliderQue("Vous avez dit qu", "il est calme")).toBe("Vous avez dit qu'il est calme");
    expect(eliderQue("Qu", "elle est calme")).toBe("Qu'elle est calme");
    expect(eliderQue("Qu", "sa plus grande fierté")).toBe("Que sa plus grande fierté");
    expect(eliderQue("Qu", "on l'appelle")).toBe("Qu'on l'appelle");
    expect(eliderQue("Et qu", "le week-end, il sort")).toBe("Et que le week-end, il sort");
    expect(eliderQue("Qu", "habituellement, il range")).toBe("Qu'habituellement, il range");
    expect(eliderQue("Qu", "hier, il a réparé")).toBe("Que hier, il a réparé");
    expect(eliderQue("Qu", "Élise a dit")).toBe("Qu'Élise a dit");
  });

  it("un seul lien commence par « Vous avez dit », sans « Et »", () => {
    expect(composerPourquoi([{ rappel: "il est calme", metier: "il rassure les patients" }])).toBe(
      "Vous avez dit qu'il est calme : il rassure les patients.",
    );
  });
});

describe("version enfant", () => {
  it("majuscule initiale, deux-points, point final ; le « : » d'un trait devient « , »", () => {
    expect(
      composerEnfant([
        { trait: "tu es à l'aise en groupe", metier: "tu travaillerais avec les ouvriers" },
        {
          trait: "tu as déjà créé quelque chose : un dessin, un plat",
          metier: "tu créerais des plans",
        },
      ]),
    ).toBe(
      "Tu es à l'aise en groupe : tu travaillerais avec les ouvriers. Tu as déjà créé quelque chose, un dessin, un plat : tu créerais des plans.",
    );
  });
});

describe("nom du métier accordé (§7.3.1)", () => {
  it("accorde les formes « A / B suite »", () => {
    const libelle = "Conducteur / Conductrice de travaux du bâtiment";
    expect(accorderLibelle(libelle, "il")).toBe("Conducteur de travaux du bâtiment");
    expect(accorderLibelle(libelle, "elle")).toBe("Conductrice de travaux du bâtiment");
    const prof = "Professeur territorial / Professeure territoriale d'enseignement artistique";
    expect(accorderLibelle(prof, "il")).toBe("Professeur territorial d'enseignement artistique");
    const reg = "Régisseur d'œuvres d'art / Régisseuse d'œuvres d'art";
    expect(accorderLibelle(reg, "il")).toBe("Régisseur d'œuvres d'art");
    expect(accorderLibelle(reg, "elle")).toBe("Régisseuse d'œuvres d'art");
    expect(accorderLibelle("Urbaniste", "elle")).toBe("Urbaniste");
  });

  it("sur les 545 libellés, aucun « / » ne reste et aucun mot n'est perdu", () => {
    const { metiers } = chargerIndexMoteur();
    expect(metiers.length).toBe(545);
    for (const { libelle } of metiers) {
      const il = accorderLibelle(libelle, "il");
      const elle = accorderLibelle(libelle, "elle");
      expect(il).not.toContain(" / ");
      expect(elle).not.toContain(" / ");
      const mots = new Set([...il.split(/\s+/), ...elle.split(/\s+/)]);
      for (const mot of libelle.replace(" / ", " ").split(/\s+/)) expect(mots.has(mot)).toBe(true);
    }
  });
});
