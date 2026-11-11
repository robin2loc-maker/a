# Bilan 3 Pistes : dossier de transfert

Ce dossier rassemble ce qui a été produit jusqu'ici sur le produit (questionnaire, sélection des pistes, explications). Il n'est pas exhaustif : le dépôt complet est `robin2loc-maker/bilan-3-pistes`, branche `claude/cool-cray-w1eh3z`.

Une première conversation a été menée par une orchestratrice qui a délégué à des sous-agents. Le cadre de départ (`CLAUDE.md`, `TODO.md`) avait été écrit par une autre instance de Claude. Le propriétaire a ensuite réorienté le projet vers un système mixte (code + LLM). Rien de ce qui suit n'est figé : le propriétaire veut en discuter.

## Contenu

| Dossier | Fichiers | Ce que c'est |
|---|---|---|
| `cadre/` | `CLAUDE.md`, `page-de-vente.md`, `SPEC.md`, `STYLE.md` | Règles du projet, page de vente (la promesse faite au parent), cahier des charges, règles de rédaction |
| `etat/` | `TODO.md`, `PROGRESS.md`, `DECISIONS.md` | Liste des tâches et leur avancement, journal de progression, décisions prises par les agents (certaines « à valider ») |
| `conception/` | `moteur.md`, `conseiller-ia.md`, `questions-ouvertes.md` | Les trois documents de conception (moteur de score, conseiller LLM, questions libres) |
| `resultats/` | `EVAL.md`, `profils-evaluation.json`, `2.4-conseiller-ia.md`, `evaluation-critique.md` | Évaluation sur 21 profils (sorties complètes), les profils, une vérification du conseiller, un brouillon de critique inachevé |
| `donnees/` | `DONNEES.md`, `SOURCES.md`, `catalogue.json` | Sources de données, et le catalogue des 545 métiers éligibles (4,5 Mo) |
| `code/` | `src/lib/moteur`, `src/lib/conseiller`, `src/lib/questionnaire`, `content` | Le code du cœur du produit |

## État factuel

- Construit : catalogue de 545 métiers sourcés ; questionnaire v3 (28 questions, 3 champs libres facultatifs) ; moteur de score qui présélectionne 20 candidats ; conseiller LLM (xAI) qui choisit 3 pistes dans la présélection et rédige les explications, avec validateur, réparation et replis ; étiquetage des 545 métiers sur 21 dimensions par le LLM.
- Pas construit : aucun écran (questionnaire, résultats, page enfant), pas de paiement, pas d'emails. La page de vente est traitée séparément par le propriétaire.
- Évaluation (21 profils, 35 appels LLM) : 14 résultats entièrement écrits par le LLM, 7 partiels, 0 repli total ; 15 % des textes « pourquoi ça lui ressemble » au gabarit ; latence médiane 21,5 s ; environ 0,055 $ par bilan.
- Problèmes relevés dans `EVAL.md` : trios partiels (le LLM propose parfois deux métiers incompatibles), rappels « Vous avez dit que… » parfois mal formés, environ un lien sur sept qui ne tient pas, métiers évidents absents du catalogue faute de formation reliée (cuisinier, pâtissier, auxiliaire vétérinaire, kiné, auxiliaire de puériculture).
- Budget LLM : 72 appels utilisés sur 150 (49 prévus pour un second tour d'évaluation).

## À propos de `donnees/catalogue.json`

Fichier volumineux (4,5 Mo), mis à disposition au cas où. Il n'est pas nécessaire de l'ouvrir : à ne lire que si tu le juges utile. Si tu veux voir à quoi il ressemble sans l'ouvrir en entier, demande au propriétaire de t'en découper un échantillon (quelques métiers).

## Non inclus (dans le dépôt)

Le reste de `data/processed/` (autres jeux de données, 76 Mo au total), `scripts/`, `tests/`, les autres documents de `docs/` (rapports de données, critiques, vérifications), les réponses brutes du LLM (`.llm/`, non versionnées).
