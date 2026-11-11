/**
 * Validateur du conseiller (conseiller-ia.md §6, §10.3) : la sortie valide
 * écrite à la main passe ; une mutation la fait échouer avec son code. Les
 * quatre cas de TODO.md (chiffre, diplôme, métier, citation inventés) sont
 * nommés comme tels.
 */
import { describe, expect, it } from "vitest";
import { compatibles } from "@/lib/moteur/selection";
import { reponsesSchema } from "@/lib/questionnaire/reponses";
import profils from "../../../tests/fixtures/profils-conseiller.json";
import valide from "../../../tests/fixtures/conseil-exemple-valide.json";
import { construireCharge } from "./charge";
import type { Charge, CodeEchec, ReponseEnvoyee, SortieLlm } from "./types";
import { echecsPiste, extraireNombres, valider, vocabulaire } from "./validateur";

const charge = construireCharge(reponsesSchema.parse(profils.profils.exemple_recit));

const copie = (): SortieLlm => structuredClone(valide) as SortieLlm;

function codes(sortie: unknown, c: Charge = charge, options = {}): CodeEchec[] {
  return [...new Set(valider(sortie, c, options).echecs.map((e) => e.code))].sort();
}

function codesChoix(sortie: unknown, c: Charge = charge): CodeEchec[] {
  return [
    ...new Set(
      valider(sortie, c)
        .echecs.filter((e) => e.nature === "choix")
        .map((e) => e.code),
    ),
  ];
}

/** Une charge dont une réponse est modifiée (copie, l'originale ne bouge pas). */
function avecReponse(id: string, modif: Partial<ReponseEnvoyee>, c: Charge = charge): Charge {
  const reponses = new Map(c.reponses);
  const r = reponses.get(id);
  if (!r) throw new Error(id);
  reponses.set(id, { ...r, ...modif });
  return { ...c, reponses };
}

/** Une charge dont un candidat est modifié. */
function avecCandidat(
  code: string,
  modif: (c: Charge["candidats"] extends Map<string, infer V> ? V : never) => void,
): Charge {
  const candidats = new Map(charge.candidats);
  const k = structuredClone(candidats.get(code));
  if (!k) throw new Error(code);
  modif(k);
  candidats.set(code, k);
  return { ...charge, candidats };
}

/** Un lien de la piste `i` remplacé par une copie modifiée. */
function lienParent(s: SortieLlm, i: number, j: number) {
  return s.pistes[i].pourquoi_parent[j];
}

describe("la sortie valide", () => {
  it("passe le validateur sans aucun échec", () => {
    expect(valider(valide, charge).echecs).toEqual([]);
  });

  it("est un trio qu'un conseiller signerait : F1201, G1802, A1301", () => {
    expect(valide.pistes.map((p) => p.code)).toEqual(["F1201", "G1802", "A1301"]);
  });
});

describe("règles du choix (V01 à V09)", () => {
  it("V01 : JSON cassé, schéma non respecté, réponse coupée", () => {
    expect(codes("{ pas du json")).toEqual(["V01"]);
    const s = copie() as unknown as { pistes: { code: string; inconnu?: number }[] };
    s.pistes[0].inconnu = 1;
    expect(codes(s)).toEqual(["V01"]);
    expect(codes(JSON.stringify(valide), charge, { fin: "longueur" })).toEqual(["V01"]);
  });

  it("métier inventé : un code inexistant est rejeté par le schéma (V01)", () => {
    const s = copie();
    s.pistes[2].code = "Z9999";
    expect(codes(s)).toEqual(["V01"]);
  });

  it("métier inventé : un code existant mais hors présélection est rejeté (V03)", () => {
    const s = copie();
    s.pistes[2].code = "F1101"; // Architecte : écarté, hors présélection
    expect(codesChoix(s)).toEqual(["V03"]);
  });

  it("V02 : pas exactement N pistes", () => {
    const s = copie();
    s.pistes.pop();
    expect(codes(s)).toEqual(["V02"]);
  });

  it("V04 : deux fois le même code", () => {
    const s = copie();
    s.pistes[2] = structuredClone(s.pistes[0]);
    expect(codesChoix(s)).toEqual(["V04"]);
  });

  it("V05 : deux métiers incompatibles (F1201 et F1135)", () => {
    const s = copie();
    s.pistes[2].code = "F1135";
    expect(codesChoix(s)).toEqual(["V05"]);
  });

  it("V06 : trois pistes du même grand domaine", () => {
    const parDomaine = new Map<string, string[]>();
    for (const k of charge.candidats.values()) {
      const d = k.metier.grand_domaine.code;
      parDomaine.set(d, [...(parDomaine.get(d) ?? []), k.envoye.code]);
    }
    let trio: string[] | null = null;
    for (const liste of parDomaine.values()) {
      for (let a = 0; a < liste.length && !trio; a++)
        for (let b = a + 1; b < liste.length && !trio; b++)
          for (let c = b + 1; c < liste.length && !trio; c++) {
            const m = [liste[a], liste[b], liste[c]].map((x) => charge.candidats.get(x)!.metier);
            if (compatibles(m[0], m[1]) && compatibles(m[0], m[2]) && compatibles(m[1], m[2])) {
              trio = [liste[a], liste[b], liste[c]];
            }
          }
    }
    expect(trio).not.toBeNull();
    const s = copie();
    (trio as string[]).forEach((code, i) => (s.pistes[i].code = code));
    expect(codesChoix(s)).toContain("V06");
    expect(codesChoix(s).filter((c) => c !== "V08")).toEqual(["V06"]);
  });

  it("V07 : trois métiers connus", () => {
    let c = charge;
    for (const code of ["F1201", "G1802", "A1301"]) {
      c = { ...c, candidats: new Map(c.candidats) };
      const k = structuredClone(c.candidats.get(code)!);
      k.envoye.connu = true;
      c.candidats.set(code, k);
    }
    expect(codesChoix(valide, c)).toEqual(["V07"]);
  });

  it("V08 : aucune piste dans les dix premières positions", () => {
    const loin = [...charge.candidats.values()].filter((k) => k.envoye.position > 10);
    let trio: string[] | null = null;
    for (let a = 0; a < loin.length && !trio; a++)
      for (let b = a + 1; b < loin.length && !trio; b++)
        for (let c = b + 1; c < loin.length && !trio; c++) {
          const m = [loin[a], loin[b], loin[c]].map((k) => k.metier);
          const domaines = new Set(m.map((x) => x.grand_domaine.code));
          if (
            domaines.size === 3 &&
            compatibles(m[0], m[1]) &&
            compatibles(m[0], m[2]) &&
            compatibles(m[1], m[2])
          ) {
            trio = [loin[a], loin[b], loin[c]].map((k) => k.envoye.code);
          }
        }
    const s = copie();
    (trio as string[]).forEach((code, i) => (s.pistes[i].code = code));
    expect(codesChoix(s)).toEqual(["V08"]);
    expect(codesChoix(s).length).toBe(1);
  });

  it("V09 : la règle de cœur n'est pas tenue", () => {
    const metiers = valide.pistes.map((p) => charge.candidats.get(p.code)!.metier);
    const dim = (
      ["aider", "creer", "convaincre", "comprendre", "fabriquer", "parole"] as const
    ).find((d) => metiers.every((m) => (m.dimensions.vecteur[d] ?? 0) < 0.6));
    expect(dim).toBeDefined();
    const c: Charge = {
      ...charge,
      profil: { ...charge.profil, coeur: { dim: dim as "aider", origine: "fierte" } },
      envoi: { ...charge.envoi, coeur: { dimension: dim as string, reponse: "fierte=organise" } },
    };
    expect(codesChoix(valide, c)).toEqual(["V09"]);
  });

  it("V08 ne s'applique pas à la sortie des gabarits", () => {
    const loin = [...charge.candidats.values()]
      .filter((k) => k.envoye.position > 10)
      .map((k) => k.envoye.code);
    expect(loin.length).toBeGreaterThan(0);
  });
});

describe("chiffre inventé (T05, T13)", () => {
  it("un salaire dans « Le métier, simplement » est rejeté", () => {
    const s = copie();
    s.pistes[0].metier_simplement += " On y gagne 2 500 € par mois.";
    expect(codes(s)).toEqual(["T05"]);
  });

  it("« bac + 3 » pour un métier accessible à bac + 2 ou bac + 5 est rejeté", () => {
    const s = copie();
    lienParent(s, 0, 2).metier =
      "il passe ses journées sur les chantiers, c'est accessible dès bac + 3";
    expect(codes(s)).toEqual(["T05", "T13"]);
  });

  it("une durée écrite en lettres est rejetée", () => {
    const s = copie();
    s.pistes[2].metier_simplement = s.pistes[2].metier_simplement.replace(
      "pour mieux produire.",
      "pour mieux produire, après une formation en trois ans.",
    );
    expect(codes(s)).toEqual(["T05"]);
  });

  it("les nombres des réponses citées et des faits sont permis", () => {
    expect(extraireNombres("il ne veut pas plus de 3 ans d'études").valeurs).toEqual([3]);
    expect(extraireNombres("deux mondes, deux ans, bac+2").valeurs).toEqual([2]);
    expect(extraireNombres("bac + 2, jusqu'à Bac +5").bac).toEqual([2, 5]);
    expect(extraireNombres("20 %").symboles.length).toBeGreaterThan(0);
  });
});

describe("diplôme inventé (T06)", () => {
  it("« un BTS suffit » est rejeté", () => {
    const s = copie();
    lienParent(s, 0, 2).metier = "il passe ses journées sur les chantiers, un BTS suffit";
    expect(codes(s)).toContain("T06");
  });

  it("« une licence pro » est rejetée", () => {
    const s = copie();
    lienParent(s, 0, 2).metier = "il passe ses journées sur les chantiers après une licence pro";
    expect(codes(s)).toEqual(["T06"]);
  });

  it("« garder le cap » passe : un sigle ne compte qu'en capitales", () => {
    const s = copie();
    lienParent(s, 0, 2).metier = "il passe ses journées sur les chantiers et sait garder le cap";
    expect(codes(s)).toEqual([]);
  });

  it("« BTS » passe dans un rappel qui cite une réponse écrite où le parent l'a écrit", () => {
    const c = avecReponse("fierte_recit", {
      texte: "Le jour où il a organisé, tout seul, un week-end entre copains, il est en BTS.",
    });
    const s = copie();
    lienParent(s, 0, 1).rappel =
      "sa plus grande fierté, c'est d'avoir organisé, tout seul, un week-end entre copains, lui qui est en BTS";
    expect(codes(s, c)).toEqual([]);
  });
});

describe("citation inventée (T01, T04)", () => {
  it("une réponse absente des réponses est rejetée (T01)", () => {
    const s = copie();
    lienParent(s, 0, 0).reponses = ["temps_libre=sport"];
    expect(codes(s)).toEqual(["T01"]);
  });

  it("« il adore le foot » avec « en groupe » est rejeté (T04)", () => {
    const s = copie();
    lienParent(s, 0, 0).rappel = "il adore le foot";
    expect(codes(s)).toEqual(["T04"]);
  });

  const fidelite = (
    texte: string,
    ids: string[],
    pour: "rappel" | "trait" = "rappel",
    c = charge,
  ) => {
    const s = copie();
    if (pour === "rappel") {
      s.pistes[1].pourquoi_parent[0] = {
        ...s.pistes[1].pourquoi_parent[0],
        reponses: ids,
        rappel: texte,
      };
    } else {
      s.pistes[1].pourquoi_enfant[0] = {
        ...s.pistes[1].pourquoi_enfant[0],
        reponses: ids,
        trait: texte,
      };
    }
    return valider(s, c)
      .echecs.filter((e) => e.code === "T04")
      .map((e) => e.message);
  };

  it("le rappel réel de grok-4.7 est rejeté pour « seul », « week », « copains »", () => {
    const messages = fidelite(
      "il est plus à l'aise en groupe et a déjà organisé seul un week-end entre copains",
      ["seul_groupe=groupe", "fierte=organise"],
    );
    expect(messages.join(" ")).toMatch(/« seul ».*« week ».*« copains »/);
  });

  it("le même rappel passe quand il cite aussi le récit", () => {
    expect(
      fidelite("il est plus à l'aise en groupe et a déjà organisé seul un week-end entre copains", [
        "seul_groupe=groupe",
        "fierte_recit",
      ]),
    ).toEqual([]);
  });

  it("une inversion de sens est rejetée : « il n'est pas à l'aise en groupe » (polarité)", () => {
    expect(fidelite("il n'est pas à l'aise en groupe", ["seul_groupe=groupe"])[0]).toMatch(
      /négatif/,
    );
  });

  it("« il est moins à l'aise en groupe » est rejeté (« moins » n'est pas un mot outil)", () => {
    expect(fidelite("il est moins à l'aise en groupe", ["seul_groupe=groupe"])).toHaveLength(1);
  });

  it("« il n'aime pas rester assis » passe pour « besoin de bouger » (la citation est négative)", () => {
    expect(fidelite("il n'aime pas rester assis", ["rester_assis=besoin_de_bouger"])).toEqual([]);
  });

  it("polarité par proposition : « il aime rester assis » est rejeté, « il a besoin de bouger » passe", () => {
    expect(fidelite("il aime rester assis", ["rester_assis=besoin_de_bouger"])).toHaveLength(1);
    expect(fidelite("il a besoin de bouger", ["rester_assis=besoin_de_bouger"])).toEqual([]);
  });

  it("« fier » retrouve « fierté » (équivalent fermé)", () => {
    expect(
      fidelite("il était fier de lui le jour où il a organisé un week-end entre copains", [
        "fierte=organise",
        "fierte_recit",
      ]),
    ).toEqual([]);
  });

  it("un trait enfant « tu adores le foot » est rejeté", () => {
    expect(fidelite("tu adores le foot", ["seul_groupe=groupe"], "trait")).toHaveLength(1);
  });

  it("un trait reformulé hors de « trait_enfant » est rejeté (« tu restes zen quand ça chauffe »)", () => {
    expect(vocabulaire([charge.reponses.get("seul_groupe=groupe")!], "trait", true)).toContain(
      "aise",
    );
    expect(
      fidelite("tu restes zen quand ça chauffe", ["seul_groupe=groupe"], "trait"),
    ).toHaveLength(1);
  });

  describe("réponses écrites (2.4-1, 2.4-8)", () => {
    const complet = construireCharge(reponsesSchema.parse(profils.profils.complet));
    const reponseLibre = (id: string, texte: string): Charge => avecReponse(id, { texte }, complet);
    const verdict = (c: Charge, id: string, rappel: string) => {
      const code = c.envoi.candidats[0].code;
      const lien = (metier: string) => ({ reponses: [id], rappel, metier, faits: [`${code}.d1`] });
      return echecsPiste(
        {
          code,
          raison_du_choix: "Une raison suffisante pour le test.",
          metier_simplement: "",
          ia_phrase: "",
          pourquoi_parent: [lien("une proposition de métier assez longue")],
          pourquoi_enfant: [],
        },
        0,
        c,
        { gabarit: true },
      ).filter((e) => e.code === "T04");
    };

    it("un rappel égal à l'amorce est rejeté", () => {
      const c = reponseLibre("aide_exemple", "réparer le vélo de sa petite sœur");
      expect(verdict(c, "aide_exemple", "on lui a demandé de l'aide pour")[0]?.message).toMatch(
        /sans reprendre les mots du parent/,
      );
    });

    it("« il peut passer des heures à démonter des scooters » passe avec « démonter des scooters »", () => {
      const c = reponseLibre("temps_libre_precis", "démonter des scooters");
      expect(
        verdict(c, "temps_libre_precis", "il peut passer des heures à démonter des scooters"),
      ).toEqual([]);
    });

    it("un trait reprend l'amorce de l'enfant et au moins deux mots du parent (passe qualité)", () => {
      const c = reponseLibre("temps_libre_precis", "démonter des scooters");
      const avec = { ...c, envoi: charge.envoi, candidats: charge.candidats };
      // Seuls comptent les messages du trait modifié (le reste de la sortie cite l'autre profil).
      const trait = (texte: string) =>
        fidelite(texte, ["temps_libre_precis"], "trait", avec).filter((m) =>
          m.includes("pourquoi_enfant[0].trait"),
        );
      expect(c.reponses.get("temps_libre_precis")?.trait_enfant).toBe(
        "tu peux passer des heures à",
      );
      expect(trait("tu peux passer des heures à démonter")[0]).toMatch(
        /sans reprendre les mots du parent/,
      );
      expect(trait("tu peux passer des heures à démonter des scooters")).toEqual([]);
      expect(trait("tu démontes des scooters")).toEqual([]);
    });

    it("« Autre chose » et le récit de la cabane donnent un rappel accepté", () => {
      const r = reponsesSchema.parse({
        ...profils.profils.complet,
        fierte: "autre",
        fierte_recit: "Le jour où il a refait seul la cabane du jardin",
      });
      const c = construireCharge(r);
      expect(c.reponses.get("fierte_recit")?.citation).toBe("sa plus grande fierté, c'est");
      expect(
        verdict(
          c,
          "fierte_recit",
          "sa plus grande fierté, c'est le jour où il a refait seul la cabane du jardin",
        ),
      ).toEqual([]);
    });
  });
});

describe("autres règles de texte", () => {
  const mutation = (f: (s: SortieLlm) => void, c: Charge = charge) => {
    const s = copie();
    f(s);
    return codes(s, c);
  };

  it("T02 : une réponse non citable pour ce métier", () => {
    expect(mutation(() => {}, avecReponse("seul_groupe=groupe", { citable: false }))).toEqual([
      "T02",
    ]);
  });

  it("T03 : un fait d'un autre métier", () => {
    expect(mutation((s) => (lienParent(s, 0, 0).faits = ["G1802.d1"]))).toEqual(["T03"]);
  });

  it("T07 : un organisme ; « dans sa région » passe", () => {
    expect(
      mutation(
        (s) =>
          (lienParent(s, 0, 2).metier =
            "il passe ses journées sur les chantiers, comme le dit pole emploi"),
      ),
    ).toEqual(["T07"]);
    expect(
      mutation(
        (s) =>
          (lienParent(s, 0, 2).metier = "il passe ses journées sur les chantiers de sa région"),
      ),
    ).toEqual([]);
  });

  it("T08 : un nom propre (« Lycée Jean-Moulin »)", () => {
    expect(
      mutation(
        (s) =>
          (lienParent(s, 0, 2).metier =
            "il passe ses journées sur les chantiers du Lycée Jean-Moulin"),
      ),
    ).toEqual(["T08"]);
  });

  it("T09 : un tic d'IA ou un point d'exclamation", () => {
    expect(
      mutation((s) => (lienParent(s, 0, 2).metier = "il vit sa passion sur les chantiers")),
    ).toEqual(["T09"]);
    expect(mutation((s) => (s.analyse += " Quel garçon !"))).toEqual(["T09"]);
  });

  it("T10 : formules interdites ; « tous les jours » et une paraphrase des faits passent", () => {
    expect(mutation((s) => (lienParent(s, 0, 2).metier = "c'est un métier fait pour lui"))).toEqual(
      ["T10"],
    );
    expect(
      mutation(
        (s) =>
          (lienParent(s, 0, 2).metier =
            "il passe ses journées sur les chantiers, un avenir assuré"),
      ),
    ).toEqual(["T10"]);
    expect(
      mutation(
        (s) => (lienParent(s, 0, 2).metier = "il travaille avec tous les jeunes du chantier"),
      ),
    ).toEqual(["T10"]);
    expect(
      mutation((s) => (lienParent(s, 0, 2).metier = "il est sur le chantier tous les jours")),
    ).toEqual([]);
    expect(
      mutation((s) => (lienParent(s, 0, 2).metier = "il assure le respect des règles de sécurité")),
    ).toEqual([]);
  });

  it("T11 : « Le métier, simplement » trop court", () => {
    expect(mutation((s) => (s.pistes[0].metier_simplement = "Il dirige des chantiers."))).toEqual([
      "T11",
    ]);
  });

  it("T12 : majuscule initiale ou point final dans un fragment", () => {
    expect(
      mutation((s) => (lienParent(s, 0, 0).rappel = "Il est plus à l'aise en groupe")),
    ).toContain("T12");
    expect(mutation((s) => (lienParent(s, 0, 0).metier += "."))).toEqual(["T12"]);
  });

  it("T13 : un lien d'études pour un métier à condition d'expérience", () => {
    expect(
      mutation((s) => {
        s.pistes[2].pourquoi_parent.pop();
        s.pistes[0].pourquoi_parent.push({
          reponses: ["annees_etudes=trois_ans"],
          rappel: "il ne veut pas plus de 3 ans d'études",
          metier: "c'est accessible dès bac + 2",
          faits: ["F1201.e"],
        });
      }),
    ).toEqual(["T13"]);
  });

  it("T13 : un lien d'études quand la voie courte est incertaine", () => {
    const c = avecCandidat("G1802", (k) => (k.envoye.etudes.voie_courte_incertaine = true));
    expect(mutation(() => {}, c)).toEqual(["T13"]);
  });

  it("T14 : le lien d'études n'est pas le dernier", () => {
    expect(mutation((s) => s.pistes[1].pourquoi_parent.reverse())).toEqual(["T14"]);
  });

  it("T15 : une réponse citée dans trois pistes", () => {
    expect(
      mutation((s) =>
        s.pistes[2].pourquoi_parent.splice(2, 0, {
          reponses: ["seul_groupe=groupe"],
          rappel: "il est plus à l'aise en groupe",
          metier: "il travaille avec les agriculteurs et leurs équipes",
          faits: ["A1301.d3"],
        }),
      ),
    ).toEqual(["T15"]);
  });

  it("T16 : vouvoiement ou tutoiement dans un texte pour le parent", () => {
    expect(
      mutation((s) => (lienParent(s, 0, 2).metier = "vous le verriez sur les chantiers")),
    ).toEqual(["T16"]);
  });

  it("T17 : un trait enfant sans tutoiement", () => {
    expect(
      mutation((s) => (s.pistes[0].pourquoi_enfant[0].trait = "il est à l'aise en groupe")),
    ).toEqual(["T17"]);
  });

  it("T18 : une tournure négative dans la version enfant", () => {
    expect(
      mutation((s) => (s.pistes[0].pourquoi_enfant[1].trait = "tu n'aimes pas rester assis")),
    ).toContain("T18");
  });

  it("T19 : la source de l'information dans la version enfant", () => {
    expect(
      mutation(
        (s) => (s.pistes[0].pourquoi_enfant[0].metier = "ta mère dit que tu adores les chantiers"),
      ),
    ).toEqual(["T19"]);
  });

  it("T20 : un trait négatif ; « gérer la réserve » dans un métier enfant passe", () => {
    expect(
      mutation((s) => (s.pistes[0].pourquoi_enfant[0].trait = "tu es un peu désorganisé")),
    ).toContain("T20");
    expect(
      mutation(
        (s) => (s.pistes[0].pourquoi_enfant[0].metier = "tu gérerais la réserve du chantier"),
      ),
    ).toEqual([]);
  });

  it("T21 : une réponse interdite à l'enfant", () => {
    expect(mutation(() => {}, avecReponse("seul_groupe=groupe", { enfant: false }))).toEqual([
      "T21",
    ]);
  });

  it("T22 : une phrase enfant qui recopie six mots du récit", () => {
    expect(
      mutation(
        (s) =>
          (s.pistes[0].pourquoi_enfant[2].metier = "comme le jour où il a organisé ce week-end"),
      ),
    ).toContain("T22");
  });

  it("T23 : une phrase IA pour un métier sans rubrique, ou alarmiste", () => {
    const c = avecCandidat("G1802", (k) => (k.envoye.ia.afficher = false));
    expect(mutation(() => {}, c)).toEqual(["T23"]);
    expect(
      mutation(
        (s) => (s.pistes[0].ia_phrase = "L'IA ne remplacera jamais le conducteur sur un chantier."),
      ),
    ).toEqual(["T23"]);
  });

  it("T26 : crochets ou prénom", () => {
    expect(
      mutation(
        (s) =>
          (lienParent(s, 0, 2).metier = "il passe ses journées sur les chantiers avec [prénom]"),
      ),
    ).toEqual(["T26"]);
    const c = { ...charge, prenom: "Lucas" };
    expect(mutation((s) => (s.analyse += " Lucas aime le groupe."), c)).toEqual(["T26"]);
  });

  it("T28 : deux « Le métier, simplement » qui commencent pareil", () => {
    expect(
      mutation(
        (s) =>
          (s.pistes[1].metier_simplement = s.pistes[1].metier_simplement.replace(
            "Dans un restaurant, c'est lui qui orchestre la salle.",
            "Il dirige un restaurant, et surtout sa salle.",
          )),
      ),
    ).toEqual(["T28"]);
  });

  it("T29 : santé ou diagnostic dans ce qui parle de l'enfant, jamais dans un métier", () => {
    expect(mutation((s) => (s.analyse += " Il est hyperactif."))).toEqual(["T29"]);
    expect(mutation((s) => (lienParent(s, 0, 0).rappel = "il est anxieux en groupe"))).toContain(
      "T29",
    );
    expect(
      mutation(
        (s) =>
          (lienParent(s, 2, 0).metier =
            "il travaille parfois avec des personnes en situation de handicap"),
      ),
    ).toEqual([]);
    // « hôpital » n'est pas un fait de ce métier (T31), mais ce n'est pas un diagnostic (T29).
    expect(
      mutation(
        (s) => (lienParent(s, 2, 0).metier = "il passe parfois à l'hôpital voir des agriculteurs"),
      ),
    ).not.toContain("T29");
  });
});

describe("passe qualité de 2.4 (T30 à T33, forme « reponse » et « precision »)", () => {
  const complet = construireCharge(reponsesSchema.parse(profils.profils.complet));
  const lien = (s: SortieLlm, j = 0) => s.pistes[0].pourquoi_parent[j];

  it("la nouvelle forme d'un lien (« reponse », « precision ») est lue comme une liste", () => {
    const s = copie() as unknown as {
      pistes: { pourquoi_parent: Record<string, unknown>[] }[];
    };
    const { reponses, ...reste } = s.pistes[0].pourquoi_parent[0] as { reponses: string[] };
    s.pistes[0].pourquoi_parent[0] = { ...reste, reponse: reponses[0], precision: "" };
    const v = valider(s, charge);
    expect(v.echecs).toEqual([]);
    expect(v.sortie?.pistes[0].pourquoi_parent[0].reponses).toEqual(reponses);
  });

  it("T30 : deux réponses de questions différentes dans un rappel sont rejetées", () => {
    const s = copie();
    lien(s).reponses = ["seul_groupe=groupe", "rester_assis=besoin_de_bouger"];
    lien(s).rappel = "il est plus à l'aise en groupe et il n'aime pas rester assis";
    expect(codes(s)).toContain("T30");
  });

  it("T30 : une case et sa précision écrite vont ensemble", () => {
    const s = copie();
    lien(s, 1).reponses = ["fierte=organise", "fierte_recit"];
    expect(codes(s)).not.toContain("T30");
  });

  it("T31 : un véhicule absent des faits est rejeté, un lieu des conditions de travail passe", () => {
    const s = copie();
    lien(s).metier = "il part sur les chantiers avec son camion et ses ouvriers";
    expect(codes(s)).toEqual(["T31"]);
    lien(s).metier = "il passe une bonne partie de ses journées sur le terrain";
    expect(codes(s)).toEqual([]); // F1201 : « sur chantier », « déplacements professionnels »
    const t = copie();
    t.pistes[2].pourquoi_parent[0].metier = "il travaille souvent de nuit dans les champs";
    expect(codes(t)).toEqual(["T31"]); // A1301 : aucune condition « nuit »
  });

  it("T31 : « debout » passe pour le maître d'hôtel (station debout prolongée)", () => {
    const s = copie();
    s.pistes[1].pourquoi_enfant[1].metier =
      "tu passerais le service debout, entre la salle et la cuisine";
    expect(codes(s)).toEqual([]);
  });

  it("T32 : diriger une équipe n'est pas mis en avant quand un métier est écarté pour cela", () => {
    expect(charge.ecartes.some((e) => e.motif === "encadrement")).toBe(true);
    const s = copie();
    s.pistes[1].pourquoi_parent[0].metier = "il supervise le travail de toute l'équipe en salle";
    expect(codes(s)).toEqual(["T32"]);
    const sansEcarte: Charge = {
      ...charge,
      ecartes: charge.ecartes.filter((e) => e.motif !== "encadrement"),
    };
    expect(codes(s, sansEcarte)).toEqual([]);
  });

  it("T33 : « humain » une seule fois par bilan dans « Et l'IA ? »", () => {
    const s = copie();
    s.pistes[0].ia_phrase =
      "L'IA peut aider à préparer un planning. Mais régler les imprévus du chantier reste humain.";
    expect(codes(s)).toEqual(["T33"]);
    const echec = valider(s, charge).echecs.find((e) => e.code === "T33");
    expect(echec?.champ).toBe("pistes[1].ia_phrase");
  });

  it("les choix fautifs portent les codes en cause (cibles de la relance ciblée)", () => {
    const s = copie();
    s.pistes[2].code = "F1135";
    const v05 = valider(s, charge).echecs.find((e) => e.code === "V05");
    expect(v05?.codes?.sort()).toEqual(["F1135", "F1201"]);
    expect(complet.questions.size).toBeGreaterThan(0);
  });
});
