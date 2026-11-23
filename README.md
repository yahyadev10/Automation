# LeadFlow AI

Application SaaS de démonstration pour la qualification de prospects et la
gestion de brouillons commerciaux avec approbation humaine. La stack est
Next.js 15, Spring Boot 3.5, PostgreSQL 16, n8n 1.82 et un adaptateur LLM
OpenAI-compatible pointant vers Groq.

## Fonctionnalités réellement implémentées

- Authentification demo par cookie HttpOnly et JWT signé.
- Création, recherche, filtrage, modification et archivage de prospects.
- Qualification IA déclenchée depuis le frontend vers Spring Boot, puis WF-01.
- Analyse stockée avec score, catégorie, confiance, forces, faiblesses,
  informations manquantes et recommandations.
- Génération de brouillon via WF-02, sans envoi automatique.
- Revue humaine : modification, `APPROVED`, `REJECTED`, puis envoi explicite.
- Envoi simulé via WF-03 avec `EMAIL_PROVIDER=console`.
- Historique d'activité et dashboard calculés depuis PostgreSQL.
- Callbacks n8n protégés par secret partagé et corrélés par `correlationId`.
- Gestion d'erreurs n8n centralisée via WF-04 avec rédaction des secrets.
- Dispatch n8n après commit pour éviter les callbacks précoces.
- Intégration Groq réelle via l'endpoint OpenAI-compatible, sans mock.

## Démarrage

```powershell
copy .env.example .env
# Éditer .env puis renseigner les secrets locaux
docker compose up -d --build
```

Vérification :

```powershell
docker compose ps
curl.exe http://localhost:18080/actuator/health
curl.exe http://localhost:5678/healthz
curl.exe http://localhost:3000/login
```

URLs locales :

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| API | `http://localhost:18080/api/v1` |
| Swagger | `http://localhost:18080/swagger-ui.html` |
| Health API | `http://localhost:18080/actuator/health` |
| n8n | `http://localhost:5678` |
| PostgreSQL diagnostic | `localhost:55432` |

Compte demo : `demo@leadflow.ai` / `DemoPass123!`.

Si les ports par défaut sont occupés, ajuster `POSTGRES_HOST_PORT`,
`BACKEND_HOST_PORT`, `N8N_HOST_PORT` et `FRONTEND_URL` dans `.env`.

## Variables à renseigner

Obligatoires avant usage réel :

- `POSTGRES_PASSWORD`
- `APP_JWT_SECRET` (au moins 32 caractères)
- `N8N_WEBHOOK_SECRET` (au moins 32 caractères)
- `N8N_ENCRYPTION_KEY` (au moins 32 caractères)
- `GROQ_API_KEY`
- `GROQ_MODEL` (`openai/gpt-oss-120b` par défaut)

Optionnelles :

- `LLM_BASE_URL` : `https://api.groq.com/openai/v1` par défaut.
- `EMAIL_PROVIDER` : `console` par défaut ; aucun email réel n'est livré.
- `DEMO_MODE`, `SPRING_PROFILES_ACTIVE`, `QUALIFICATION_PROMPT_VERSION`.

Ne jamais placer de clé réelle dans le code source, les logs ou un fichier
versionné. `.env` est ignoré par Git.

## Import des workflows n8n

Les workflows sont déjà importés dans le volume Docker. Pour les réimporter :

```bash
bash scripts/import-n8n-workflows.sh
docker compose restart n8n
```

Le script importe `infra/n8n/workflows/all-workflows.json` et active WF-01,
WF-02 et WF-03. WF-04 est référencé comme `errorWorkflow` et ne doit pas être
activé manuellement.

Au premier accès à `http://localhost:5678`, créer le compte propriétaire n8n.

## Tests et builds

Frontend :

```powershell
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

Backend (JDK 21 via Docker) :

```powershell
docker run --rm --add-host=host.docker.internal:host-gateway -e TESTCONTAINERS_RYUK_DISABLED=true -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal -v "$PWD\backend:/app" -v leadflow-m2:/root/.m2/repository -v //var/run/docker.sock:/var/run/docker.sock -w /app maven:3.9.9-eclipse-temurin-21 mvn -B --no-transfer-progress test
```

Résultats constatés :

- Backend : **15 tests, 0 échec**, `BUILD SUCCESS`.
- Frontend : lint, typecheck, 4 tests Vitest et build Next.js réussis.
- Compose : `docker compose config --quiet` = 0.
- E2E avec Groq réel : `E2E_SUCCESS` puis `DEMO_SUCCESS`.

## Démonstration de 2 minutes

```powershell
powershell -ExecutionPolicy Bypass -File scripts/demo-2min.ps1
```

Le script vérifie les services, exécute le parcours complet avec Groq réel et
affiche `DEMO_SUCCESS`. Voir `docs/DEMO_2MIN.md` pour la version manuelle dans
l'interface.

## Limites restantes et actions manuelles

- La clé `GROQ_API_KEY` est configurée localement dans `.env` ; toute nouvelle
  installation doit renseigner la sienne.
- Le compte propriétaire n8n doit être créé manuellement au premier accès.
- Le mode `EMAIL_PROVIDER=console` ne livre aucun email réel ; un provider SMTP
  ou transactionnel devra être implémenté pour la production.
- SpringDoc est actif en development ; le désactiver en production via
  `springdoc.api-docs.enabled=false` et `springdoc.swagger-ui.enabled=false`.
