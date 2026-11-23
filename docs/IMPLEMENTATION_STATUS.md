# IMPLEMENTATION STATUS — LeadFlow AI

Ce document suit l'avancement réel du projet, étape par étape. Une étape n'est
marquée `TERMINÉE` que lorsque les vérifications prévues ont été exécutées.

Date de départ : 2026-11-21

## Checklist des étapes

| Étape | Statut | Vérification réelle |
| --- | --- | --- |
| 1. Inspection et plan | TERMINÉE | Workspace inspecté, versions vérifiées (voir ci-dessous), ce document créé |
| 2. Structure et infrastructure | TERMINÉE | `docker compose config --quiet` = 0 ; `postgres` et `n8n` démarrés et `healthy` |
| 3. Backend Spring Boot | TERMINÉE | 15 tests JUnit réussis ; image Docker construite ; backend `healthy` ; login + dashboard réels vérifiés |
| 4. Workflows n8n | TERMINÉE | 4 JSON générés/importés ; 401 vérifié ; cycle WF-03 vérifié jusqu'à `SENT` ; 15 tests réussis après correctif post-commit |
| 5. Frontend Next.js | TERMINÉE | Lint, typecheck, 4 tests Vitest et build Next.js réussis ; conteneur frontend démarré et pages `200` |
| 6. Intégration de bout en bout | TERMINÉE | Scénario complet validé avec Groq réel : login → prospect → analyse → brouillon → approbation → envoi simulé → historique |
| 7. Qualité et livraison | TERMINÉE | 15 tests backend, 4 tests frontend, builds, compose, scan de secrets, README et démo 2 min vérifiés |

## Étape 1 — Décisions d'architecture et constats

### Workspace

- `C:\Users\YAHYA\Desktop\n8njourney` contenait uniquement
  `PROMPT_CURSOR_LEADFLOW_AI.md` (775 lignes). Aucun fichier existant n'a été
  écrasé.
- Le projet est créé dans `leadflow-ai/` pour correspondre à l'arborescence
  attendue du cahier des charges.

### Environnement local constaté

| Outil | Version | Remarque |
| --- | --- | --- |
| Java (PATH) | 1.8.0_432 | Insuffisant pour Spring Boot 3 |
| Java installé | 17 (`C:\Program Files\Java\jdk-17`) | Insuffisant (cible Java 21) |
| Docker | 28.5.2, daemon actif | Image `maven:3.9.9-eclipse-temurin-21` déjà disponible |
| Maven | 3.8.1 | Utilisé via l'image Docker JDK 21 pour les builds |
| Node.js | 22.11.0 / npm 10.9.0 | Compatible Next.js |
| PostgreSQL | image `postgres:16-alpine` disponible | Pas de client `psql` local |
| n8n | image `n8nio/n8n:1.82.3` tirée avec succès | — |
| Accès réseau | Maven Central 200, npm 200, Groq API 401 (clé absente) | OK pour installation, clé requise pour appel réel |

**Conséquence :** les builds/tests backend seront exécutés dans
`maven:3.9.9-eclipse-temurin-21` via Docker afin de garantir Java 21 sans
modifier la machine. Le frontend sera installé avec npm local (Node 22).

### Versions retenues (vérifiées en ligne le 2026-11-21)

| Composant | Version | Raison |
| --- | --- | --- |
| Java / Spring Boot | 21 / **3.5.16** | Dernière version stable de la lignée 3 imposée |
| Maven | 3.9.9 (conteneur) | Cohérent avec Spring Boot 3.5 |
| Flyway | **11.7.2** | Version gérée par Spring Boot 3.5.16 |
| PostgreSQL driver | **42.7.11** | Version gérée par Spring Boot 3.5.16 |
| PostgreSQL | **16-alpine** | Image disponible, stable |
| springdoc-openapi | **2.8.17** | Lignée compatible Spring Boot 3.x |
| JJWT | **0.12.7** | API stable, Java 21 compatible |
| Next.js | **15.5.29** | Stable, compatible React 19 et Node 22 |
| React | **19.3.1** | Version actuelle supportée par Next 15.5 |
| Tailwind CSS | **4.1.18** | Dernière version compatible avec Node 22.11 ; 4.3.5 provoquait `ERR_REQUIRE_ESM` sur `magic-string` |
| Radix UI / Lucide | versions npm courantes | Composants shadcn/ui (patterns copiés, pas de CLI interactif) |
| n8n | **1.82.3** | Image stable vérifiée/tirée |
| Groq endpoint | `https://api.groq.com/openai/v1` | Imposé |
| Groq modèle | **`openai/gpt-oss-120b`** | Modèle production recommandé par Groq en 2026 ; `llama-3.3-70b-versatile` est déprécié depuis le 16/08/2026. Modèle lu depuis `GROQ_MODEL`, jamais codé en dur ailleurs |

### Décisions structurantes

1. **Séparation des responsabilités.** Next.js ne parle qu'à Spring Boot.
   Spring Boot est le seul à écrire en PostgreSQL et le seul à recevoir les
   callbacks n8n. n8n appelle Groq avec la clé côté serveur uniquement.
2. **Intégration LLM centralisée.** Deux adaptations possibles documentées :
   Groq appelé depuis les workflows n8n (choix retenu) avec un adaptateur
   `LlmGateway` côté backend pour remplacer le fournisseur plus tard sans
   toucher à la logique métier. Le modèle est uniquement dans `GROQ_MODEL`.
3. **Sécurité des callbacks.** Secret partagé `N8N_WEBHOOK_SECRET`, comparaison
   par `MessageDigest.isEqual`, identifiant de corrélation `correlationId`
   propagé,
   callbacks rejetés si secret absent/invalide. Endpoints idempotents par
   `correlationId` stocké.
4. **Approbation obligatoire.** Aucun envoi d'email sans passage explicite de
   `PENDING_REVIEW` → `APPROVED` puis vérification côté backend. Mode
   `EMAIL_PROVIDER=console` par défaut : aucun email réel n'est livré.
5. **Dashboard réel.** Toutes les statistiques sont calculées par requêtes
   JPA/SQL sur PostgreSQL ; aucun chiffre codé en dur.
6. **Mode démo.** Jeu de données fictif chargé uniquement quand
   `DEMO_MODE=true` et `SPRING_PROFILES_ACTIVE=dev`, marqué `source=DEMO` et
   signalé dans l'interface.
7. **Pas de secrets.** `.env` ignoré par Git, `.env.example` avec valeurs
   fictives, aucune clé dans le code, les logs ou les réponses HTTP.
8. **Intégration Groq réelle.** La clé `GROQ_API_KEY` est configurée dans
   `.env` (non versionné) et l'appel réel à
   `https://api.groq.com/openai/v1/chat/completions` a été validé avec le
   modèle `openai/gpt-oss-120b`. Aucun mock LLM n'est conservé dans le projet.

### Limites initiales (étape 1, désormais résolues)

- Aucune intégration externe n'était encore configurée ou testée.
- Aucun service n'était encore démarré.
- Le build Java 21 n'avait pas encore été lancé.

## Étape 2 — Résultats

Fichiers créés : `.gitignore`, `.env.example`, `.env` (local, non versionné),
`docker-compose.yml`, `Makefile`, `backend/Dockerfile`, `frontend/Dockerfile`,
`infra/postgres/README.md`, `infra/n8n/README.md`, `docs/ARCHITECTURE.md`.

Vérifications exécutées :

- `docker compose config --quiet` → code 0.
- `docker compose up -d postgres n8n` → conteneurs créés.
- `docker compose ps` → `leadflow-postgres` **healthy**, `leadflow-n8n`
  **healthy** (healthcheck `/healthz`).

Ajustement environnement : le port hôte 5432 était déjà occupé ; le port local
de diagnostic est donc `55432` dans `.env` (`POSTGRES_HOST_PORT`). Le port
interne reste 5432 et l'URL JDBC n8n/backend reste inchangée.

URLs locales disponibles à ce stade : n8n http://localhost:5678 ,
PostgreSQL diagnostic localhost:55432. Backend/frontend viendront aux
étapes 3 et 5.

## Étape 3 — Résultats

Implémenté : 69 classes Java (entités, DTO, repositories, services, contrôleurs,
sécurité JWT/cookie HttpOnly, callbacks signés, adaptateur `N8nAutomationClient`,
Swagger, Flyway V1, initialiseurs de démonstration), plus 5 classes de test.

Vérifications exécutées :

- `mvn -B -DskipTests compile` dans `maven:3.9.9-eclipse-temurin-21` → BUILD SUCCESS.
- `mvn -B test` → **15 tests, 0 échec** :
  - `ScoringRulesTest` (3) : frontières 70/40, clamping, confiance.
  - `ProspectValidationTest` (3) : Bean Validation.
  - `EmailDraftServiceTest` (4) : envoi impossible si non approuvé,
    transitions, envoi simulé.
  - `AutomationCallbackControllerTest` (3) : secret absent/invalide/valide.
  - `BackendIntegrationTest` (2) : PostgreSQL Testcontainers, login,
    création/lecture prospect, dashboard, 401 anonyme.
- `docker compose up -d --build backend` → image construite, conteneur `healthy`,
  Flyway V1 appliquée à PostgreSQL.
- Appel réel : `GET /actuator/health` = `{"status":"UP"}` ; login démo = 200
  avec cookie HttpOnly ; `GET /dashboard/summary` = chiffres réels (DB vide
  au moment du test). Documentation Swagger disponible.

Le port hôte 8080 étant occupé, l'API locale est `http://localhost:18080`
(`BACKEND_HOST_PORT`). L'URL `NEXT_PUBLIC_API_BASE_URL` a été alignée.

Limite à l'issue de l'étape 3 : les appels n8n/Groq n'étaient pas encore exercés.

## Étape 4 — Résultats

Fichiers créés : `scripts/generate-n8n-workflows.mjs`,
`scripts/import-n8n-workflows.sh`, `scripts/export-n8n-workflows.sh`,
`infra/n8n/workflows/WF-01-prospect-qualification.json`,
`WF-02-email-draft-generation.json`, `WF-03-approved-email-sending.json`,
`WF-04-error-handling.json`, `all-workflows.json`, `docs/N8N_WORKFLOWS.md`
et `docs/DATABASE.md`.

Vérifications exécutées :

- Les 5 fichiers JSON passent `ConvertFrom-Json` (validation syntaxique).
- Import CLI réel : `Successfully imported 4 workflows.` ; `n8n list:workflow`
  affiche les 4 identifiants attendus.
- Redémarrage n8n puis appel sans secret : `401 Unauthorized` avec
  `{"accepted":false,"error":"Unauthorized webhook call"}`.
- `WF-01` et `WF-02` échouent proprement en local avec
  `GROQ_API_KEY is not configured` ; l'erreur remonte via `WF-04` au backend.
- Cycle complet vérifié via l'API : prospect créé → qualification → callback →
  génération de brouillon → callback → approbation → `POST /send` → webhook
  `WF-03` → callback → brouillon `SENT` + activité `EMAIL_SENT_SIMULATED`.
- Dashboard final réel : 2 prospects, 2 analyses, 1 email envoyé (simulé),
  0 échec.

Bug corrigé pendant cette étape : le callback de `WF-03` arrivait parfois avant
le commit de la transaction backend (`Unknown correlationId`). Ajout de
`AutomationDispatcher` pour différer les appels n8n après commit dans
`QualificationService`, `EmailDraftService.generate` et `EmailDraftService.send`.
Nouvelle exécution des tests : **15 tests, 0 échec**, BUILD SUCCESS.

Limite restante : `GROQ_API_KEY` absent, donc les appels Groq réels ne sont pas
vérifiés ; les workflows sont testés sur leurs chemins de contrôle, de callback
et d'erreur.

## Étape 5 — Résultats

Implémenté sous `frontend/` : App Router Next.js 15, layout protégé, écran de
connexion, dashboard, liste et fiche prospects, liste et fiche brouillons,
historique d'activité, client API typé, gestion des états de chargement et
d'erreur, badges de statut, tests Vitest et configuration Docker standalone.

Corrections apportées pendant cette étape :

- `next-env.d.ts` régénéré par `next build` provoquait une erreur ESLint
  `@typescript-eslint/triple-slash-reference` ; le fichier est désormais ignoré
  dans `eslint.config.mjs`.
- `frontend/public/` était absent et cassait
  `COPY --from=builder /app/public ./public` ; un `.gitkeep` a été ajouté.
- Tailwind CSS est resté en `4.1.18` pour compatibilité Node 22.11.

Vérifications exécutées :

- `npm run lint`, `npm run typecheck`, `npm test` (**4 tests, 0 échec**) et
  `npm run build` réussis depuis `frontend/`.
- Build Next.js : 9 routes générées, output `standalone`.
- Serveur Next local testé sur le port 3100 : `/login` et `/dashboard` = `200`.
- Bundle vérifié : l'URL `http://localhost:18080/api/v1` est bien embarquée.
- `docker compose up -d --build frontend` réussi après ajout de `public/`.
- Conteneur `leadflow-frontend` démarré ; `/login` et `/dashboard` = `200`.

## Étape 6 — Résultats

Le scénario complet est désormais exécuté avec Groq réel, sans mock. La clé est
uniquement stockée dans `.env`, non versionnée, et transmise au conteneur n8n
via `docker-compose.yml`.

Vérifications exécutées :

- Appel direct à l'API Groq : `status 200`, contenu `GROQ_OK`, modèle
  `openai/gpt-oss-120b`.
- n8n recréé avec `LLM_BASE_URL=https://api.groq.com/openai/v1` et une clé
  configurée (longueur vérifiée sans affichage de la valeur).
- `node scripts/e2e-demo.mjs` → `E2E_SUCCESS` :
  - login démo réussi ;
  - prospect `E2E Groq SARL ...` créé ;
  - WF-01 → analyse `score=25`, `category=LOW`, `confidence=LOW`, résumé Groq
    mentionnant l'absence de budget, de besoins précis, de processus de décision
    et de calendrier ;
  - WF-02 → brouillon `PENDING_REVIEW`, objet
    `Inquiry Regarding Your Laboratory Software Outreach Needs` ;
  - approbation explicite → `APPROVED` ;
  - envoi explicite → webhook WF-03 → brouillon `SENT`, `simulated=true` ;
  - activité :
    `EMAIL_SENT_SIMULATED,EMAIL_SEND_REQUESTED,EMAIL_DRAFT_APPROVED,EMAIL_DRAFT_CREATED,EMAIL_DRAFT_REQUESTED,QUALIFICATION_COMPLETED,QUALIFICATION_REQUESTED,PROSPECT_CREATED`.
- Le script E2E échoue explicitement si une réponse contient `TEST MOCK`.
- `scripts/demo-2min.ps1` vérifié avec Groq réel : `script-exit=0`,
  `E2E_SUCCESS`, `DEMO_SUCCESS`.
- Aucun email réel n'a été envoyé.

## Étape 7 — Résultats

Fichiers ajoutés : `README.md`, `docs/DEMO_2MIN.md`, `scripts/e2e-demo.mjs`,
`scripts/demo-2min.ps1`, `frontend/public/.gitkeep`. Les anciens fichiers de
mock LLM ont été supprimés.

Vérifications exécutées :

- Backend : **15 tests, 0 échec**, `BUILD SUCCESS` (JDK 21 via Docker), relancé
  après suppression de l'alias de provider email `mock`.
- Frontend : lint, typecheck, **4 tests, 0 échec**, build réussi, relancés en
  validation finale.
- `docker compose config --quiet` = 0.
- `docker compose ps` : `leadflow-postgres`, `leadflow-backend` et
  `leadflow-n8n` `healthy`, `leadflow-frontend` démarré.
- Healthchecks réels : backend `{"status":"UP"}`, n8n `{"status":"ok"}`.
- Logs backend : uniquement des avertissements SpringDoc attendus en
  développement, aucune exception applicative.
- Scan de secrets : aucune chaîne `gsk_` détectée hors `.env`, qui est ignoré
  par Git via `.gitignore` ; seuls les identifiants demo et les placeholders
  attendus apparaissent dans les fichiers versionnés.
- Documentation finale et scénario de démonstration de 2 minutes validés avec
  Groq réel : `E2E_SUCCESS`, `DEMO_SUCCESS`, `script-exit=0`.

Actions manuelles restantes : créer le compte propriétaire n8n au premier accès
et implémenter un provider d'email réel si la démonstration doit sortir du mode
`console`. La clé Groq locale est configurée et validée.

## Journal

- **2026-11-21 — Étape 1** : inspection du workspace, vérification des
  versions Maven/npm/Groq, création du monorepo `leadflow-ai/`, rédaction des
  décisions ci-dessus.
- **2026-11-21 — Étape 2** : infrastructure Docker créée et vérifiée en
  exécution (PostgreSQL et n8n healthy).
- **2026-11-21 — Étape 3** : backend complet compilé sous JDK 21, 15 tests
  réussis, conteneur backend démarré et endpoints vérifiés.
- **2026-11-21 — Étape 4** : 4 workflows n8n générés, importés et activés ;
  sécurité des webhooks vérifiée ; cycle d'envoi simulé vérifié de bout en bout ;
  correctif de dispatch post-commit validé par 15 tests réussis.
- **2026-11-21 — Étape 5** : frontend Next.js complet, lint/typecheck/4 tests/build
  réussis, conteneur frontend démarré et pages vérifiées en HTTP.
- **2026-11-21 — Étape 6** : configuration Groq réelle validée, mock supprimé,
  scénario complet rejoué jusqu'à `SENT` avec analyse et brouillon générés par
  le modèle.
- **2026-11-21 — Étape 7** : tests, builds, Compose, logs, secrets, README,
  documentation et script de démonstration de 2 minutes finalisés avec Groq
  réel.
- **2026-11-23 — Validation finale** : mock LLM et alias `mock` supprimés,
  workflows régénérés/importés, backend reconstruit, 15 tests backend et 4 tests
  frontend refaits, démo réelle rejouée jusqu'à `SENT`, secret Groq vérifié
  uniquement dans `.env`.
