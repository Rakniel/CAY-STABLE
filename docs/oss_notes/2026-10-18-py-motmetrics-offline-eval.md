# RUN70 — audit py-motmetrics (2026-10-18)

- Source: https://github.com/cheind/py-motmetrics
- Licence: MIT (LICENSE du dépôt officiel, copyrights à conserver).
- Version de référence: v1.4.0, publiée le 2024-10-30 (GitHub Releases).
- Fonction envisagée: évaluation hors ligne des pistes MOT, MOTA, MOTP, IDF1, comparaison avec le contrat existant tracking_eval_metrics_v1.js.
- Réutilisation: éviter d'écrire un second évaluateur complet. Conserver le module JavaScript existant pour les diagnostics légers dans l'interface.
- Gain potentiel: 1 à 3 jours d'implémentation de métriques d'évaluation, estimation non mesurée.
- Statut: ÉTUDIÉ, NON INTÉGRÉ. Aucun code ni modèle tiers importé, aucune modification amont.
- Risques: Python et dépendances numériques, conversion MOT à valider, différences de définition des métriques; aucun score sur vidéo réelle tant que la vérité terrain et sa couverture ne sont pas qualifiées.
- Décision: réserver à un banc de benchmark hors ligne, jamais à une statistique joueur publiée sans preuve.
