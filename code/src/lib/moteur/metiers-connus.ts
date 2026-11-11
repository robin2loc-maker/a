/**
 * Métiers « connus » (docs/conception/moteur.md §6), `method: "manuel"`, à
 * valider par le propriétaire.
 *
 * Critère écrit, appliqué à tous les métiers éligibles : un métier qu'un
 * enfant de 15 ans a déjà vu exercer, comme patient, élève, client ou usager,
 * ou qui revient dans « tu pourrais être… ». Aucune donnée du dépôt ne mesure
 * la notoriété : c'est un jugement, jamais affiché comme un fait.
 *
 * Usage : malus `connu` de 0,01, au moins une piste hors liste, et jamais
 * « un métier auquel il n'a peut-être jamais pensé » pour un métier de la liste.
 */
export const METHODE_METIERS_CONNUS = "manuel" as const;

export const METIERS_CONNUS: ReadonlySet<string> = new Set([
  "A1407", // Éleveur de bovins
  "A1416", // Exploitant agricole
  "A1504", // Vétérinaire
  "B1805", // Styliste
  "C1206", // Conseiller de clientèle bancaire
  "C1504", // Conseiller immobilier
  "D1202", // Coiffeur
  "D1208", // Esthéticien
  "D1212", // Vendeur en équipement de la maison
  "D1402", // Commercial
  "E1106", // Journaliste
  "E1108", // Traducteur
  "E1201", // Photographe
  "E1205", // Designer graphique
  "F1101", // Architecte du bâtiment
  "F1102", // Architecte d'intérieur
  "G1201", // Guide-accompagnateur
  "G1203", // Animateur jeunesse
  "G1204", // Éducateur sportif
  "G1235", // Animateur de séjour de vacances
  "G1601", // Chef de cuisine
  "H2206", // Menuisier
  "I1309", // Électricien de maintenance
  "I1604", // Mécanicien automobile
  "J1102", // Médecin généraliste
  "J1103", // Dentiste
  "J1107", // Médecin scolaire
  "J1202", // Pharmacien
  "J1307", // Préparateur en pharmacie
  "J1402", // Diététicien
  "J1405", // Opticien
  "J1406", // Orthophoniste
  "J1506", // Infirmier
  "K1104", // Psychologue
  "K1201", // Assistant de service social
  "K1202", // Éducateur de jeunes enfants
  "K1207", // Éducateur spécialisé
  "K1603", // Bibliothécaire
  "K1901", // Notaire
  "K1903", // Juriste
  "K2105", // Professeur de musique
  "K2106", // Professeur des écoles
  "K2136", // Professeur d'enseignement artistique
  "L1203", // Comédien
  "M1203", // Comptable
  "M1608", // Secrétaire comptable
  "M1805", // Développeur informatique
  "M1855", // Développeur web
  "M1861", // Développeur logiciel
]);
