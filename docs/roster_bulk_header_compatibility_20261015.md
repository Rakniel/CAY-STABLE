# CAY-STABLE — Import effectif CSV/Excel : en-têtes souples (15 octobre 2026)

## Provenance et licence
- **Projet amont :** Papa Parse — https://github.com/mholt/PapaParse
- **Version utilisée :** 5.7.0, déjà vendue sous `vendor/papaparse.min.js`.
- **Licence :** MIT, notice conservée dans `vendor/PAPAPARSE_LICENSE`.
- **Modification amont :** aucune. Pas de copie d'un autre projet.
- **Adaptation locale :** `club_roster_identity_ui_v1.js`, `prepareRosterImport()` : reconnaissance d'en-têtes français/anglais, ordre des colonnes et numéros de ligne corrects, sans dupliquer le parseur CSV.

## Contrats maintenus
- Import transactionnel : aucune écriture de l'effectif avant validation complète.
- Identités de joueurs et de tracks non inférées depuis les couleurs ni depuis les en-têtes.
- Effectif >11 permis ; limite de 11 simultanément sur terrain inchangée.
- Les formats sans en-tête et le format historique `#;Nom` restent compatibles.
- Ligne physique du CSV renvoyée en cas d'erreur après une ligne d'en-tête.
- Pas de mot de passe, pas de backend fictif.

## Validation
- 90 contrôles V8 avec les **véritables** modules CAY et Papa Parse, sur 5 répétitions : PASS.
- Compilation syntaxique V8 du module et du nouveau test : PASS.
- Suite Node `tests/club_roster_bulk_import_nonregression.js` et nouveau `tests/club_roster_bulk_header_mapping_nonregression.js` : à lancer en CI / Node réel.
- Suite complète, navigateur et vidéo réelle : NON EXÉCUTÉS ici.
- Gain attendu : réduction des corrections manuelles de colonnes ; temps économisé non mesuré.
- Risque : en-têtes ambigus/non reconnus rejetés plutôt que devinés.

## Mesure avant/après
Parmi les 7 formats valides testés : **3/7** acceptés avant, **7/7** après.
