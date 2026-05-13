APP = trivia

.PHONY: setup dev prod frontend down logs cleanup migrate shell-db

setup:
	docker network create proxy 2>/dev/null || true
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$$(openssl rand -hex 24)|" .env; \
		sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$$(openssl rand -hex 64)|" .env; \
		sed -i "s|^DISMISS_SECRET=.*|DISMISS_SECRET=$$(openssl rand -hex 32)|" .env; \
		echo ".env created with generated credentials"; \
	else \
		echo ".env already exists, skipping"; \
	fi
	docker compose up -d --build
	@echo "Waiting for db to be healthy..."
	@until docker compose exec db pg_isready -U $$(grep POSTGRES_USER .env | cut -d= -f2) > /dev/null 2>&1; do sleep 1; done
	docker compose exec backend npm run migrate

dev:
	@if [ ! -f /etc/dnsmasq.d/$(APP).tyrelparker.dev.conf ]; then \
		sudo cp dnsmasq/$(APP).tyrelparker.dev.conf /etc/dnsmasq.d/; \
		sudo systemctl restart dnsmasq; \
		echo "dnsmasq configured"; \
	fi
	docker compose up -d --build

prod:
	NODE_ENV=production docker compose up -d --build

frontend:
	docker compose up -d --build frontend

down:
	docker compose down

logs:
	docker compose logs -f

cleanup:
	@if [ -f /etc/dnsmasq.d/$(APP).tyrelparker.dev.conf ]; then \
		sudo rm /etc/dnsmasq.d/$(APP).tyrelparker.dev.conf; \
		sudo systemctl restart dnsmasq; \
		echo "dnsmasq config removed"; \
	else \
		echo "no dnsmasq config found, skipping"; \
	fi

migrate:
	docker compose exec backend npm run migrate

shell-db:
	docker compose exec db psql -U $$(grep POSTGRES_USER .env | cut -d= -f2) $$(grep POSTGRES_DB .env | cut -d= -f2)
