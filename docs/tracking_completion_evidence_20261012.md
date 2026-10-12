# CAY-STABLE — fin de tracking avec preuves (12 octobre 2026)

Les modules internes `first_results_runtime_guard_bridge_v1.js` et `stable_runtime_tracking_v2.js` sont étendus, sans second moteur ni dépendance.

- **ANALYSE_TERMINEE** : runtime validé, couverture FIABLE, limite de 11 joueurs, identité persistante observée au moins cinq fois, comptes et chronologie cohérents.
- **PARTIEL** : mêmes preuves avec couverture partielle ; export explicitement marqué, métriques physiques non promues.
- **INDISPONIBLE** : preuve manquante/contradictoire, export bloqué, ancien rapport invalidé, statut français.
- Doublons d'identité, catégories non CAY, coordonnées invalides et images indisponibles contenant des détections sont rejetés.
- Ne prouve pas homographie, distance, vitesse, sprint ou possession.

**Réutilisation et licence :** code CAY existant étendu. Aucun code externe importé. **Roboflow Trackers 2.6.1**, Apache-2.0, https://github.com/roboflow/trackers — étudié, non intégré (ByteTrack/BoT-SORT), audit déjà présent dans `docs/open_source_roboflow_trackers_2_6_1_delta_audit_20260926.md`. **OpenCV >=4.5**, Apache-2.0, https://opencv.org/license/ — étudié, non intégré (homographie/GMC). Risques : dépendances Python, modèles/données sous licences distinctes, interopérabilité navigateur.

**Validation locale :** 45 assertions du contrat exécutées sur cinq répétitions et syntaxe des deux modules ; nouveau test dédié de 77 assertions préparé. CI, navigateur, vidéos réelles et SLA <20 min non encore validés. Gain horaire non chronométré.
