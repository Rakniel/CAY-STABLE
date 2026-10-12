# CAY-STABLE — garde géométrique des détections (2026-10-10)

- **Module étendu** : `stable_tracking_bridge_v1.js` sur `integration/validated-evidence-guards-20261010`. Aucun nouveau module de tracking et aucune dépendance ajoutée.
- **Défaut** : `Number(null)`, `Number('')`, `Number(false)` et `Number([])` produisaient 0 ; certaines boîtes invalides devenaient des ancres plausibles. Cela pouvait créer de faux joueurs CAY.
- **Correction** : seules les valeurs numériques primitives finies et les chaînes numériques non vides sont converties ; les boîtes exigent quatre champs valides et des dimensions strictement positives. La boîte valide demeure un repli lorsque x/y normalisés manquent.
- **Traçabilité** : les rejets passent par le compteur existant `normalization_failed` ; aucune promotion automatique de statistiques, de métriques ou de fiabilité.
- **Tests** : 18 cas de coordonnées, 6 boîtes malformées, repli valide, origine valide, création d'une seule identité ; tests de pont, de plafond strict 11 et de passage d'options exécutés 5 fois en chargeur CommonJS.
- **Avant/après synthétique** : coordonnées invalides rejetées 4/9 → 9/9 ; boîtes rejetées 0/6 → 6/6 ; tracks créés par 9 coordonnées invalides 5 → 0.
- **Provenance et licences** : correction écrite pour CAY, **aucun code tiers copié**. Les composants externes étudiés et leurs licences restent inventoriés dans `OPEN_SOURCE_COMPONENTS.md`.
- **Limites** : validations en JavaScript isolé avec vrais modules CAY, pas de vidéo réelle ni de CI GitHub. Les performances terrain doivent être évaluées séparément.
