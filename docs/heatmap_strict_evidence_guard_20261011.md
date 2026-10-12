# CAY-STABLE — preuves numériques strictes pour heatmaps (2026-10-11)

## Provenance
- Origine : code interne CAY-STABLE, `metric_pitch_heatmap_v1.js`.
- Licence externe : aucune ; aucune dépendance ni code tiers introduits.
- Version source : branche `integration/validated-evidence-guards-20261010`, fichier blob `d4d79bd1985283d9cbd0e030baa5793b56265e30`.
- Modifications : `isPresentFinite` n'accepte plus les booléens, tableaux ou objets convertibles implicitement en nombres ; `projectorInfo` réutilise ce même validateur pour la confiance de calibration.

## Problème corrigé
Avant : `false` / `true` pouvaient servir de timestamp, de coordonnées ou de confiance, et produire `DISPONIBLE` sans preuve métrique valide.
Après : ces entrées ne produisent plus de heatmap terrain publiable ; les nombres et chaînes numériques explicites restent pris en charge.

## Validation locale (V8)
- 4 scénarios de publication erronée avant, 0 après.
- 6 suites de non-régression existantes exécutées 5 fois : 30 exécutions réussies.
- Nouveau test `tests/metric_pitch_heatmap_strict_evidence_nonregression.js` : 7 scénarios, dont conservation des nombres valides.
- Syntaxe JS compilée. CI GitHub et tests navigateur/vidéos réelles à vérifier séparément.

## Limites
Aucun changement au logo, aux métriques de distance/vitesse, ni à l'interface. Les états `INDISPONIBLE` restent obligatoires sans preuve temporelle ou calibration suffisante. Ne pas interpréter ce correctif comme une validation sur vidéo réelle.
