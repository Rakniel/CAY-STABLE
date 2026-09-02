# CAY-STABLE — provenance OSS : lissage temporel de calibration

Date d'audit : 2026-09-03

## Source étudiée

- Projet : `rafaelsouza-tech/soccer-tactical-vision`
- Révision auditée : `4c557534c624948f3bfe3db956859c7ea3b442fa`
- Licence : MIT
- Fichier de licence vérifié : `LICENSE`, copyright Rafael Souza 2026
- Fonction étudiée : calibration par keypoints + homographie RANSAC validée + lissage temporel. Le projet documente explicitement un lissage Kalman/RTS sur des points canoniques plutôt que sur les coefficients bruts de la matrice H.

## Réutilisation dans CAY-STABLE

Aucun code tiers n'est copié. L'idée architecturale est adaptée au runtime JavaScript existant de CAY-STABLE :

1. chaque keyframe de calibration reste une homographie absolue validée indépendamment ;
2. CAY n'interpole jamais les neuf coefficients d'une homographie ;
3. lorsqu'un instant est encadré par deux keyframes validés et que chacun reste dans la fenêtre de fraîcheur autorisée, les deux projecteurs évaluent le même point image ;
4. CAY interpole uniquement les coordonnées terrain résultantes en mètres ;
5. hors de cette fenêtre, le projecteur validé le plus proche reste utilisé ; au-delà de l'âge maximum, la métrique reste `INDISPONIBLE` ;
6. une coupure de segment invalide toujours la propagation.

## Ce que cela remplace

Avant cette modification, `metric_segment_registry_v1.js` choisissait simplement le keyframe temporel le plus proche. Au milieu de deux calibrations cohérentes, la sortie pouvait donc basculer instantanément d'une projection à l'autre et créer un faux saut dans une trajectoire, puis contaminer distance/vitesse/heatmap métrique.

Le nouveau comportement supprime ce basculement discret sans introduire de dépendance externe ni masquer l'incertitude de calibration.

## Gain attendu

- Travail évité : environ 0,5 à 1 jour de conception d'un lissage ad hoc des matrices H et de débogage de ses instabilités.
- Impact mesurable du test synthétique : deux keyframes distants de 2 m produisaient un saut de 2 m au changement de keyframe ; au point médian, la projection est désormais 1 m entre les deux et évolue continûment autour du milieu.
- Impact produit attendu : trajectoires métriques plus stables lors des mouvements caméra, donc moins de faux pics de vitesse et de fausses distances.

## Risques / garde-fous

- Le blend n'est autorisé qu'entre deux calibrations déjà validées et toutes deux suffisamment fraîches.
- Aucune interpolation n'est faite entre segments/plans différents.
- Cette technique ne crée pas une calibration lorsqu'elle manque : sans keyframe défendable, les métriques restent `INDISPONIBLE`.
- Le comportement doit encore être mesuré sur les vidéos C.A. Yenne avant d'être utilisé comme preuve de précision métrique finale.

Statut : **intégré et soumis aux tests de non-régression**.
