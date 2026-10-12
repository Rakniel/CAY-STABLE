# CAY-STABLE — Studio tactique staff (2026-10-12)

## Livraison sur `main`
- `staff_tactics.html` : tableau tactique et feuille de match accessibles depuis le bouton « STUDIO TACTIQUE & FEUILLE DE MATCH » dans `index.html`.
- `staff_tactical_engine_v1.js` : 18 formations de 11 emplacements, direction réversible, scénarios appels/contre-appels, faux 9, n°10, hors-jeu pédagogique, touches, coulissement, transitions et CPA.
- Feuille : onze joueurs maximum simultanément, banc au-delà de 11, photos si disponibles dans le trombinoscope, postes et positions déplaçables.
- Outils : stylo, gomme, lignes, flèches, rectangles, cercles, ligne hors-jeu, scénarios sauvegardés, dossiers de matchs locaux.
- Journal : touche, gain/perte, hors-jeu, passes, tirs, duels et phases arrêtées ; horodatage, vidéo source, zone, issue, notes ; validation coach explicite.
- Synthèse : taux de conservation des touches sur **le sous-ensemble confirmé et évalué**, thèmes d'entraînement proposés à partir d'au moins trois faits validés. Sinon INDISPONIBLE.

## Provenance, licences et versions
- Code tiers **incorporé** : aucun. Code conçu pour ce dépôt, sans nouvelle dépendance, pas de licence open source importée.
- Réutilisation interne : `app_domain_models_v1.js` (`createPlayer`, `createTeam`, `validateMatchParticipants`) et `club_roster_identity_ui_v1.js` (`createStore`, `currentTeam`, clé de roster existante). **Pas de copie ni de modification de ces modules.**
- Nouveau moteur : `CAY_STAFF_TACTICAL_ENGINE_V1`, implémentation originale du dépôt.

## Vérifications locales réalisées
- Test Node ciblé (source local) : 105 assertions par passage, 18 formations, retour miroir, garde à 11, cas d'observation validée / non validée et synthèse touche.
- Test navigateur Chromium Playwright (avec doubles des APIs métier externes) : 27 contrôles par passage, 0 erreur JS ; sans effectif, 13 membres, limite à 11, titulaires/banc, changement de formation, tracé flèche et annulation, sauvegarde de scène, dossier match, archivage, observation coach.
- 3 répétitions complètes de chaque suite sans échec ; `node --check` du moteur et scripts embarqués réussi.

## Limites et risques
- Aucun détecteur de touche, hors-jeu, appel ou récupération connecté à la vidéo. Les événements sont **annotés et validés manuellement**.
- Le rapport n'évalue pas automatiquement tout le match ; les séquences non annotées ne rentrent pas dans le dénominateur.
- Une proposition d'entraînement est une règle explicite, pas une conclusion d'IA entraînée.
- Les archives et photos sont conservées dans le `localStorage` du même navigateur/domaine, **sans synchronisation ni compte staff**. Export JSON recommandé ; risque de quota.
- La ligne hors-jeu est illustrative, pas une décision d'arbitrage. Réception directe d'une touche : pas d'infraction hors-jeu (IFAB, Loi 11).
- Vérification supplémentaire nécessaire sur la véritable version déployée et sur les données réelles du club.
