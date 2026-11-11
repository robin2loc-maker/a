/**
 * Moteur de score (tâche 2.2) : point d'entrée, côté serveur seulement.
 *
 *   const index = chargerIndexMoteur();          // une fois par processus
 *   const resultat = calculerResultat(reponses, index);
 *
 * Conception : docs/conception/moteur.md (v2) et ses notes d'implémentation.
 */
export { chargerIndexMoteur, construireIndex, chargerDonneesMoteur } from "./donnees";
export { calculerResultat, classer, comparerCandidats, resultatAvecPistes } from "./resultat";
export { preselectionner } from "./preselection";
export type { CandidatPreselection, OptionsPreselection, Preselection } from "./preselection";
export { construireProfil, reponsesEffectives } from "./profil";
export { validerTrio, compatibles } from "./selection";
export { METIERS_CONNUS } from "./metiers-connus";
export { CONSTANTES, VERSION_MOTEUR, arrondi } from "./constantes";
export type * from "./types";
