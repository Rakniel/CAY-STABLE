# SportVision — garde de confiance pour métriques terrain CAY-STABLE

Date d'audit : 2026-09-03

## Source et licence

- Projet : `MohibShaikh/sportvision`
- Version auditée : `0.3.1`
- Révision auditée : `ba96e1a3b82a95777bb7068594a69f0b866c47c1`
- Licence : Apache License 2.0, vérifiée dans le fichier `LICENSE` de la révision auditée.
- Code copié : aucun.
- Dépendance runtime ajoutée : aucune.

## Idée réutilisée / adaptée

SportVision organise les métriques physiques (distance/vitesse) en aval d'une transformation vers le repère terrain. CAY-STABLE conserve cette séparation mais applique une règle plus stricte adaptée à notre exigence de statistiques défendables : une projection structurellement marquée `validated=true` ne suffit pas à publier distance, vitesse ou sprints si la confiance de calibration est absente ou trop faible.

L'adaptation CAY introduit une éligibilité métrique distincte de la validation structurelle du projecteur :

- confiance explicite obligatoire ;
- seuil minimal CAY : `0.50`, aligné sur la garde déjà utilisée par les trajectoires/heatmaps terrain ;
- en dessous du seuil ou si la confiance est inconnue : projection non consommée par distance/vitesse/sprints ;
- les métriques deviennent `INDISPONIBLE` plutôt que d'extrapoler une fausse précision ;
- la couverture métrique équipe utilise exactement la même garde.

## Ce que cela remplace

Avant : `validated=true` suffisait dans `player_stats_v1.js`, même avec `confidence=null` ou une confiance très faible.

Après : `validated=true` + confiance explicite `>= 0.50` sont nécessaires pour alimenter les métriques physiques. La validation structurelle reste exposée séparément afin de ne pas casser le contrat des projecteurs existants.

## Impact attendu et mesurable

Cas déterministes couverts par test :

- confiance manquante -> `metricCoverage=0`, distance/vitesse/sprints indisponibles ;
- confiance `0.49` -> indisponible ;
- confiance `0.50` -> éligible ;
- confiance `0.90` -> éligible ;
- la couverture métrique instantanée équipe ne compte plus les projecteurs sans preuve de confiance.

Gain de travail estimé : environ 0,5 journée de conception/audit en réutilisant la séparation mature repère-image / repère-terrain et en l'alignant sur les gardes CAY déjà présentes dans les heatmaps/trajectoires.

## Risques et dépendances

- Un ancien adaptateur personnalisé qui déclare seulement `validated=true` devra désormais fournir une confiance explicite pour publier les métriques physiques. C'est volontairement fail-closed.
- Le seuil `0.50` doit rester mesuré sur vidéo réelle C.A. Yenne avant tout assouplissement.
- Aucun code, poids ou dépendance SportVision n'est embarqué ; seule l'idée architecturale est adaptée.

Statut : **intégré sous forme d'adaptation CAY, sous réserve de validation CI de la branche**.
