# n8n

## Rôle

n8n exécute les quatre workflows importés depuis `workflows/` :

| Fichier | Rôle |
| --- | --- |
| `WF-01-prospect-qualification.json` | Qualification via LLM, callback vers Spring Boot |
| `WF-02-email-draft-generation.json` | Génération d'un brouillon, aucun envoi |
| `WF-03-approved-email-sending.json` | Envoi simulé (`EMAIL_PROVIDER=console`) après approbation |
| `WF-04-error-handling.json` | Callback d'échec, logs sans secrets |

## Import / export

Voir la procédure complète dans `docs/N8N_WORKFLOWS.md`. En résumé :

```bash
cp .env.example .env   # puis renseigner les secrets
make up
make import-workflows
make export-workflows
```

Les scripts utilisent l'API n8n avec l'email/mot de passe de l'utilisateur
propriétaire (à fournir au premier lancement via l'UI `http://localhost:5678`).
Aucun credential n'est stocké dans les fichiers JSON exportés : les appels
utilisent uniquement des variables d'environnement.

## Sécurité

- L'UI n8n est liée à `127.0.0.1` : elle n'est pas exposée publiquement.
- Le premier lancement nécessite la création d'un compte propriétaire dans
  l'UI (authentification n8n native).
- `N8N_WEBHOOK_SECRET` protège les appels dans les deux sens.
- `N8N_ENCRYPTION_KEY` chiffre les credentials stockés par n8n.
- Le secret Groq reste dans l'environnement du conteneur n8n ; il n'est jamais
  envoyé au frontend ni écrit dans les logs.

## Mode email

`EMAIL_PROVIDER=console` : le workflow WF-03 journalise un événement
`EMAIL_SENT_SIMULATED` et renvoie `delivered: false, simulated: true`. Aucun
email réel n'est livré. Un fournisseur réel doit être configuré manuellement
plus tard ; le code du workflow est isolé dans un seul nœud `Code`.
