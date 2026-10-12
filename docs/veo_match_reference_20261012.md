# CAY-STABLE — Référence vidéo Veo et dossier Albertville (2026-10-12)

## Périmètre livré sur la branche de développement
- Le studio tactique possède un champ **stade**, un champ **lien Veo** et un bouton pour ouvrir la vidéo externe.
- Un bouton prépare le dossier **U.O. Albertville – C.A. Yennois**, daté du 11 octobre 2026 au **stade Charles-Burdinat**, à partir des informations communiquées par le club.
- Le lien fourni dans la conversation n'est pas inscrit dans le code public : le staff peut le coller dans l'interface. Il est alors stocké uniquement dans le `localStorage` de son navigateur, et inclus dans l'export JSON choisi par le staff.
- Les observations manuelles conservent `sourceVideoId` ; un changement de source contradictoire est refusé.
- Le lien Veo ne fournit ni vidéo MP4, ni images, ni couverture, ni mesures. Toutes les statistiques automatiques correspondantes restent **INDISPONIBLE** tant qu'une source exploitable et les contrôles vidéo ne sont pas disponibles.

## Provenance et licences
| Composant | Origine | Licence | Version | Modification |
|---|---|---|---|---|
| `staff_video_source_v1.js` | Code original CAY-STABLE | Licence du dépôt CAY-STABLE | `CAY_STAFF_VIDEO_SOURCE_V1` | Nouveau validateur strict des liens Veo |
| `staff_tactics.html` | Code existant CAY-STABLE | Licence du dépôt CAY-STABLE | `CAY_STAFF_UI_V1` | Extension de l'archive et des exports |
| `app_domain_models_v1.js` | Code interne CAY-STABLE | Licence du dépôt CAY-STABLE | Version existante | Réutilisé sans modification |
| `staff_tactical_engine_v1.js` | Code interne CAY-STABLE | Licence du dépôt CAY-STABLE | `CAY_STAFF_TACTICAL_ENGINE_V1` | Réutilisé sans modification |

**Aucune bibliothèque, modèle ou séquence vidéo tiers incorporé.** Veo est un service vidéo externe et non une bibliothèque open source.

## Tests effectués
- Validation JavaScript du code ajouté et du script du studio : réussite.
- Tests du validateur : **26 assertions par passage, 5 passages réussis (130 assertions)** dans un environnement JavaScript isolé.
- Test d'intégration du studio avec DOM simulé : **15 assertions réussies** (préparation du dossier, liaison du lien, archivage, traçabilité d'une observation et rejet du changement de source).
- Aucun test Chromium, aucune vidéo réelle ni mesure de tracking exécutés pour cette livraison.
- Trois workflows GitHub Actions ont été déclenchés sur le commit de documentation : intégration STABLE, calibration V2 et contrôle syntaxique racine. Ils étaient encore **en cours** lors de la vérification ; aucun succès CI n'est revendiqué avant conclusion.

## Limites et prochaines étapes
1. Tester l'interface sur navigateur réel, sur la version déployée.
2. Obtenir un export vidéo autorisé pour le pipeline CAY Analyzer ; ne pas tenter de contourner les restrictions d'accès Veo.
3. Réconcilier explicitement la référence Veo et l'identifiant du fichier vidéo importé sans supposer qu'ils sont identiques.
4. Vérifier la couverture et les erreurs d'identité avant trajectoires et heatmaps ; distance, vitesse et événements restent soumis aux preuves disponibles.
5. Conserver le logo officiel inchangé, les couleurs rouge/noir, l'effectif supérieur à 11 avec seulement 11 actifs et le statut INDISPONIBLE en cas de données insuffisantes.
