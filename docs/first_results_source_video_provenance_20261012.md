# CAY-STABLE — source vidéo des premiers résultats (2026-10-12)

Source : modules internes CAY `first_results_readiness_v1.js` (contrat `CAY_FIRST_RESULTS_READINESS_V1`). Aucune dépendance ou ligne de code externe ajoutée ; licence externe sans objet.

Modification : compare les empreintes des cinq résultats, accepte les empreintes d'étapes différentes uniquement si chaque résultat déclare la même `sourceVideoFingerprint`, rejette les déclarations partielles et les analyses différentes. `sourceVideoFingerprintConsistent` signale seulement la cohérence déclarative, pas une preuve cryptographique.

Tests : cinq suites ciblées répétées cinq fois localement ; 83 assertions dans le nouveau test. Les tests navigateur, la CI distante et les vidéos réelles restent à réaliser.

Statut : branche de validation ; pas de promotion STABLE. Aucun temps économisé ni gain de précision mesuré.
