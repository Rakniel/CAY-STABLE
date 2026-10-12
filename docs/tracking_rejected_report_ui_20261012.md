# CAY-STABLE — invalidation des rapports et fiches rejetés (12 octobre 2026)

## Provenance et licence
- **Code modifié** : `stable_runtime_tracking_v2.js` du dépôt CAY-STABLE, branche de validation PR #456, base `8e44f8ff3d260fe316d8a667403f8bb0cf82f9af`.
- **Fonctions réutilisées** : `completionVerdict`, `renderPlayerStats`, `ensureStatsPanel` et le panneau CAY existant. Aucune duplication du moteur de tracking.
- **Code externe** : aucun import ni copie ; dépendances ajoutées : **0**. Licence externe : sans objet.
- **Comparatif externe déjà documenté** : Roboflow Trackers (Apache-2.0), OpenCV >=4.5 (Apache-2.0), SoccerTrack v2 (MIT pour le code, CC BY 4.0 pour les données). Statut : **étudiés, non intégrés** ; licences des poids à examiner séparément.

## Modification
Effacement de l'ancien rapport, des fiches et de la galerie dès le début d'une tentative. En cas de runtime indisponible, de vidéo/références manquantes, d'exception ou de verdict de complétion refusé : état `INDISPONIBLE`, export désactivé, rapport en mémoire supprimé. Le rapport validé peut toujours être exporté et le statut `PARTIEL` conserve ses limites.

## Vérification
Cinq scénarios : runtime bloqué, vidéo absente, références absentes, exception de modèle, verdict refusé. Cinq répétitions. Vérification syntaxique du module, tests du nettoyage de l'interface et du rapport. Les tests restent simulés : pas de preuve de fonctionnement sur vidéo réelle ou de délai inférieur à 20 minutes. Aucun gain de précision ou de temps mesuré.

## Risques restants
Le test est un harness DOM simulé et non un test navigateur complet. Le rendu des trajectoires/heatmaps, la validité géométrique multi-plans, l'identification par maillot et le parcours utilisateur réel exigent des tests complémentaires. Ne pas fusionner la PR #456 avant validation CI, navigateur et vidéo réelle.
