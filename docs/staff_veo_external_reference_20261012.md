# CAY-STABLE — vidéo Veo de référence pour le dossier Albertville (12/10/2026)

## Objet
Le staff souhaite référencer U.O. Albertville — C.A. Yennois, joué le 11 octobre 2026 au stade Charles-Burdinat, afin de préparer les annotations manuelles et le dossier match.
Le lien Veo précis a été communiqué dans une conversation privée. **Il n'est volontairement pas stocké dans ce dépôt public**, car une URL Veo peut être non répertoriée et concerner des personnes filmées.

## Réutilisation interne
- Le studio existant `staff_tactics.html` possède déjà ses archives locales, onze titulaires maximum, banc, formations, séquences, commentaires et synthèses validées.
- Extension du modèle local existant avec `venue` et `externalVideoUrl` ; source identifiée par `veo:<slug>`.
- Import en un clic des seuls **métadonnées du match** Albertville (date/adversaire/stade), sans lien vidéo ni score fabriqués ; le coach ajoute lui-même l'URL.
- Lien accessible dans un nouvel onglet Veo ; observations chronométrées conservées dans le dossier CAY et liées au même identifiant source.
- En présence d'observations d'une autre source, l'association à une nouvelle vidéo est rejetée.
- Les exports JSON de la feuille et de la synthèse comprennent la référence externe et le lieu, sans prétendre que les images ont été traitées par CAY.

## Statut et limites
- `REFERENCE_EXTERNE`, `analyzedByCAY:false`, `videoCoverage:null`, `evidenceStatus:'INDISPONIBLE'`.
- La page Veo n'a pas pu être lue ou téléchargée depuis l'environnement d'intégration. **Aucun événement de jeu, score, métrique ou tracking n'est déduit de ce lien.**
- Pour le tracking automatique, il faut un fichier vidéo exporté légalement et autorisé, puis importé dans CAY Analyzer.
- `localStorage` n'est ni un compte staff ni un système de synchronisation. Un partage de lien enregistré est accessible au JavaScript du même domaine ; avertir les éducateurs avant de référencer une vidéo non publique.
- Les éventuels droits à l'image et restrictions d'usage restent applicables. Ne pas republier le flux ou la vidéo.

## Provenance et licences
- Source du match : informations fournies par le club utilisateur ; fournisseur de vidéo Veo (plateforme propriétaire, **aucune API, aucun SDK, aucun flux ni code Veo importé**).
- Fonction ajoutée : validation de lien HTTPS et rattachement de référence uniquement avec API Web standard (`URL`). Code original du dépôt, aucune dépendance supplémentaire, aucune licence tiers incorporée.
- Réutilisation : `staff_tactics.html`, `staff_tactical_engine_v1.js`, `app_domain_models_v1.js`, `club_roster_identity_ui_v1.js`.

## Contrôles effectués
- `tests/staff_video_source_v1.test.js` : 26 assertions, 5 répétitions, 0 échec (Node.js 22).
- `node --check` sur le module et son test : réussi.
- Script inline du studio compilé syntaxiquement sans erreur.
- Contrôle de 5 nouveaux identifiants DOM uniques et chargement du module avant le script principal.
- Smoke-test JavaScript sur faux DOM : 15 assertions, import des métadonnées, lien Veo, archive, annotation, ouverture de l'URL et refus de changement de source après observation. **Ce test n'est pas un test navigateur réel**.
- Pas de déploiement ni de test vidéo Veo réel effectués.

## Prochaine validation
- Navigateur Chromium sur l'application complète et export/réouverture d'archive réelle.
- Vérification des accès Veo du staff et obtention d'un MP4 autorisé pour le pipeline tracking.

## Extension du parcours de revue manuelle (12/10/2026)
- Journal filtrable par action (touche, perte, récupération, hors-jeu...) sans modifier la synthèse ni ses dénominateurs.
- Bouton « Repère » sur chaque observation : restaure le temps en secondes dans le formulaire et donne une minute lisible à rechercher **manuellement** sur Veo. Aucun paramètre de démarrage automatique ou contrôle du lecteur Veo n'est supposé.
- Notes et commentaire court visibles immédiatement dans la liste ; contenu inséré via `textContent`, sans interprétation HTML.
- Lorsque des annotations existent, les champs d'identifiant match et identifiant vidéo sont verrouillés dans le formulaire pour éviter d'attribuer les observations à un autre match/film. Le verrou est levé après nettoyage du journal ou lors d'un nouveau match.
- Le formulaire refuse désormais l'horodatage vide, qui risquait d'être interprété comme la seconde zéro.
- Aucun score ou événement n'a été inféré depuis la vidéo d'Albertville.
- Contrôles : `tests/staff_veo_manual_review_v1.test.js` (23 assertions sur faux DOM), `tests/staff_video_source_v1.test.js` (26 assertions) exécutés dans un environnement JavaScript compatible ; vérification syntaxique du script inline du studio. Nécessite une vérification CI sur Node et un essai navigateur réel.
