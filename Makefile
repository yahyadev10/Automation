.DEFAULT_GOAL := help
COMPOSE := docker compose

.PHONY: help up down logs build test clean status import-workflows export-workflows smoke

help:
	@echo "LeadFlow AI — commandes disponibles"
	@echo "  make up                Démarrer tous les services"
	@echo "  make down              Arrêter les services (conserver les volumes)"
	@echo "  make logs              Suivre les logs de tous les services"
	@echo "  make build             Reconstruire les images"
	@echo "  make test              Exécuter les tests backend et frontend"
	@echo "  make clean             ATTENTION : supprime aussi les volumes de données"
	@echo "  make status            Afficher l'état des conteneurs"
	@echo "  make import-workflows  Importer les workflows n8n"
	@echo "  make export-workflows  Exporter les workflows n8n"
	@echo "  make smoke             Lancer le smoke test"

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

build:
	$(COMPOSE) build --pull

test:
	docker run --rm -v "$(CURDIR)/backend:/app" -w /app maven:3.9.9-eclipse-temurin-21 mvn -B test
	cd frontend && npm test -- --run

clean:
	@echo "ATTENTION : cette commande va supprimer les volumes postgres-data et n8n-data."
	@echo "Toutes les données locales seront perdues."
	@read -p "Continuer ? [y/N] " ans; \
	if [ "$$ans" = "y" ] || [ "$$ans" = "Y" ]; then \
		$(COMPOSE) down -v --remove-orphans; \
	else \
		echo "Annulé."; \
	fi

status:
	$(COMPOSE) ps

import-workflows:
	./scripts/import-n8n-workflows.sh

export-workflows:
	./scripts/export-n8n-workflows.sh

smoke:
	./scripts/smoke-test.sh
