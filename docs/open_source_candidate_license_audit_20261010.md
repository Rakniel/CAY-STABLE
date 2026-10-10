# CAY-STABLE — revue de réutilisation OSS (2026-10-10)

Cette revue est réalisée **après inspection des modules existants** `tracking_trackeval_export_v1.js`, `first_results_readiness_v1.js`, `auth_contract_v1.js` et `OPEN_SOURCE_COMPONENTS.md`. Aucun code externe ni poids de modèle n'a été importé dans ce lot.

| Projet / version ou révision vérifiée | Licence et preuve | Utilité face à CAY-STABLE | Décision et risques |
| --- | --- | --- | --- |
| [TrackEval](https://github.com/JonathonLuiten/TrackEval), référence déjà enregistrée `12c8791b303e0a0b50f753af204249e622d0281a` | MIT, `LICENSE` upstream | Évaluation HOTA/IDF1/MOTA à partir de l'export MOTChallenge CAY ; évite d'écrire un évaluateur complet | **Adaptateur existant renforcé**, sans copie du moteur ; annotations réelles obligatoires. |
| [SportsLabKit](https://github.com/AtomScott/SportsLabKit), version publiée 0.3.1 | GPL-3.0 (fichier `LICENSE` du dépôt, vérifié le 2026-10-10) | Fournit ByteTrack, DeepSORT, homographie et tableaux de trajectoires ; doublonne largement les contrats CAY existants | **Rejeté pour intégration directe** sans acceptation explicite des obligations GPL ; Python et modèles externes. |
| [WunderScout](https://github.com/qhuboo/wunderscout), tag v0.2.2 | PyPI indique MIT, mais **aucun fichier LICENSE dans la racine du tag** et aucune licence déclarée par l'API GitHub ; provenance légale insuffisante pour copier le code | Détection, ByteTrack, homographie, heatmaps : fonctions déjà partiellement présentes dans CAY | **Rejeté pour copie/intégration**, référence exploratoire uniquement ; projet déclaré expérimental et poids des modèles distincts. |
| [Simo-03/football-player-detection](https://github.com/Simo-03/football-player-detection), commit `c0c305d4763819f0e0f28e6557bd443d2b3fc973` | MIT, fichier `LICENSE` vérifié | Pipeline YOLO/BoT-SORT/homographie/événements ; utile comme jeu d'essai de l'interface détecteur→CAY | **Étudié, non intégré** : projet de démonstration, maturité et licence des poids à valider avant usage. |

## Comparaison de l'effort

- **TrackEval / export MOT existant** : évite potentiellement 1–3 jours de développement d'un évaluateur personnalisé (estimation, non mesurée). L'impact mesurable sera IDF1/HOTA/ID switches sur des séquences annotées ; aucun score Yenne disponible à ce jour.
- **SportsLabKit** : un port direct économiserait peut-être 2–5 jours de prototype, mais la contrainte GPL et le coût d'intégration Python ne justifient pas ce choix. Gain réalisé : **0 jour**.
- **WunderScout** : pas d'import ; gain réalisé **0 jour**. Évite une dette de provenance et une dépendance expérimentale.
- **Simo-03** : comparaison de concepts uniquement ; gain réalisé **0 jour**.

## Lot de correctifs CAY (sans dépendances)

Branche de travail : `integration/validated-evidence-guards-20261010`, issue de la branche de PR #454. Les trois contrats existants sont étendus : identité authentifiée complète, couverture non nulle, export MOT fail-closed sur IDs/frames invalides. Trois tests ciblés ajoutés. Les 8 suites du patchset consolidé ont réussi **5 exécutions** localement, avec vérifications de syntaxe. **Aucune CI distante ni vidéo réelle validée pour ce commit au moment de la rédaction**.

Ne pas annoncer de build opérationnel avant : (1) CI complète verte ; (2) vidéo réelle représentative ; (3) contrôle des faux CAY, banc/spectateurs, plans caméra et limites de couverture ; (4) parcours éducateur <20 minutes chronométré.
