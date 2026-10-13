# C.A. Yenne — booléens interdits comme confiance de calibration (13 octobre 2026)

## Défaut reproduit
Dans `player_stats_v1.js`, `Number(true) === 1` pouvait transformer une valeur de calibration **booléenne** en confiance numérique maximale, malgré une homographie simplement déclarée `validated:true`. Cela pouvait autoriser à tort la projection métrique de l'équipe et certains indicateurs issus des fiches joueurs. La heatmap terrain rejetait déjà ce type, créant une incohérence entre modules.

## Correction minimale et réutilisation
Le parseur canonique `projectorInfo` du moteur existant accepte uniquement une confiance numérique ou une chaîne numérique non vide, puis conserve la vérification de finitude et de l'intervalle [0,1]. Les booléens, null, valeurs manquantes, chaînes vides et nombres hors intervalle donnent `confidence:null`. La politique `metricProjectorInfo` exige toujours `validated:true` et une confiance >= 0,5 ; les anciennes chaînes numériques (ex. `'0.8'`) restent compatibles.

Aucun second parseur de calibration n'est ajouté. Le garde de qualité conserve son **diagnostic géométrique interne** et la frontière `metric_publication_guard_v1.js` continue à masquer distance, vitesse et sprints lorsque la preuve est insuffisante. Cette correction ne modifie pas la politique existante de publication ni le seuil de qualité >= 0,8.

## Vérifications
- Test de régression : `tests/player_stats_boolean_calibration_confidence_nonregression.js`, 52 assertions, couvrant `player_stats`, timeline équipe, `metric_quality_guard`, `metric_pitch_heatmap`, `metric_publication_guard`, seuil 0,5 et chaînes numériques.
- Avant : `confidence:true` devient `1` dans `Stats.projectorInfo` ; nouveau test échoue immédiatement.
- Après : `confidence:true` et `false` donnent `null` ; aucun instant équipe métrique, aucune publication physique, heatmap terrain `INDISPONIBLE`.
- Environnement d'exécution isolé JS : 35 passages (7 suites × 5) et 1 121 assertions avec vérification syntaxique ; les suites existantes restent vertes. Cette simulation ne remplace ni GitHub Actions, ni un test navigateur, ni une vidéo réelle.

## Provenance, licences et limites
- Modification **CAY native** dans `player_stats_v1.js` ; aucun code externe importé, aucune nouvelle dépendance ni poids de modèle.
- Référence OSS distincte : `OPEN_SOURCE_COMPONENTS.md` compare Norfair BSD-3-Clause à Roboflow Trackers Apache-2.0 ; ces bibliothèques restent étudiées, **non intégrées**.
- Impact mesuré : un scénario de faux positif booléen corrigé, avec cohérence des quatre surfaces de contrôle. Aucun gain de précision de tracking, temps de lancement ou HOTA/IDF1 n'est encore mesuré.
- Critères de promotion STABLE inchangés : 11 joueurs maximum simultanés, roster supérieur, exclusion banc/spectateurs et faux CAY sur jaune, couverture par plan, données physiques non publiables sans preuve suffisante, vérification vidéo réelle et ergonomie club.
