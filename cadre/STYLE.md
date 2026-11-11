# Style — rédaction et design

## Ce qu'on vise

Une mère lit les pistes et pense : « C'est exactement lui. » Le propriétaire, copywriter très exigeant, les lit et pense : « C'est excellent. » Pas « c'est correct », pas « ça respecte les règles ».

Écris comme le ferait le meilleur rédacteur humain : précis, vrai, simple, chaleureux sans en faire trop. Le modèle à suivre est `docs/page-de-vente.md`, et surtout sa carte « Conducteur de travaux » (section « Prenons un exemple »).

Les règles ci-dessous servent à éviter les erreurs graves. **Elles ne font pas la qualité** : la qualité vient de la précision et de la justesse. Avant d'écrire, demande-toi ce qui rendrait ce texte remarquable.

## Quatre règles non négociables

1. **Vrai.** Aucun chiffre sans source (`CLAUDE.md` §5), aucune promesse de résultat, aucun « tous » ni « la plupart » sans source.
2. **Concret.** Un fait, une situation, un geste, plutôt qu'une qualité abstraite. Dans « Pourquoi ça lui ressemble », chaque phrase relie une réponse précise du parent à un fait précis du métier.
3. **Simple.** Phrases courtes, français parlé, aucun jargon. Une phrase qui ne sert pas s'en va.
4. **Pour toutes les familles.**
   - Ne blâmer personne : ni l'enfant, ni les parents, ni les profs.
   - Respecter tous les métiers.
   - Aucun détail qui exclut une partie des familles.
   - Aucun adjectif genré adressé au lecteur.
   - Vouvoiement pour le parent, tutoiement pour l'enfant, accords il / elle.

## Le ton à viser (exemples validés par le propriétaire)

- « En vrai… c'est pas bête. » (une voix d'ado sobre, jamais un ado de pub)
- « Venant d'un ado, c'est presque un compliment. »
- « Vous n'avez rien à chercher : les réponses, vous les avez déjà. »
- « Un métier auquel il n'aurait sans doute jamais pensé. Vous non plus, peut-être. »

## Avant / après

- ❌ « Votre enfant est-il quelqu'un de sociable ? »
  ✅ « Il est plus à l'aise seul ou en groupe ? »
  (Une question porte sur ce que le parent **voit**, pas sur une qualité abstraite.)
- ❌ « Ce métier est fait pour lui car il aime aider les autres et il est très sociable. »
  ✅ « Vous avez dit qu'il reste calme quand les autres paniquent : ses patients sont souvent inquiets, et c'est lui qui les rassure. »
- ❌ « Félicitations ! Votre bilan est prêt 🎉 »
  ✅ « Les 3 pistes de Lucas sont prêtes. »

## Design

- **Ce qu'on vise** : simple, précis, fini au pixel près. La page de vente ressemble à un article de presse sérieux ; les résultats, à un document bien composé.
- **Contraintes** : mobile d'abord (360 px), texte de 17 à 18 px, contraste AA.
- **À éviter** :
  - les effets gratuits : dégradés, ornements, illustrations génériques ;
  - l'imitation d'un site de l'État.
- **Méthode** : regarder de vraies références de haut niveau, faire moins de choses mais finies, prendre une capture, la regarder, corriger.

## Ce que le code vérifie à ta place (inutile d'y penser en écrivant)

- **Typographie française** (espaces insécables, « 27 € ») : appliquée automatiquement au rendu par un utilitaire.
- **Tics d'IA** (emojis, « Félicitations », « Découvrez », « N'hésitez pas », « révéler son potentiel », « passion », « s'épanouir », points d'exclamation en série) : détectés par un test sur les textes.
- **Tous les textes visibles vivent dans `content/`**, pas dispersés dans les composants. Le propriétaire pourra les modifier facilement, et le test peut les lire.
