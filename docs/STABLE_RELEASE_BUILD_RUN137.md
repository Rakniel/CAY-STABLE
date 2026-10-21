# RUN137 — C.A. Yenne STABLE : paquet testable reproductible

Base inspectée : Rakniel/CAY-STABLE, branche cay/run130-single-guarded-publication-20261021, commit 6b9011d8b557c7aa38014389e0c0f5959496d716, le 21 octobre 2026.

La CI exécute l'intégrateur canonique, les contrôles de syntaxe et les tests de non-régression avant la fabrication de l'archive. Commande : python3 tools/build_stable_release.py --root . --output dist/CAY_STABLE_TESTABLE.zip.

Le paquet conserve sans modification le HTML canonique et son logo officiel, sous index.html et CAY_ANALYZER_STABLE.html. Il inclut tous les modules JS racine, y compris les imports dynamiques, l'interface tactique, un manifeste SHA-256 et un guide de test. Échec fermé si fichier requis absent, chemin dangereux, garde de publication absent ou JS invalide. Aucune donnée joueur, vidéo, poids de modèle, mot de passe ou faux backend.

Provenance open source :
- Python zipfile, hashlib, html.parser : bibliothèque standard Python 3.10+, Python Software Foundation License. Usage non modifié ; création du ZIP et du manifeste. Statut : intégré.
- actions/upload-artifact : https://github.com/actions/upload-artifact ; version v4, commit ea165f8d65b6e75b540449e92b4886f43607fa02, licence MIT, copyright GitHub Inc. et contributeurs (LICENSE upstream). Utilisé sans modification pour publier l'archive de CI. Statut : intégré au workflow, exécution distante à vérifier.

Remplace l'archivage manuel dispersé et les copies incohérentes du HTML. Gain attendu : 1 à 3 heures de préparation manuelle par livraison, estimation non chronométrée. Impact mesurable : archive déterministe par SHA-256 et vérification automatique des scripts. Dépendances : Python 3.10+, Node 20+, GitHub Actions. Risque : le packaging ne valide ni la détection sur vidéo réelle, ni le tracking, ni l'objectif des 20 minutes.

Validation locale : cinq scénarios unitaires réussis à trois reprises, dont idempotence, logo inchangé, garde manquant, chemin dangereux et syntaxe invalide. La CI complète et les tests sur rencontre réelle restent requis avant promotion STABLE.
