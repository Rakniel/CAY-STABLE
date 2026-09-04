# Open-source audit — SportsLabKit

Date d'audit CAY-STABLE: 2026-09-04

## Source

- Projet: `AtomScott/SportsLabKit`
- Branche inspectée: `develop`
- Révision inspectée: `9591d6db9e8de20e6a458ba24a45ac58d23d1358`
- Version annoncée par cette révision: `0.3.2a10`
- Licence du dépôt: GNU GPL v3

## Fonctions intéressantes

SportsLabKit regroupe dans une même boîte à outils des briques utiles à notre problème: tracking multi-objet, modèles de détection/ReID interchangeables, calibration 2D du terrain et structures de données de trajectoires/coordonnées. Son architecture confirme l'intérêt d'un pipeline qui sépare clairement coordonnées caméra, coordonnées terrain et identité persistante.

## Décision CAY-STABLE

**REJETÉ pour copie/intégration directe de code** dans le build CAY-STABLE actuel.

Motif: GPL-3.0 impose un régime copyleft fort qui n'est pas accepté comme dépendance intégrée par défaut dans la stratégie actuelle du produit. Nous ne copions donc aucun code, configuration, modèle ou poids SportsLabKit et n'ajoutons aucune dépendance runtime vers ce projet.

L'idée générale de séparer les trajectoires par fenêtres temporelles/états de jeu est utilisée uniquement comme référence d'architecture générique; l'implémentation CAY reste native et clean-room, basée sur son propre modèle roster/remplacements déjà existant.

## Travail évité / impact

- évite d'introduire puis de devoir retirer une dépendance GPL dans la chaîne tracking/calibration;
- évite un second modèle de données tracking concurrent du modèle CAY existant;
- estimation de travail de réintégration/retrait évité: **0,5 à 1,5 jour**;
- aucune dépendance supplémentaire, aucun risque de contamination de licence.

## Modification CAY associée

La PR associée étend `app_domain_models_v1.js` avec `splitTrackEvidenceByParticipation()`. Cette fonction ne remplace pas le tracker et ne copie aucune logique SportsLabKit: elle transforme les fenêtres de participation déjà dérivées par CAY en entrées de trajectoire séparées, de manière à empêcher tout raccord métrique artificiel entre deux périodes de présence distinctes.
