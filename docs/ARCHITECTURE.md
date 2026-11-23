# Architecture — LeadFlow AI

## Vue d'ensemble

```
Navigateur (Next.js, port 3000)
        |  REST /api/v1 (fetch, cookies HttpOnly)
        v
Spring Boot 3.5 (port 8080)
        |                    \
        | JPA/Flyway          \ HTTP signé (secret partagé)
        v                      v
PostgreSQL 16            n8n 1.82 (port 5678, localhost)
(source de vérité)              |
                                v HTTP OpenAI-compatible
                          Groq API / LLM
                                |
                    callback signé vers Spring Boot
                                |
                                v
                           PostgreSQL
```

## Responsabilités

### Next.js (`frontend/`)
- App Router, TypeScript, Tailwind CSS, composants shadcn/ui.
- Pages : `/login`, `/dashboard`, `/prospects`, `/prospects/[id]`,
  `/email-drafts`, `/email-drafts/[id]`, `/activity`.
- Couche `lib/api-client.ts` : toutes les requêtes passent par Spring Boot.
- Aucun accès direct à PostgreSQL, n8n ou Groq ; aucune clé secrète dans le
  navigateur. Variables `NEXT_PUBLIC_*` uniquement non sensibles.

### Spring Boot (`backend/`)
- API REST `/api/v1`, DTO + Bean Validation, pagination, gestion globale des
  erreurs, OpenAPI/Swagger, Actuator.
- Entités JPA et migrations Flyway (UUID, timestamps UTC).
- Spring Security : JWT signé (JJWT), mots de passe BCrypt, CORS restreint,
  profil `dev` seul fournisseur du compte de démonstration.
- `AutomationClient` (adaptateur `N8nAutomationClient`) : appelle les webhooks
  n8n avec `X-LeadFlow-Secret` et `correlationId`, gère timeout/erreurs.
- Callbacks `/api/v1/automation/callbacks/*` : vérification du secret par
  comparaison constante, idempotence par `correlationId`, mise à jour des
  entités et création d'événements d'activité.
- Règle métier centrale : un brouillon ne peut être envoyé que s'il est
  `APPROVED` et approuvé par un utilisateur authentifié.

### n8n (`infra/n8n/workflows/`)
- WF-01 qualification, WF-02 brouillon, WF-03 envoi simulé, WF-04 erreurs.
- Les nœuds HTTP de LLM lisent `LLM_BASE_URL`, `GROQ_MODEL` et `GROQ_API_KEY`
  depuis l'environnement : c'est l'adaptateur LLM. Changer de fournisseur
  revient à changer ces variables, sans toucher à la logique métier.
- Sorties IA parsées et validées (score 0-100, catégorie normalisée, listes).
- Aucun email réel envoyé en version initiale.

### PostgreSQL
- Tables : `users`, `prospects`, `qualification_analyses`, `email_drafts`,
  `activity_events`, `automation_runs` (idempotence et traçabilité).
- Les suppressions de prospects sont logiques : les historiques d'analyses et
  d'événements sont conservés.

## Flux de qualification

1. `POST /api/v1/prospects/{id}/qualify` crée un `automation_runs` avec un
   `correlationId` UUID et met le prospect en `ANALYZING`.
2. Spring Boot appelle le webhook WF-01 avec les données fournies uniquement.
3. WF-01 construit un prompt strict, appelle le LLM en JSON structuré,
   valide et normalise la réponse.
4. WF-01 POSTe le résultat à `/api/v1/automation/callbacks/qualification`
   avec secret et `correlationId`.
5. Le callback est idempotent : si le `correlationId` existe déjà avec un
   statut terminal, la requête est ignorée.
6. Backend crée `qualification_analyses`, met le prospect en `QUALIFIED` ou
   `NOT_QUALIFIED`, ajoute un `activity_events`.
7. En cas d'erreur, WF-04 envoie un callback d'échec et le prospect passe en
   `ERROR` sans faux score.

## Flux email

`generate` → WF-02 → brouillon `PENDING_REVIEW` → utilisateur corrige
sujet/corps → `approve` → `APPROVED` → `send` (confirmation UI) → vérification
backend → WF-03 → callback → `SENT` ou `FAILED`. `reject` passe en `REJECTED`
et bloque tout envoi.

## URLs locales

| Service | URL | Accès |
| --- | --- | --- |
| Frontend | http://localhost:3000 | navigateur |
| API | http://localhost:18080/api/v1 | navigateur / backend (`BACKEND_HOST_PORT`) |
| Swagger UI | http://localhost:18080/swagger-ui.html | navigateur |
| Health | http://localhost:18080/actuator/health | navigateur |
| n8n | http://localhost:5678 | navigateur, lié à 127.0.0.1 |
| PostgreSQL | localhost:5432 | lié à 127.0.0.1, diagnostic uniquement |

## Comptes de démonstration (profil `dev` uniquement)

- Email : `demo@leadflow.ai`
- Mot de passe : `DemoPass123!`
- Données fictives chargées seulement si `DEMO_MODE=true` ; marquées
  `source=DEMO` et visuellement signalées dans l'UI.

## Choix técniques notables

- Java 21 compilé via l'image Docker Maven dédiée car l'hôte n'a que Java 8/17.
- Springdoc 2.8.x (lignée Spring Boot 3) plutôt que 3.x (Boot 4).
- Next 15.5 / React 19 / Tailwind 4 : versions stables vérifiées en ligne.
- Groq `openai/gpt-oss-120b` : `llama-3.3-70b-versatile` est déprécié depuis
  août 2026 selon la documentation Groq.
- Mode email `console` : aucune configuration SMTP n'est inventée.
- Sur la machine de développement, les ports 5432 et 8080 étaient déjà
  occupés : les ports hôtes sont donc `55432` (PostgreSQL) et `18080`
  (backend). Les ports internes Docker restent 5432 et 8080.
