# PostgreSQL

La base est gérée exclusivement par Flyway au démarrage du backend.
Aucun script SQL manuel n'est nécessaire.

- Image : `postgres:16-alpine`
- Données : volume nommé `postgres-data`
- Accès : réseau interne Docker uniquement ; le port hôte est lié à
  `127.0.0.1` pour le debugging local (`POSTGRES_HOST_PORT`, 5432 par défaut).
- Healthcheck : `pg_isready`, utilisé par `depends_on` du backend.

Tables et index : voir `backend/src/main/resources/db/migration/` et
`docs/DATABASE.md`.

Connexion locale de diagnostic (mot de passe depuis `.env`) :

```bash
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```
