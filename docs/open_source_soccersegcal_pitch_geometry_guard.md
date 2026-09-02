# SoccerSegCal — garde géométrique terrain CAY-STABLE

## Source auditée

- Projet : `Spiideo/soccersegcal`
- Révision auditée : `378a4729a92fb513c1f7365299ec8515e934cc1b`
- Licence : MIT (`LICENSE` présent à la racine)
- Rôle upstream : segmentation sémantique des marquages d'un terrain de football puis estimation/calibration caméra à partir d'un modèle géométrique de terrain.
- Fichier de référence conceptuelle : `sncalib/soccerpitch.py`.

## Idée réutilisée

SoccerSegCal ne traite pas le terrain comme un polygone libre : les lignes et surfaces appartiennent à un modèle de football contraint. Le contour du terrain complet est défini par quatre côtés sémantiques, tandis que les surfaces de réparation, surfaces de but, ligne médiane, cercle central et buts sont des éléments internes/connus du modèle.

CAY-STABLE adapte ce principe au navigateur avec `pitch_geometry_guard_v1.js` :

- les nombreux points détectés le long des lignes restent des **échantillons de preuve** ;
- la frontière jouable canonique devient toujours un quadrilatère projeté ;
- les points colinéaires ou quasi colinéaires sont réduits sans changer la surface de manière significative ;
- une forme comportant des coins supplémentaires significatifs est rejetée au lieu d'être présentée comme un terrain valide ;
- un modèle métrique football expose les dimensions et repères fixes utiles à la future calibration automatique.

Le garde est chargé avant `pitch_membership_guard_v1.js`, qui utilise désormais la frontière canonique avant d'accepter/rejeter le point-sol d'un joueur. Cela évite que le banc ou un contour irrégulier devienne silencieusement une partie du terrain.

## Ce qui n'est pas importé

Aucun code Python/PyTorch de segmentation, differentiable rendering, poids de modèle ou dépendance SoccerNet n'est ajouté au runtime CAY-STABLE. La logique JavaScript est une adaptation légère spécifique à CAY ; aucune fonction upstream n'est copiée telle quelle.

## Modifications CAY

- UMD JavaScript sans dépendance ;
- dimensions par défaut 105 × 68 m, avec garde de plage association-football ;
- simplification déterministe du hull vers quatre côtés uniquement lorsque les coins supplémentaires sont suffisamment proches d'une ligne ;
- contrôle de perte de surface pour éviter une simplification agressive ;
- intégration à la politique existante `BOTTOM_CENTER_GROUND_ANCHOR` ;
- forme impossible => `INDISPONIBLE`, jamais une métrique inventée.

## Gain attendu / mesure

- Travail évité estimé : **0,5 à 1 jour** de conception d'un modèle sémantique de terrain et de ses invariants.
- Test synthétique : 10 échantillons réguliers sur quatre lignes sont ramenés à 4 coins avec conservation de surface de 100 %.
- Une forme à 6 coins significatifs est refusée comme `PITCH_BOUNDARY_NOT_QUADRILATERAL`.
- Impact attendu sur les vidéos C.A. Yenne : moins de contours aberrants, moins d'inclusion du banc et base plus propre pour supprimer progressivement le calibrage manuel.

## Risques / dépendances

La garde géométrique ne remplace pas encore une segmentation de lignes ou un solveur caméra automatique complet. Une hypothèse de terrain mauvaise mais quadrilatérale peut encore être plausible ; elle doit rester combinée aux contrôles d'homographie, reprojection, multi-plans et confiance déjà présents dans CAY-STABLE. Aucun nouveau runtime externe n'est requis.
