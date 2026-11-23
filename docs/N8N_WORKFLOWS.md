# Workflows n8n

Quatre workflows versionnés en JSON dans `infra/n8n/workflows/`.

| Fichier | Déclencheur | Rôle |
| --- | --- | --- |
| `WF-01-prospect-qualification.json` | `POST /webhook/leadflow/qualify` | Qualification IA via Groq, puis callback `qualification`. |
| `WF-02-email-draft-generation.json` | `POST /webhook/leadflow/email-draft` | Génération d'un brouillon non envoyé, puis callback `email` avec `kind: DRAFT`. |
| `WF-03-approved-email-sending.json` | `POST /webhook/leadflow/email-send` | Envoi simulé (`EMAIL_PROVIDER=console`), puis callback `email` avec `kind: EMAIL`. |
| `WF-04-error-handling.json` | `Error Trigger` | Nettoyage des secrets et callback `error`. |

`all-workflows.json` est un tableau généré automatiquement pour l'import CLI.

## Contrat d'entrée

Tous les webhooks exigent l'en-tête `X-LeadFlow-Secret` avec la valeur de `N8N_WEBHOOK_SECRET`. Une requête invalide reçoit `401` avec `{"accepted":false,"error":"Unauthorized webhook call"}` et n'est pas traitée.

Payloads envoyés par le backend :

- Qualification : `correlationId`, `prospectId`, `companyName`, `contactName`, `email`, `website`, `industry`, `companyDescription`, `source`, `promptVersion`.
- Brouillon : `correlationId`, `prospectId`, `companyName`, `contactName`, `email`, `industry`, `companyDescription`, `score`, `category`, `analysisSummary`, `recommendations`, `missingInformation`.
- Envoi : `correlationId`, `draftId`, `prospectId`, `recipient`, `subject`, `body`, `provider`.

## Variables d'environnement utilisées par n8n

- `LLM_BASE_URL` : `https://api.groq.com/openai/v1` par défaut.
- `GROQ_MODEL` : `openai/gpt-oss-120b`.
- `GROQ_API_KEY` : uniquement dans l'environnement du conteneur, jamais dans les JSON.
- `N8N_WEBHOOK_SECRET` : secret partagé avec le backend.
- `BACKEND_CALLBACK_URL` : `http://backend:8080/api/v1/automation/callbacks`.
- `EMAIL_PROVIDER` : `console` pour la simulation.

Les prompts imposent un JSON strict et interdisent toute invention : `score`, `category`, `summary`, listes de preuves/manques/recommandations et `confidence`. Les sorts sont normalisés côté n8n (score 0-100, catégorie HIGH/MEDIUM/LOW, listes tronquées).

## Génération, import et export

```bash
node scripts/generate-n8n-workflows.mjs
bash scripts/import-n8n-workflows.sh
docker compose restart n8n
bash scripts/export-n8n-workflows.sh
```

L'import CLI n'accepte pas un objet unique : il faut le tableau `all-workflows.json`. Les trois workflows webhook sont activés par le script ; `WF-04` est référencé via `settings.errorWorkflow` et n'a pas besoin d'être actif.

## Vérification effectuée

- Import CLI : `Successfully imported 4 workflows.`
- Appel sans secret : `401 Unauthorized` avec corps JSON explicite.
- `WF-01`/`WF-02` : échec contrôlé `GROQ_API_KEY is not configured` en local, remonté à `WF-04` puis au backend.
- `WF-03` : cycle complet vérifié — brouillon `PENDING_REVIEW`, approbation explicite, webhook, callback `EMAIL SUCCESS`, brouillon final `SENT`, activité `EMAIL_SENT_SIMULATED`.
- Correctif appliqué : le backend envoie désormais les requêtes n8n après commit (`AutomationDispatcher`) pour éviter qu'un callback rapide arrive avant la création de l'`AutomationRun`.

## Sécurité et limites

- Aucun credential n'est stocké dans les fichiers versionnés.
- Les erreurs sont nettoyées avant callback : clés API, tokens, secrets et motifs `password|secret|token` remplacés par `[REDACTED]`.
- La génération et l'envoi restent asynchrones : l'UI doit interroger le statut via `/api/v1/email-drafts` et `/api/v1/dashboard/summary`.
- L'envoi réel SMTP n'est pas implémenté ; le mode `console` simule uniquement et marque l'activité comme `EMAIL_SENT_SIMULATED`.
