/**
 * Rencontre de la définition (src/lib/questionnaire/definition.ts) et des
 * textes (content/questionnaire.ts) : une question prête à afficher, accordée.
 *
 * La typographie française (espaces insécables, apostrophes) s'applique
 * ensuite, au rendu (`typographie`, src/lib/typographie.ts).
 */
import { questionnaire } from "@content/questionnaire";
import { accorder, rendreTexte, type ContexteAccord } from "./accords";
import { champsParCle } from "./definition";
import { champsAffiches, optionsAffichees, valeursDuChamp } from "./parcours";
import { CLES_TEXTES_LIBRES } from "./textes-libres";
import type { Reponses } from "./reponses";
import type {
  Champ,
  ContenuOption,
  ContenuQuestion,
  Genre,
  LienPasser,
  Question,
  TexteSelonPrenom,
  Variante,
} from "./types";

export function contenuDe(question: Question): ContenuQuestion {
  return questionnaire.questions[question.id];
}

/** Libellé et citation d'une option, avec les remplacements de la variante. */
export function contenuOption(
  question: Question,
  variante: Variante,
  optionId: string,
): ContenuOption | undefined {
  const contenu = contenuDe(question);
  const base = contenu.options?.[optionId];
  if (base === undefined) return undefined;
  const remplacement = contenu.variantes?.[variante.id]?.options?.[optionId];
  return { ...base, ...remplacement };
}

export function titreDe(question: Question, variante: Variante): TexteSelonPrenom | undefined {
  const contenu = contenuDe(question);
  return contenu.variantes?.[variante.id]?.titre ?? contenu.titre;
}

export function aideDe(question: Question, variante: Variante): string | undefined {
  const contenu = contenuDe(question);
  return contenu.variantes?.[variante.id]?.aide ?? contenu.aide;
}

export interface OptionRendue {
  id: string;
  libelle: string;
  exclusive: boolean;
}

export interface ChampRendu {
  cle: string;
  type: Champ["type"];
  libelle?: string;
  exemple?: string;
  /** Phrase libre : la consigne de vie privée, sous le champ (questions ouvertes §3.1). */
  consigne?: string;
  /** Choix multiple : nombre maximal de choix (`null` : sans limite). */
  max?: number | null;
  longueurMax?: number;
  options: OptionRendue[];
}

export interface QuestionRendue {
  id: Question["id"];
  varianteId: string;
  chapitre: string;
  surtitre?: string;
  titre: string;
  aide?: string;
  champs: ChampRendu[];
  /** Texte du lien pour ne pas répondre, absent si la question n'en a pas. */
  passer?: string;
  avanceAuto: boolean;
}

function libellePasser(lien: LienPasser): string | undefined {
  if (lien === "je_ne_sais_pas") return questionnaire.interface.passer;
  if (lien === "prefere_ne_pas_repondre") return questionnaire.interface.prefereNePasRepondre;
  return undefined;
}

/** Contexte d'accord tiré des réponses de Q1, ou `null` si le genre n'est pas encore choisi. */
export function contexteDepuisReponses(reponses: Reponses): ContexteAccord | null {
  const [genre] = valeursDuChamp(reponses, "genre");
  if (genre !== "il" && genre !== "elle") return null;
  const [prenom] = valeursDuChamp(reponses, "prenom");
  return { genre: genre satisfies Genre, prenom: prenom ?? null };
}

/**
 * Question accordée, dans la variante, avec les champs et les options que les
 * réponses font afficher (un champ masqué n'est pas rendu).
 */
export function rendreQuestion(
  question: Question,
  variante: Variante,
  reponses: Reponses,
  contexte: ContexteAccord,
): QuestionRendue {
  const contenu = contenuDe(question);
  const titre = titreDe(question, variante);
  if (titre === undefined) throw new Error(`Question ${question.id} sans titre (${variante.id})`);
  const aide = aideDe(question, variante);
  const champs: ChampRendu[] = champsAffiches(variante, reponses).map((champ) => {
    const textes = contenu.champs?.[champ.cle];
    const options = optionsAffichees(champ, reponses).map((option) => {
      const texte = contenuOption(question, variante, option.id);
      if (texte === undefined) throw new Error(`Option ${question.id}.${option.id} sans texte`);
      return {
        id: option.id,
        libelle: rendreTexte(texte.libelle, contexte),
        exclusive: option.exclusive === true,
      };
    });
    return {
      cle: champ.cle,
      type: champ.type,
      ...(textes?.libelle !== undefined && { libelle: rendreTexte(textes.libelle, contexte) }),
      ...(textes?.exemple !== undefined && { exemple: rendreTexte(textes.exemple, contexte) }),
      ...(CLES_TEXTES_LIBRES.has(champ.cle) && {
        consigne: questionnaire.textesLibres.consigneSante,
      }),
      ...((champ.type === "choix_multiple" || champ.type === "metiers") && { max: champ.max }),
      ...((champ.type === "texte" || champ.type === "metiers") && {
        longueurMax: champ.longueurMax,
      }),
      options,
    };
  });
  const passer = libellePasser(variante.passer);
  return {
    id: question.id,
    varianteId: variante.id,
    chapitre: questionnaire.chapitres[question.chapitre],
    ...(contenu.surtitre !== undefined && { surtitre: rendreTexte(contenu.surtitre, contexte) }),
    titre: rendreTexte(titre, contexte),
    ...(aide !== undefined && { aide: rendreTexte(aide, contexte) }),
    champs,
    ...(passer !== undefined && { passer }),
    avanceAuto: variante.avanceAuto,
  };
}

/**
 * Citation d'une option (« Vous avez dit qu'… »), accordée, dans la variante
 * vue par le parent. `undefined` si l'option ne se cite pas.
 * La règle de citation (`Option.citation`) reste à appliquer par l'appelant.
 */
export function citationDe(
  question: Question,
  variante: Variante,
  optionId: string,
  contexte: ContexteAccord,
): string | undefined {
  const texte = contenuOption(question, variante, optionId)?.citation;
  return texte === undefined ? undefined : rendreTexte(texte, contexte);
}

const CHAMPS_PAR_CLE = champsParCle();

/**
 * Amorce de citation d'une phrase libre, accordée, sans prénom (questions
 * ouvertes §4.2, réserve R2) : « il peut passer des heures à »,
 * « on lui a demandé de l'aide pour », « sa plus grande fierté, c'est ».
 * Sans condition : l'amorce de `fierte_recit` est toujours rendue.
 * `undefined` pour une clé qui n'a pas d'amorce. Le conseiller la place dans
 * `ReponseEnvoyee.citation` du champ libre.
 */
export function amorceDe(cle: string, genre: Genre): string | undefined {
  const entree = CHAMPS_PAR_CLE.get(cle);
  if (entree === undefined) return undefined;
  const gabarit = contenuDe(entree.question).champs?.[cle]?.citation;
  return gabarit === undefined ? undefined : accorder(gabarit, { genre, prenom: null });
}
