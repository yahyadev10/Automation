# Base de données

PostgreSQL 16, schéma public, migrations Flyway dans `backend/src/main/resources/db/migration/`.

## Tables

- `users` : comptes d'accès; le compte démo est créé au démarrage si `DEMO_MODE=true` ou si la table est vide.
- `prospects` : entreprises analysées, propriétaire, source, statut (`NEW`, `ANALYZING`, `QUALIFIED`, `NOT_QUALIFIED`, `ERROR`).
- `qualification_analyses` : score 0-100, catégorie (`HIGH`, `MEDIUM`, `LOW`), résumé, forces, faiblesses, informations manquantes, recommandations, confiance, modèle et version du prompt.
- `email_drafts` : brouillons liés à un prospect; statuts `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SENT`, `FAILED`.
- `activity_events` : journal d'activité lisible par le dashboard.
- `automation_runs` : suivi des appels n8n par `correlationId`, type (`QUALIFICATION`, `EMAIL_DRAFT`, `EMAIL_SEND`), statut `PENDING`, `COMPLETED`, `FAILED`.

## Règles métier

- Un brouillon ne peut être envoyé qu'après approbation explicite (`APPROVED`).
- Un brouillon en attente peut être modifié, approuvé ou rejeté.
- Les callbacks n8n sont idempotents : un run déjà `COMPLETED`/`FAILED` est ignoré.
- Les requêtes n8n sont déclenchées après commit pour garantir que le `AutomationRun` existe avant le callback.
- Aucune donnée secrète n'est stockée dans les tables métier.

## Commandes utiles

```bash
docker compose exec postgres psql -U leadflow -d leadflow -c '\dt'
docker compose exec postgres psql -U leadflow -d leadflow -c 'SELECT status, count(*) FROM email_drafts GROUP BY status;'
```

Ces commandes nécessitent le mot de passe PostgreSQL défini dans `.env`. Les ports locaux sont `55432` (PostgreSQL) et `18080` (API) car `5432` et `8080` sont occupés sur l'hôte.
