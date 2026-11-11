/**
 * Textes du questionnaire parent (tâche 2.1).
 *
 * Source : docs/conception/questionnaire.md (v2) et les réserves de
 * docs/conception/questionnaire-critique-2.md ; version 3 (questions
 * ouvertes) : docs/conception/questions-ouvertes.md §2 et §3, avec les
 * réserves R1 et R2 de questions-ouvertes-critique-2.md. La structure (ordre, effets,
 * conditions) est dans src/lib/questionnaire/definition.ts ; ici, rien que
 * des mots. Après une modification : `npm run doc:questionnaire` régénère
 * docs/QUESTIONNAIRE.md (un test vérifie qu'il est à jour).
 *
 * Notation :
 * - `{il|elle}` : forme masculine, puis féminine (« {seul|seule} ») ;
 * - `{prenom}` : le prénom saisi ; `{de_prenom}` : « de Lucas », « d'Anaïs » ;
 *   `{que_prenom}` : « que Lucas », « qu'Anaïs » ;
 * - `{n}`, `{max}`, `{total}`… : nombres remplis à l'affichage ;
 * - `{ avecPrenom, sansPrenom }` : deux versions, selon qu'un prénom a été saisi.
 *
 * Citations : la proposition qui suit « Vous avez dit qu' » (ou « que »),
 * reprise dans « Pourquoi ça lui ressemble ». Pour un champ libre, la
 * `citation` est une amorce, jamais affichée au parent : le LLM la complète
 * avec les mots du parent (questions ouvertes §4.2).
 */
import type {
  ContenuQuestion,
  Gabarit,
  IdChapitre,
  IdQuestion,
  TexteSelonPrenom,
} from "@/lib/questionnaire/types";

const chapitres: Record<IdChapitre, string> = {
  pour_commencer: "Pour commencer",
  au_quotidien: "Au quotidien",
  avec_les_autres: "Avec les autres",
  sa_facon_de_faire: "Sa façon de faire",
  ses_etudes: "Ses études",
  pour_finir: "Pour finir",
};

const interfaceQuestionnaire = {
  enTete: "Question {n} sur {total}",
  passer: "Je ne sais pas, passer",
  prefereNePasRepondre: "Je préfère ne pas répondre",
  continuer: "Continuer",
  limiteAtteinte: "{max} choix au maximum : décochez-en un pour en choisir un autre.",
  /** Q30, sous le champ, quand la saisie ne donne aucune suggestion. */
  aucuneSuggestion:
    "Nous ne trouvons pas ce métier sous ce nom. Essayez un mot plus court ou plus général.",
};

const ecrans: {
  accueil: { titre: Gabarit; paragraphes: readonly Gabarit[]; bouton: Gabarit };
  transitionObservation: {
    titre: TexteSelonPrenom;
    texte: Gabarit;
    /** Annonce des trois phrases libres (questions ouvertes §2.5). */
    phrasesLibres: Gabarit;
    bouton: Gabarit;
  };
  transitionPratique: { titre: Gabarit; texte: Gabarit; bouton: Gabarit };
  fin: {
    titre: Gabarit;
    voirLesPistes: TexteSelonPrenom;
    messageDoux: TexteSelonPrenom;
    titreFerme: Gabarit;
    messageFerme: TexteSelonPrenom;
    revoirLesQuestions: Gabarit;
    voirQuandMeme: Gabarit;
  };
} = {
  accueil: {
    titre: "28 questions, environ 10 minutes.",
    paragraphes: [
      "Répondez d'après ce que vous voyez au quotidien, pas d'après ce que vous aimeriez pour votre enfant : c'est ce qui rendra ses pistes justes.",
      "Une question vous fait hésiter ? Passez-la. Vous pouvez revenir en arrière, ou finir plus tard : chaque réponse est enregistrée, et le lien reçu par email vous ramène où vous en étiez.",
    ],
    bouton: "Commencer",
  },
  transitionObservation: {
    titre: {
      avecPrenom: "{prenom}, {tel|telle} que vous {le|la} voyez.",
      sansPrenom: "Votre enfant, {tel|telle} que vous {le|la} voyez.",
    },
    texte:
      "Pas ses notes, pas ses projets : ce qu'{il|elle} fait, avec qui, et comment. 15 questions, environ 6 minutes.",
    phrasesLibres:
      "Trois fois, vous pourrez ajouter une phrase, avec vos mots. C'est facultatif. Ces mots-là, nous pourrons les citer dans ses pistes.",
    bouton: "Continuer",
  },
  transitionPratique: {
    titre: "Encore 10 questions, plus pratiques.",
    texte: "Ses études, et ce qu'{il|elle} refuserait dans un métier. Moins de 4 minutes.",
    bouton: "Continuer",
  },
  fin: {
    titre: "C'est terminé.",
    voirLesPistes: {
      avecPrenom: "Voir les 3 pistes {de_prenom}",
      sansPrenom: "Voir ses 3 pistes",
    },
    messageDoux: {
      avecPrenom:
        "Vous avez passé {n} questions sur {prenom}. Ses pistes seront un peu moins précises.",
      sansPrenom:
        "Vous avez passé {n} questions sur votre enfant. Ses pistes seront un peu moins précises.",
    },
    titreFerme: "Il nous manque quelques réponses.",
    messageFerme: {
      avecPrenom:
        "Pour expliquer ses pistes, il nous faut au moins {minimum} réponses sur {prenom}. Il en manque {manque}.",
      sansPrenom:
        "Pour expliquer ses pistes, il nous faut au moins {minimum} réponses sur votre enfant. Il en manque {manque}.",
    },
    revoirLesQuestions: "Revoir les questions passées",
    voirQuandMeme: "Voir ses pistes quand même",
  },
};

const questions: Record<IdQuestion, ContenuQuestion> = {
  // -------------------------------------------------------------------------
  // Chapitre 1 : Pour commencer
  // -------------------------------------------------------------------------
  prenom_pronom: {
    titre: "Comment s'appelle votre enfant ?",
    aide: "Pour mettre son prénom sur ses pistes. Vous pouvez laisser vide.",
    champs: {
      genre: { libelle: "Dans les questions, on dira :" },
    },
    options: {
      il: { libelle: "il" },
      elle: { libelle: "elle" },
    },
  },

  situation: {
    titre: {
      avecPrenom: "Où en est {prenom} aujourd'hui ?",
      sansPrenom: "Où en est-{il|elle} aujourd'hui ?",
    },
    options: {
      seconde: { libelle: "En Seconde" },
      premiere_generale: { libelle: "En Première générale" },
      premiere_techno: { libelle: "En Première technologique" },
      terminale_generale: { libelle: "En Terminale générale" },
      terminale_techno: { libelle: "En Terminale technologique" },
      bac_pro: { libelle: "En bac pro" },
      deja_bac: { libelle: "{Il|Elle} a déjà le bac (études, travail, réorientation...)" },
      autre: { libelle: "Autre situation" },
    },
  },

  situation_detail: {
    variantes: {
      specialites_premiere: {
        titre: "Quelles spécialités suit-{il|elle} cette année ?",
        aide: "3 choix au maximum.",
      },
      specialites_terminale: {
        titre: "Quelles spécialités suit-{il|elle} cette année ?",
        aide: "2 choix au maximum.",
      },
      serie: { titre: "Dans quelle série ?" },
      bac_pro: { titre: "Son bac pro, c'est dans quel domaine ?" },
      apres_bac: { titre: "Que fait-{il|elle} aujourd'hui ?" },
    },
    champs: {
      apres_bac_formation: { libelle: "Dans quelle formation ? (actuelle, ou la dernière suivie)" },
      apres_bac_bac: { libelle: "Son bac :" },
    },
    options: {
      // Spécialités
      maths: { libelle: "Mathématiques" },
      physique_chimie: { libelle: "Physique-chimie" },
      svt: { libelle: "SVT (sciences de la vie et de la Terre)" },
      ses: { libelle: "SES (sciences économiques et sociales)" },
      hggsp: { libelle: "Histoire-géo, géopolitique et sciences politiques" },
      hlp: { libelle: "Humanités, littérature et philosophie" },
      llcer: { libelle: "Langues, littératures et cultures étrangères" },
      lca: { libelle: "Littérature, langues et cultures de l'Antiquité" },
      nsi: { libelle: "Numérique et sciences informatiques (NSI)" },
      si: { libelle: "Sciences de l'ingénieur" },
      arts: { libelle: "Arts" },
      eppcs: { libelle: "Éducation physique, pratiques et culture sportives" },
      biologie_ecologie: { libelle: "Biologie-écologie (lycée agricole)" },
      // Séries technologiques
      stmg: { libelle: "STMG (management, gestion)" },
      sti2d: { libelle: "STI2D (industrie, développement durable)" },
      st2s: { libelle: "ST2S (santé, social)" },
      stl: { libelle: "STL (laboratoire)" },
      std2a: { libelle: "STD2A (design, arts appliqués)" },
      stav: { libelle: "STAV (agronomie, vivant)" },
      sthr: { libelle: "STHR (hôtellerie, restauration)" },
      s2tmd: { libelle: "S2TMD (théâtre, musique, danse)" },
      // Domaines du bac pro
      btp: { libelle: "Bâtiment, travaux publics" },
      industrie: { libelle: "Industrie, mécanique, électricité" },
      numerique: { libelle: "Numérique, électronique, réseaux" },
      commerce: { libelle: "Commerce, vente, accueil" },
      gestion: { libelle: "Gestion, administration, logistique" },
      hotellerie: { libelle: "Hôtellerie, restauration, alimentation" },
      sante_social: { libelle: "Santé, social, services à la personne" },
      agriculture: { libelle: "Agriculture, nature, animaux" },
      arts_communication: { libelle: "Arts, communication, mode" },
      transport: { libelle: "Transport, conduite" },
      securite: { libelle: "Sécurité" },
      autre_domaine: { libelle: "Autre domaine" },
      // Après le bac : ce qu'il fait
      premiere_annee: { libelle: "{Il|Elle} est en première année d'études après le bac" },
      deuxieme_annee: { libelle: "{Il|Elle} est en deuxième année d'études, ou plus" },
      arrete: {
        libelle: "{Il|Elle} a arrêté ses études : {il|elle} travaille, cherche, ou fait une pause",
      },
      // Après le bac : la formation
      licence: { libelle: "Licence à l'université" },
      sante: { libelle: "Santé (PASS ou L.AS)" },
      bts: { libelle: "BTS" },
      but: { libelle: "BUT" },
      prepa: { libelle: "Classe prépa" },
      ecole: { libelle: "École (commerce, ingénieurs, art, autre)" },
      autre_formation: { libelle: "Autre formation" },
      aucune: { libelle: "Aucune après le bac" },
      // Après le bac : son bac
      general: { libelle: "Général" },
      technologique: { libelle: "Technologique" },
      professionnel: { libelle: "Professionnel" },
    },
  },

  // -------------------------------------------------------------------------
  // Chapitre 2 : Au quotidien
  // -------------------------------------------------------------------------
  seul_groupe: {
    titre: "{Il|Elle} est plus à l'aise {seul|seule} ou en groupe ?",
    options: {
      seul: { libelle: "{Seul|Seule}", citation: "{il|elle} est plus à l'aise {seul|seule}" },
      deux_trois_amis: {
        libelle: "Avec deux ou trois amis",
        citation: "{il|elle} est plus à l'aise avec deux ou trois amis qu'en grand groupe",
      },
      les_deux: { libelle: "Les deux lui vont" },
      groupe: { libelle: "En groupe", citation: "{il|elle} est plus à l'aise en groupe" },
    },
  },

  temps_libre: {
    titre: "Quand personne ne lui demande rien, à quoi passe-t-{il|elle} son temps ?",
    aide: "3 choix au maximum.",
    options: {
      sport: {
        libelle: "Du sport",
        citation: "{il|elle} fait du sport dès qu'{il|elle} a du temps libre",
      },
      bricoler: {
        libelle: "Bricoler, construire, réparer",
        citation: "sur son temps libre, {il|elle} bricole, construit, répare",
      },
      cuisiner: { libelle: "Cuisiner", citation: "{il|elle} cuisine sur son temps libre" },
      dessiner_musique: {
        libelle: "Dessiner, faire de la musique, filmer",
        citation: "sur son temps libre, {il|elle} dessine, fait de la musique ou filme",
      },
      style: {
        libelle: "S'occuper de son style : vêtements, coiffure, maquillage",
        citation: "{il|elle} passe du temps à soigner son style",
      },
      lire_ecrire: {
        libelle: "Lire, écrire",
        citation: "{il|elle} lit et écrit sur son temps libre",
      },
      comprendre: {
        libelle: "Chercher à comprendre comment marchent les choses (vidéos, documentaires)",
        citation: "{il|elle} passe du temps à chercher comment marchent les choses",
      },
      animaux_nature: {
        libelle: "S'occuper d'animaux, être dans la nature",
        citation: "dès qu'{il|elle} peut, {il|elle} s'occupe d'animaux ou va dans la nature",
      },
      aider: {
        libelle: "Garder des enfants, aider des voisins, faire du bénévolat",
        citation: "sur son temps libre, {il|elle} s'occupe des autres",
      },
      amis: { libelle: "Être avec ses amis" },
      son_travail: { libelle: "Son travail, un petit boulot" },
      ecrans: { libelle: "Les écrans : jeux vidéo, réseaux sociaux" },
    },
    champs: {
      temps_libre_precis: {
        libelle: "Et plus précisément, qu'est-ce qui l'absorbe pendant des heures ?",
        exemple: "Des heures à...",
        citation: "{il|elle} peut passer des heures à",
      },
    },
  },

  aide_demandee: {
    titre: "Quand ses proches lui demandent de l'aide, c'est plutôt pour quoi ?",
    aide: "2 choix au maximum.",
    options: {
      reparer: {
        libelle: "Réparer ou monter quelque chose (un vélo, un meuble, une prise)",
        citation: "on l'appelle quand il faut réparer ou monter quelque chose",
      },
      regler: { libelle: "Régler un téléphone, un ordinateur, la box" },
      expliquer: {
        libelle: "Expliquer un cours, une règle, une démarche",
        citation: "ses proches lui demandent de leur expliquer les choses",
      },
      organiser: {
        libelle: "Organiser une sortie, une fête, un voyage",
        citation: "c'est à {lui|elle} qu'on demande d'organiser les sorties",
      },
      ecouter: {
        libelle: "Écouter, conseiller quand ça ne va pas",
        citation: "ses proches viennent {le|la} voir quand ça ne va pas",
      },
      creer: {
        libelle: "Créer : un dessin, une affiche, une vidéo",
        citation: "on lui demande de dessiner, de faire une affiche ou une vidéo",
      },
      calculer: {
        libelle: "Faire un calcul, un budget, des comptes",
        citation: "on lui confie les calculs et les comptes",
      },
      vendre: {
        libelle: "Vendre quelque chose, négocier un prix",
        citation: "on lui demande de vendre ou de négocier",
      },
      rien_de_particulier: { libelle: "Pas une chose plus qu'une autre" },
    },
    champs: {
      // Réserve R1 de la critique 2 : un libellé qui enchaîne, une amorce courte.
      aide_exemple: {
        libelle: "Et la dernière fois, c'était pour quoi ?",
        exemple: "Pour...",
        citation: "on lui a demandé de l'aide pour",
      },
    },
  },

  rester_assis: {
    titre:
      "Rester {assis|assise} longtemps (devoirs, longue journée de cours), pour {lui|elle}, c'est...",
    options: {
      facile: {
        libelle: "Facile : {il|elle} peut y passer des heures",
        citation: "{il|elle} peut rester {assis|assise} des heures",
      },
      avec_pauses: { libelle: "Ça va, avec des pauses" },
      besoin_de_bouger: {
        libelle: "{Il|Elle} n'aime pas ça : {il|elle} a besoin de bouger",
        citation: "{il|elle} n'aime pas rester {assis|assise}",
      },
    },
  },

  week_end: {
    titre: "Le week-end, quand {il|elle} a le choix, {il|elle} est plutôt...",
    options: {
      nature: {
        libelle: "Dehors, dans la nature",
        citation: "le week-end, {il|elle} file dehors, dans la nature",
      },
      ville: { libelle: "Dehors, en ville" },
      sport: { libelle: "Au sport, au club", citation: "le week-end, {il|elle} est au sport" },
      interieur: { libelle: "À l'intérieur", citation: "{il|elle} préfère être à l'intérieur" },
      ca_depend: { libelle: "Ça dépend" },
    },
  },

  // -------------------------------------------------------------------------
  // Chapitre 3 : Avec les autres
  // -------------------------------------------------------------------------
  role_groupe: {
    titre:
      "Dans un groupe (amis, équipe, travail en classe), quel rôle prend-{il|elle} le plus souvent ?",
    options: {
      prend_en_main: {
        libelle: "{Il|Elle} prend les choses en main",
        citation: "dans un groupe, c'est {lui|elle} qui prend les choses en main",
      },
      idees: {
        libelle: "{Il|Elle} propose les idées",
        citation: "dans un groupe, c'est {lui|elle} qui propose les idées",
      },
      // Réserve R6 : deux rôles distincts ne tiennent plus dans une seule formule.
      ambiance_lien: {
        libelle: "{Il|Elle} met l'ambiance, et fait le lien entre les uns et les autres",
        citation: "dans un groupe, c'est {lui|elle} qui met l'ambiance et fait le lien",
      },
      plus_que_sa_part: {
        libelle: "{Il|Elle} en fait plus que sa part, pour que ce soit bien fait",
        citation: "dans un groupe, {il|elle} en fait plus que sa part, pour que ce soit bien fait",
      },
      sa_part: {
        libelle: "{Il|Elle} fait sa part, sérieusement",
        citation: "dans un groupe, {il|elle} fait sa part, sérieusement",
      },
      observe: {
        libelle:
          "{Il|Elle} observe, puis intervient quand {il|elle} est {sûr|sûre} {de lui|d'elle}",
        citation: "{il|elle} observe avant d'intervenir",
      },
    },
  },

  adultes_inconnus: {
    titre:
      "Avec un adulte qu'{il|elle} ne connaît pas (un vendeur, un voisin, quelqu'un au téléphone), comment est-{il|elle} ?",
    options: {
      a_l_aise: {
        libelle: "À l'aise : {il|elle} engage facilement la conversation",
        citation: "{il|elle} parle facilement à des adultes qu'{il|elle} ne connaît pas",
      },
      poli: { libelle: "{Poli|Polie}, sans chercher à discuter" },
      reserve: {
        libelle: "{Réservé|Réservée} : {il|elle} préfère laisser parler les autres",
        citation:
          "{il|elle} est plutôt {réservé|réservée} avec les gens qu'{il|elle} ne connaît pas",
      },
    },
  },

  obtenir: {
    titre:
      "Quand {il|elle} veut obtenir quelque chose (une sortie, un achat, une permission), comment s'y prend-{il|elle} ?",
    variantes: {
      apres_bac: {
        titre:
          "Quand {il|elle} veut obtenir quelque chose (de l'argent, un service, un coup de main), comment s'y prend-{il|elle} ?",
      },
    },
    options: {
      negocie: {
        libelle: "{Il|Elle} négocie, argumente, et obtient souvent gain de cause",
        citation: "{il|elle} sait négocier, et obtient souvent gain de cause",
      },
      demande: { libelle: "{Il|Elle} demande simplement, et accepte la réponse" },
      se_debrouille: {
        libelle: "{Il|Elle} demande rarement : {il|elle} se débrouille par {lui|elle}-même",
        citation: "quand {il|elle} veut quelque chose, {il|elle} se débrouille par {lui|elle}-même",
      },
    },
  },

  prendre_soin: {
    titre:
      "Avec un enfant plus jeune, une personne âgée ou un ami qui ne va pas bien, comment est-{il|elle} ?",
    options: {
      naturellement: {
        libelle: "{Il|Elle} s'en occupe tout naturellement",
        citation:
          "{il|elle} s'occupe tout naturellement des plus jeunes, des plus âgés, de ceux qui ne vont pas bien",
      },
      // Réserve R8 : « aller au-devant » appelait un complément.
      attentionne: {
        libelle: "{Il|Elle} est {attentionné|attentionnée}, sans forcément faire le premier pas",
      },
      autrement: {
        libelle: "{Il|Elle} aide plutôt autrement : réparer, organiser, trouver une solution",
        citation: "{il|elle} aide plutôt en trouvant des solutions concrètes",
      },
    },
  },

  // -------------------------------------------------------------------------
  // Chapitre 4 : Sa façon de faire
  // -------------------------------------------------------------------------
  organisation: {
    titre: "Ses devoirs, ses affaires, ses projets : comment s'organise-t-{il|elle} ?",
    options: {
      prevoit: {
        libelle: "{Il|Elle} prévoit tout à l'avance",
        citation: "{il|elle} prévoit tout à l'avance",
      },
      improvise: {
        libelle: "{Il|Elle} improvise, et {il|elle} s'adapte",
        citation: "{il|elle} improvise, et {il|elle} s'adapte",
      },
      cadre: {
        libelle: "{Il|Elle} avance mieux avec un cadre clair",
        citation: "{il|elle} avance mieux avec un cadre clair",
      },
      desordre: { libelle: "Ça a l'air en désordre, mais {il|elle} s'y retrouve" },
    },
  },

  probleme: {
    titre:
      "Face à un problème (un objet en panne, un meuble à monter, un exercice qui résiste), comment s'y prend-{il|elle} ?",
    options: {
      cherche: {
        libelle: "{Il|Elle} cherche, {seul|seule}, jusqu'à comprendre",
        citation: "face à un problème, {il|elle} cherche jusqu'à comprendre",
      },
      etapes: {
        libelle: "{Il|Elle} suit les étapes, une par une (la notice, un tuto)",
        citation: "face à un problème, {il|elle} suit les étapes, une par une",
      },
      essaie: {
        libelle: "{Il|Elle} essaie, démonte, recommence, jusqu'à ce que ça marche",
        citation: "{il|elle} essaie et recommence jusqu'à ce que ça marche",
      },
      demande: {
        libelle: "{Il|Elle} va voir quelqu'un qui sait, et pose les bonnes questions",
        citation: "{il|elle} sait trouver la bonne personne et poser les bonnes questions",
      },
    },
  },

  imprevu: {
    titre:
      "Quelqu'un se blesse, une dispute éclate, il faut agir vite : comment réagit-{il|elle} ?",
    options: {
      calme: {
        libelle: "{Il|Elle} garde son calme, même quand les autres paniquent",
        citation: "{il|elle} garde son calme quand les autres paniquent",
      },
      gere: { libelle: "{Il|Elle} gère, même si ça {le|la} stresse" },
      // Réserve R4 : l'option répond à la scène d'urgence posée par la question.
      laisse_faire: { libelle: "{Il|Elle} préfère laisser faire quelqu'un qui sait" },
    },
  },

  chiffres: {
    titre:
      "Les chiffres au quotidien (son argent, un score, un prix, une moyenne), pour {lui|elle}, c'est...",
    options: {
      jeu: {
        libelle: "Un jeu : {il|elle} calcule vite, et {il|elle} aime ça",
        citation: "les chiffres, pour {lui|elle}, c'est un jeu",
      },
      outil: { libelle: "Un outil : {il|elle} s'en sert sans problème, sans plus" },
      corvee: {
        libelle: "Une corvée : {il|elle} s'en passe volontiers",
        citation: "les chiffres, {il|elle} s'en passe volontiers",
      },
    },
  },

  ecrans: {
    titre: "Avec les écrans, à part les jeux et les réseaux, que fait-{il|elle} ?",
    options: {
      pas_grand_chose: { libelle: "Pas grand-chose de plus" },
      depanne: {
        libelle: "{Il|Elle} règle, installe, dépanne : c'est {lui|elle} qu'on appelle",
        citation: "c'est {lui|elle} qu'on appelle quand un appareil ne marche pas",
      },
      cree: {
        libelle: "{Il|Elle} crée : montage vidéo, musique, dessin",
        citation: "{il|elle} crée sur ordinateur : montage, musique, dessin",
      },
      code: {
        libelle: "{Il|Elle} code, programme, monte des ordinateurs",
        citation: "{il|elle} code, programme, monte des ordinateurs",
      },
    },
  },

  fierte: {
    surtitre: "Avant de parler de ses études, une dernière question. Peut-être la plus importante.",
    titre: "Dans quelle situation l'avez-vous {vu|vue} le plus {fier|fière} {de lui|d'elle} ?",
    aide: "Pensez au premier souvenir qui vous vient, puis choisissez la situation la plus proche.",
    champs: {
      fierte_recit: {
        libelle: "Racontez-la en une phrase, si vous voulez",
        exemple: "Le jour où...",
        // Toujours envoyée, quelle que soit l'option cochée (questions ouvertes §2.3, réserve R2).
        citation: "sa plus grande fierté, c'est",
      },
    },
    options: {
      organise: {
        libelle: "Quand {il|elle} a organisé quelque chose de A à Z",
        citation: "sa plus grande fierté, c'est d'avoir organisé quelque chose de A à Z",
      },
      fabrique: {
        libelle: "Quand {il|elle} a fabriqué ou réparé quelque chose",
        citation:
          "sa plus grande fierté, c'est d'avoir fabriqué ou réparé quelque chose de ses mains",
      },
      cree: {
        libelle: "Quand {il|elle} a créé quelque chose (dessin, musique, vidéo, texte, plat)",
        citation: "sa plus grande fierté, c'est d'avoir créé quelque chose",
      },
      aide: {
        libelle: "Quand {il|elle} a aidé quelqu'un",
        citation: "sa plus grande fierté, c'est d'avoir aidé quelqu'un",
      },
      resolu: {
        libelle: "Quand {il|elle} a résolu quelque chose de difficile, à force de chercher",
        citation:
          "sa plus grande fierté, c'est d'avoir résolu quelque chose de difficile à force de chercher",
      },
      responsabilite: {
        libelle: "Quand on lui a confié une responsabilité",
        citation: "sa plus grande fierté, c'est qu'on lui ait confié une responsabilité",
      },
      convaincu: {
        libelle: "Quand {il|elle} a convaincu des gens, ou vendu quelque chose",
        // Réserve R9 : la citation avait perdu son complément.
        citation: "sa plus grande fierté, c'est d'avoir convaincu des gens, ou vendu quelque chose",
      },
      parole: {
        libelle: "Quand {il|elle} a pris la parole devant d'autres",
        citation: "sa plus grande fierté, c'est d'avoir pris la parole devant d'autres",
      },
      // Amélioration 1 de la critique : « longtemps préparé » au lieu de « à force d'efforts ».
      longtemps_prepare: {
        libelle:
          "Quand {il|elle} a réussi quelque chose qu'{il|elle} avait longtemps préparé : un examen, un match, un concours",
        citation:
          "sa plus grande fierté, c'est d'avoir réussi quelque chose qu'{il|elle} avait longtemps préparé",
      },
      autre: { libelle: "Autre chose" },
    },
  },

  // -------------------------------------------------------------------------
  // Chapitre 5 : Ses études
  // -------------------------------------------------------------------------
  matieres: {
    titre: "Au lycée, dans quelles matières est-{il|elle} le plus à l'aise ?",
    aide: "3 choix au maximum. D'après ses notes, ou ce que vous voyez quand {il|elle} travaille.",
    variantes: {
      apres_bac: {
        titre: "Au lycée, dans quelles matières était-{il|elle} le plus à l'aise ?",
        aide: "3 choix au maximum. D'après ses notes, ou ce que vous voyiez quand {il|elle} travaillait.",
        options: {
          francais: { citation: "{il|elle} était à l'aise en français" },
          maths: { citation: "{il|elle} était à l'aise en maths" },
          physique_chimie: { citation: "{il|elle} était à l'aise en physique-chimie" },
          svt: { citation: "{il|elle} était à l'aise en SVT" },
          histoire_geo: { citation: "{il|elle} était à l'aise en histoire-géo" },
          langues: { citation: "{il|elle} était à l'aise en langues" },
          economie: { citation: "{il|elle} était à l'aise en économie" },
          philosophie: { citation: "{il|elle} était à l'aise en philosophie" },
          arts: { citation: "{il|elle} était à l'aise en arts" },
          sport: { citation: "{il|elle} était à l'aise en sport" },
          technologie: { citation: "{il|elle} était à l'aise en technologie et en informatique" },
        },
      },
    },
    options: {
      francais: { libelle: "Français", citation: "{il|elle} est à l'aise en français" },
      maths: { libelle: "Maths", citation: "{il|elle} est à l'aise en maths" },
      physique_chimie: {
        libelle: "Physique-chimie",
        citation: "{il|elle} est à l'aise en physique-chimie",
      },
      svt: { libelle: "SVT", citation: "{il|elle} est à l'aise en SVT" },
      histoire_geo: { libelle: "Histoire-géo", citation: "{il|elle} est à l'aise en histoire-géo" },
      langues: { libelle: "Langues étrangères", citation: "{il|elle} est à l'aise en langues" },
      economie: { libelle: "Économie, gestion", citation: "{il|elle} est à l'aise en économie" },
      philosophie: { libelle: "Philosophie", citation: "{il|elle} est à l'aise en philosophie" },
      arts: {
        libelle: "Arts (dessin, musique, théâtre)",
        citation: "{il|elle} est à l'aise en arts",
      },
      sport: { libelle: "Sport", citation: "{il|elle} est à l'aise en sport" },
      technologie: {
        libelle: "Technologie, sciences de l'ingénieur, informatique",
        citation: "{il|elle} est à l'aise en technologie et en informatique",
      },
      atelier: {
        libelle: "L'atelier, la pratique professionnelle",
        citation: "{il|elle} est à l'aise à l'atelier",
      },
      aucune: { libelle: "Pas une plus qu'une autre" },
    },
  },

  scolarite: {
    variantes: {
      lycee: { titre: "En ce moment, au lycée, comment ça se passe ?" },
      lycee_passe: {
        titre: "Au lycée, comment ça se passait ?",
        options: {
          tres_bien: { libelle: "C'était très bien, presque partout" },
          bien: { libelle: "C'était bien, sans difficulté particulière" },
          inegal: { libelle: "C'était inégal selon les matières" },
          difficile: { libelle: "C'était difficile" },
        },
      },
      apres_bac: {
        titre: "Après le bac, qu'est-ce qui a coincé, d'après vous ?",
        aide: "2 choix au maximum. Votre réponse aide à choisir des formations qui lui conviennent mieux.",
      },
    },
    // Réserve R3 : l'aide dit vrai, aucune réponse ne touche aux métiers.
    aide: "Votre réponse sert seulement à classer les formations très sélectives. Elle n'écarte aucun métier.",
    options: {
      tres_bien: { libelle: "Très bien, presque partout" },
      bien: { libelle: "Bien, sans difficulté particulière" },
      inegal: { libelle: "Inégal selon les matières" },
      difficile: { libelle: "C'est difficile en ce moment" },
      theorie: {
        libelle: "Trop de théorie, pas assez de concret",
        citation: "après le bac, {il|elle} a manqué de concret",
      },
      cadre: {
        libelle: "Pas assez de cadre ni de suivi",
        citation: "{il|elle} avance mieux avec un suivi régulier",
      },
      domaine: {
        libelle: "Le domaine ne lui plaisait pas",
        citation: "le domaine qu'{il|elle} avait choisi ne lui plaisait pas",
      },
      niveau: { libelle: "Le niveau était trop élevé" },
      // Réserve R9 : « veut changer de voie » n'est pas vrai de tous.
      rien: { libelle: "Rien n'a coincé" },
    },
  },

  annees_etudes: {
    titre: "Combien d'années d'études est-{il|elle} {prêt|prête} à faire ?",
    aide: "Après le bac.",
    variantes: {
      apres_bac: { aide: "À partir de la rentrée prochaine." },
    },
    options: {
      moins_possible: {
        libelle: "Le moins possible",
        citation: "{il|elle} veut des études les plus courtes possible",
      },
      deux_ans: { libelle: "2 ans", citation: "{il|elle} ne veut pas plus de 2 ans d'études" },
      trois_ans: { libelle: "3 ans", citation: "{il|elle} ne veut pas plus de 3 ans d'études" },
      cinq_ans: {
        libelle: "5 ans",
        citation: "{il|elle} est {prêt|prête} à faire jusqu'à 5 ans d'études",
      },
      plus: {
        libelle: "Plus, si c'est ce qu'il faut",
        citation: "{il|elle} est {prêt|prête} à faire de longues études si c'est ce qu'il faut",
      },
      ne_sait_pas: { libelle: "Je ne sais pas" },
    },
  },

  alternance: {
    titre:
      "Étudier en alternance (en partie en entreprise, avec un salaire), ça pourrait lui convenir ?",
    options: {
      ideal: { libelle: "Oui, ce serait l'idéal", citation: "l'alternance lui conviendrait bien" },
      pourquoi_pas: { libelle: "Pourquoi pas" },
      plutot_non: { libelle: "Plutôt non" },
      ne_sait_pas: { libelle: "Je ne sais pas" },
    },
  },

  prive: {
    titre: "Pour vous, une école privée payante, c'est envisageable ?",
    // Réserve R1 : seuls les métiers bien classés sont signalés (SPEC §5.6).
    aide: "Votre réponse trie les formations. Un métier qui ne s'apprend que dans le privé ne sera pas proposé ; s'il lui correspondait bien, nous vous le dirons.",
    options: {
      oui: { libelle: "Oui" },
      alternance: { libelle: "Seulement en alternance" },
      non: { libelle: "Non" },
      ne_sait_pas: { libelle: "Je ne sais pas encore" },
    },
  },

  departement: {
    titre: "Dans quel département habitez-vous ?",
    aide: "Pour vous montrer d'abord les formations proches de chez vous.",
  },

  mobilite: {
    titre: "Pour ses études, s'éloigner de la maison, c'est envisageable ?",
    options: {
      rester_pres: { libelle: "Plutôt rester près de chez nous" },
      region: { libelle: "Oui, dans la région" },
      france: { libelle: "Oui, partout en France" },
      ne_sait_pas: { libelle: "On ne sait pas encore" },
    },
  },

  // -------------------------------------------------------------------------
  // Chapitre 6 : Pour finir
  // -------------------------------------------------------------------------
  refus: {
    titre: "Y a-t-il des choses qu'{il|elle} refuserait vraiment dans un métier ?",
    aide: "Chaque case cochée écarte des métiers : ne cochez que les refus nets.",
    options: {
      soins: {
        libelle: "Les soins du corps : le sang, les piqûres, la toilette d'une personne",
        citation: "{il|elle} ne veut pas faire de soins",
      },
      vente: {
        libelle: "Vendre, avoir des objectifs de vente",
        citation: "{il|elle} ne veut pas vendre",
      },
      chiffres: {
        libelle: "Manier des chiffres toute la journée",
        citation: "{il|elle} ne veut pas passer ses journées dans les chiffres",
      },
      nuit: { libelle: "Travailler la nuit", citation: "{il|elle} ne veut pas travailler la nuit" },
      week_end: {
        libelle: "Travailler le week-end",
        citation: "{il|elle} ne veut pas travailler le week-end",
      },
      physique: {
        libelle: "Un travail physique, porter des charges",
        citation: "{il|elle} ne veut pas d'un travail physique",
      },
      bureau: {
        libelle: "Rester {assis|assise} dans un bureau toute la journée",
        citation: "{il|elle} ne veut pas rester {assis|assise} dans un bureau toute la journée",
      },
      rien: { libelle: "Rien de tout ça" },
    },
  },

  ce_qui_compte: {
    titre: "D'après vous, qu'est-ce qui compte le plus pour {lui|elle} ?",
    aide: "2 choix au maximum. Ses priorités à {lui|elle}, pas forcément les vôtres.",
    options: {
      gagner: {
        libelle: "Bien gagner sa vie",
        citation: "bien gagner sa vie compte pour {lui|elle}",
      },
      utile: {
        libelle: "Être utile aux autres",
        citation: "être utile aux autres compte pour {lui|elle}",
      },
      // Réserve R5 : accordé au féminin.
      patron: {
        libelle: "Être {son propre patron|sa propre patronne}",
        citation: "{il|elle} aimerait être {son propre patron|sa propre patronne}",
      },
      stable: {
        libelle: "Avoir un emploi stable",
        citation: "avoir un emploi stable compte pour {lui|elle}",
      },
      creer: { libelle: "Créer, inventer", citation: "créer compte pour {lui|elle}" },
      bouger: { libelle: "Bouger, voyager", citation: "{il|elle} a envie de bouger, de voyager" },
      temps: {
        libelle: "Avoir du temps pour sa vie à côté",
        citation: "avoir du temps pour sa vie à côté compte pour {lui|elle}",
      },
    },
  },

  metier_evoque: {
    titre: "Y a-t-il un métier dont {il|elle} parle, ou dont {il|elle} a déjà parlé ?",
    aide: "Facultatif, 2 métiers au plus. Ils ne seront pas imposés : nous vous dirons où ils se situent par rapport à ses pistes.",
  },
};

/**
 * Raisons d'écart dues au questionnaire (conception §5.4), prêtes pour 2.3.
 * `{reponse}` : un libellé de `reponsesCitees`.
 */
const raisonsEcart = {
  niveauMetier:
    "Il faut au moins {n} ans d'études après le bac, et vous avez répondu « {reponse} ».",
  etudesNeSaitPas: "Il faut plus de 5 ans d'études, et vous n'avez pas encore fixé de durée.",
  // Réserve R9 : les formations n'ont pas toutes la même durée ; n = la plus courte.
  dureeFormations:
    "Les formations qui y mènent durent au moins {n} ans, et vous avez répondu « {reponse} ».",
  // Réserve R2 : les données disent « privé », pas « payant ».
  prive: "On ne s'y forme que dans des établissements privés, et vous avez écarté le privé payant.",
  refus: {
    soins: "Il faut faire des soins, et vous avez dit qu'{il|elle} ne le voulait pas.",
    vente: "Il faut vendre, et vous avez dit qu'{il|elle} ne le voulait pas.",
    chiffres:
      "On y manie des chiffres toute la journée, et vous avez dit qu'{il|elle} ne le voulait pas.",
    nuit: "On y travaille la nuit, et vous avez dit qu'{il|elle} ne le voulait pas.",
    week_end: "On y travaille le week-end, et vous avez dit qu'{il|elle} ne le voulait pas.",
    effort_physique: "C'est un travail physique, et vous avez dit qu'{il|elle} ne le voulait pas.",
    bureau_toute_la_journee:
      "On y reste au bureau toute la journée, et vous avez dit qu'{il|elle} ne le voulait pas.",
  },
  reponsesCitees: {
    moins_possible: "le moins possible",
    deux_ans: "2 ans",
    trois_ans: "3 ans",
    cinq_ans: "5 ans",
  },
};

/**
 * Q30 : saisies courantes et appellations ROME auxquelles elles renvoient
 * (codes OGR de data/processed/metiers.json ; un test vérifie qu'ils existent).
 * À compléter en 2.4 avec les saisies des profils d'évaluation.
 */
const synonymesMetiers: Readonly<Record<string, readonly number[]>> = {
  "prof de sport": [18150, 14601],
  kiné: [16136],
  prof: [18161, 404487],
  pompier: [17877, 19309],
  véto: [20672],
  infirmière: [15545],
  "game designer": [12816, 15184],
  "jeux vidéo": [12816, 15184],
};

/**
 * Champs libres de Q5, Q6 et Q20 (questions ouvertes §3) : la consigne sous
 * chaque champ, et la ligne qui s'affiche quand un passage semble parler de
 * santé (repérage de src/lib/questionnaire/textes-libres.ts).
 */
const textesLibres = {
  consigneSante:
    "Pour protéger sa vie privée : aucun nom de personne, et rien sur sa santé, un trouble ou un handicap.",
  santeDetectee:
    "Ce passage semble parler de santé : nous ne le garderons pas. Vous pouvez le reformuler.",
  /** Compteur, affiché à partir de 120 caractères (questions ouvertes §2.4). */
  compteur: "{n} sur {max}",
};

export const questionnaire = {
  chapitres,
  interface: interfaceQuestionnaire,
  ecrans,
  questions,
  raisonsEcart,
  synonymesMetiers,
  textesLibres,
};
