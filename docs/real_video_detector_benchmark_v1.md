# Benchmark détecteur réel V1 — Sarcelles vs Aubervilliers U16 R1

## But
Ce benchmark fixe des cas représentatifs observés directement sur la vidéo réelle utilisée pour éprouver CAY-STABLE. Il ne remplace pas une annotation boîte-par-boîte ; il fournit un contrat minimal de réalité destiné à empêcher la promotion d'un détecteur qui passe seulement des tests synthétiques.

## Vidéo source
- Nom local : `Sarcelles vs Aubervilliers U16 R1.mp4`
- Durée observée : ~1 h 54 min 54 s
- Résolution : 640 × 360
- Framerate : ~29,97 fps
- La vidéo source et les images ne sont pas stockées dans le dépôt.

## Cas verrouillés
| Timestamp | Cas | Exigence conservatrice |
| --- | --- | --- |
| 00:02:00 | joueurs dispersés, plusieurs petits sujets | >= 8 personnes de match sur le terrain |
| 00:10:00 | faible densité + gardien éloigné | >= 8 |
| 00:20:00 | nombreux joueurs lointains + fond complexe | >= 12 |
| 00:30:00 | grand panoramique, joueurs répartis | >= 12 |
| 00:40:00 | densité forte près de la surface | >= 13 |
| 00:50:00 | terrain vide | 0 personne de match sur le terrain |
| 01:00:00 | reprise / très faible densité | >= 4 |
| 01:10:00 | joueurs lointains + groupe près de la surface | >= 12 |
| 01:20:00 | alignement central / chevauchements | >= 10 |
| 01:30:00 | banc et staff visibles hors terrain | >= 9 sur le terrain ; le staff hors terrain doit rester exclu |
| 01:43:20 | joueurs plus proches + groupes mixtes | >= 13 |

Ces seuils sont volontairement inférieurs au nombre visuellement apparent sur plusieurs images. Ils servent de garde-fou minimal et non de métrique finale de précision.

## Baseline locale rejetée
OpenCV HOG PeopleDetector a été exécuté sur ces images uniquement comme contrôle négatif. Il produit des cadres plausibles sur certains joueurs mais aussi de nombreux faux positifs dans les arbres, bâtiments et arrière-plans, et rate des groupes de joueurs éloignés. Il ne doit donc pas être utilisé comme détecteur CAY de production.

## Règle de promotion d'un modèle
Un nouveau détecteur ne peut devenir le défaut STABLE que si :
1. sa licence et celle des poids sont compatibles avec la politique CAY ;
2. il passe tous les cas critiques du contrat réel, notamment le terrain vide et l'exclusion du banc/staff ;
3. il atteint une couverture minimale agrégée de 82 % des seuils conservateurs sur les images actives ;
4. il ne contourne pas `pitch_membership_guard_v1.js` ni l'invariant de 11 joueurs de l'équipe analysée ;
5. il est ensuite validé sur la continuité d'identité, pas seulement sur le nombre de boîtes.

## Candidats permissifs identifiés
- `rudrasinghm/dfine-football-detector` — Apache-2.0 déclaré, D-FINE Small, 10,3 M paramètres, spécialisé football. Statut : candidat benchmark ; non intégré par défaut.
- `julianzu9612/RFDETR-Soccernet` — Apache-2.0 déclaré, RF-DETR Large fine-tuné SoccerNet, 4 classes football. Statut : candidat benchmark ; non intégré par défaut.
- RF-DETR core — Apache-2.0 pour le code et les poids core désignés Apache. Statut : architecture permissive de secours si le fine-tune SoccerNet n'est pas exploitable dans le navigateur.

Aucun de ces modèles n'est promu tant qu'il n'a pas produit un résultat mesuré sur les timestamps ci-dessus.
