# CAY-STABLE — preuve d'identité roster (2026-10-14)

- **Source** : `first_results_testability_gate_v1.js` interne, blob source `c25d3c385e8ead7eda173563fe847f2b5d25d9c9`.
- **Licence externe** : aucune nouvelle dépendance, poids ou code tiers.
- **Fonction** : exiger `roster.playerId` texte non vide avec statut `LIÉ`, cohérent avec `player_card_roster_binding_v1.js`.
- **Remplace** : aucune logique ; étend `rosterEligibility()` et les filtres existants, sans duplication.
- **Avant/après** : 40 fausses éligibilités synthétiques sur 40 avant, 0 sur 40 après ; identité valide et legacy sans roster préservés.
- **Validation** : 6 suites existantes répétées 3 fois (18 passages), 1 093 assertions en environnement JS isolé, 395 assertions du nouveau test, syntaxe parsée. Pas de vidéo ni CI GitHub validée.
- **Statut** : branche de validation uniquement ; certification STABLE en attente.
