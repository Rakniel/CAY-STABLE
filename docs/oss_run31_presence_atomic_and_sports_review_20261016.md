# RUN31 — présence atomique et audit OSS (2026-10-16)

## Modifications internes
Base: `cay/run28-geometry-failclosed-20261016` (`5ec1a35066c3d8bcd87880c148255c313f7dae07`).
- `observed_presence_v1.js`: rejette les identifiants invalides (null, booléen, vide, objet, non-entier, entier dangereux). Un instant compromis devient `INDISPONIBLE` avant tout ajout au roster persistant.
- `observed_presence_report_v1.js`: utilise le normaliseur canonique et exclut l'instant rejeté des joueurs présents et du dénominateur de couverture.
- `tests/observed_presence_atomic_invalid_frame_nonregression.js`: vérifie absence de joueur fantôme, diagnostic, puis réapparition valide.

Mesure synthétique: scénario joueur 77 valide + identifiant true, RUN30 ajoutait 1 joueur et marquait `PARTIEL`; RUN31 ajoute 0 joueur et marque `INDISPONIBLE`.
Validation locale: trois répétitions des suites RUN30 (399+160+12 assertions par répétition) et du test atomique (39 assertions par répétition), avec substitut minimal du module de projection; 24 assertions complémentaires sur trois passages avec le vrai `player_stats_v1.js` dans V8. Syntaxe JS contrôlée. **CI complète et vidéo réelle non validées.**

## Composant externe étudié : Roboflow sports
- Source: https://github.com/roboflow/sports
- Licence: **MIT**, copyright Roboflow 2024, vérifiée sur `LICENSE`.
- Version: `setup.py` 0.1.0; révision `42c80c06b6b65a7f89455b89fe31cdf4c38ba227`.
- Fonctions: terrain `sports/configs/soccer.py`, transformation perspective `sports/common/view.py`, classification équipes `sports/common/team.py`.
- Remplacement envisagé: prototype Python externe plutôt que réécrire une classification d'équipe ou la transformation perspective. **Ne pas dupliquer** `automatic_pitch_calibration_v1.js` et `metric_homography_projector_v1.js` déjà présents.
- Gain potentiel: 1 à 3 jours **non mesurés**; impact terrain non mesuré.
- Statut: **ÉTUDIÉ / NON INTÉGRÉ**. Code externe copié: aucun. Modifications du composant externe: aucune.
- Risques: package bêta, dépendances Python (OpenCV, transformers, supervision, umap-learn), licences des poids à vérifier, faux positifs CAY sur détails jaunes. Promotion interdite sans benchmark sur vidéos du club.

Limites produit: maximum 11 joueurs simultanés mais roster supérieur, aucune statistique physique non défendable, interface rouge/noir et logo officiel inchangés. Objectif premier résultat <20 min **non encore démontré**.
