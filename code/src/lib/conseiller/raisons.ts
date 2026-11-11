/**
 * Phrase de chaque métier écarté (conseiller-ia.md §7.3.5), écrite par le
 * code : niveau d'études, formations, refus (content/questionnaire.ts),
 * expérience, encadrement, marché et variante (content/conseiller.ts).
 * Les chiffres viennent des données sourcées du moteur.
 */
import { conseiller as textes } from "@content/conseiller";
import { questionnaire } from "@content/questionnaire";
import type { MetierCatalogue } from "@/lib/donnees/catalogue";
import type { RaisonEcart } from "@/lib/moteur/types";
import { accorder } from "@/lib/questionnaire/accords";
import type { Genre } from "@/lib/questionnaire/types";
import { minusculeInitiale } from "./texte";

/** « 1802 » → « 1 802 » (espace ordinaire ; l'insécable est posée au rendu). */
export function formaterNombre(n: number): string {
  const entier = Math.round(n);
  return String(entier).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Preuve ROME nettoyée (§7.3.3) : parenthèses, « ... » et « etc. » finaux retirés. */
export function nettoyerPreuve(preuve: string): string {
  return preuve
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*(?:\.\.\.|…|etc\.?)\s*$/u, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

/** Phrase de salaire (design §6.6), source comprise. */
export function phraseSalaire(s: MetierCatalogue["salaire"]): string {
  const t = textes.salaire;
  const min = formaterNombre(s.montant_min);
  const max = s.montant_max === null ? "" : formaterNombre(s.montant_max);
  const gabaritMontants =
    s.forme === "valeur" && s.environ
      ? t.montants.valeurEnviron
      : t.montants[s.forme as keyof typeof t.montants];
  const montants = gabaritMontants.replace("{min}", min).replace("{max}", max);
  const unite = t.unites[`${s.brut_ou_net}_${s.periode}` as keyof typeof t.unites];
  const gabarit = s.type === "debutant" ? t.debutant : s.type === "offres" ? t.offres : t.autre;
  let phrase = gabarit
    .replace("{montants}", montants)
    .replace("{unite}", unite)
    .replace("{type}", s.libelle_type);
  if (!s.meme_intitule_que_la_fiche) {
    phrase += t.procheIntitule.replace("{metier}", s.libelle_unite);
  }
  phrase += t.source.replace("{source}", s.source.nom).replace("{millesime}", s.source.millesime);
  return phrase.charAt(0).toLocaleUpperCase("fr") + phrase.slice(1);
}

export type ContexteRaison = {
  genre: Genre;
  /** Libellé accordé d'un code ROME (pour la variante). */
  libelleDe: (code: string) => string;
};

/** Phrase de base d'une raison d'écart (§7.3.5). */
export function phraseDeBase(raison: RaisonEcart, contexte: ContexteRaison): string {
  const q = questionnaire.raisonsEcart;
  const r = textes.raisonsEcart;
  const accord = { genre: contexte.genre, prenom: null };
  switch (raison.code) {
    case "etudes_niveau": {
      const citee = q.reponsesCitees[raison.reponse.option as keyof typeof q.reponsesCitees];
      if (citee === undefined) return q.etudesNeSaitPas;
      return accorder(q.niveauMetier, {
        ...accord,
        variables: { n: raison.bacPlusMetier, reponse: citee },
      });
    }
    case "formations": {
      const citee =
        raison.reponseEtudes &&
        q.reponsesCitees[raison.reponseEtudes.option as keyof typeof q.reponsesCitees];
      if (raison.parDuree > 0 && raison.dureeMin !== null && citee !== undefined && citee) {
        return accorder(q.dureeFormations, {
          ...accord,
          variables: { n: raison.dureeMin, reponse: citee },
        });
      }
      return q.prive;
    }
    case "refus":
      return accorder(q.refus[raison.drapeau], accord);
    case "experience":
      return r.experience.replace("{preuve}", raison.preuve.replace(/\s*\.$/, ""));
    case "encadrement": {
      const preuve = raison.preuvesDiriger[0];
      if (preuve === undefined) {
        return r.encadrement.replace(" ({preuve})", "");
      }
      return r.encadrement.replace("{preuve}", minusculeInitiale(nettoyerPreuve(preuve)));
    }
    case "recrutement":
      return r.recrutement
        .replace("{projets}", formaterNombre(raison.projets))
        .replace("{metierBmo}", raison.metierBmo)
        .replace("{annee}", raison.source.millesime);
    case "salaire": {
      const phrase = minusculeInitiale(phraseSalaire(raison.salaire));
      const smic = textes.salaire.montants.smic.replace("{min} €", "");
      const aPartir = textes.salaire.montants.smic_minimum.replace("{min} €", "");
      if (phrase.startsWith(smic))
        return r.salaireSmic.replace("{salaire}", phrase.slice(smic.length));
      if (phrase.startsWith(aPartir))
        return r.salaireAPartirDuSmic.replace("{salaire}", phrase.slice(aPartir.length));
      return r.salaire.replace("{salaire}", phrase);
    }
    case "ia":
      return r.ia;
    case "variante":
      return r.variante.replace("{piste}", contexte.libelleDe(raison.de));
  }
}
