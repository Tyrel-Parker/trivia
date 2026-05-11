APP = trivia

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
	docker compose up -d --build db backend
	@echo "Waiting for db to be healthy..."
	@until docker compose exec db pg_isready -U $$(grep POSTGRES_USER .env | cut -d= -f2) > /dev/null 2>&1; do sleep 1; done
	docker compose exec backend npm run migrate

dev:
	docker compose up -d --build db backend
	cd frontend && npm run dev

prod:
	NODE_ENV=production FRONTEND_URL=https://trivia.tyrelparker.dev \
	docker compose --profile prod up -d --build

down:
	docker compose --profile prod down

logs:
	docker compose logs -f

migrate:
	docker compose exec backend npm run migrate

dnsmasq-install:
	sudo cp dnsmasq/trivia.tyrelparker.dev.conf /etc/dnsmasq.d/ && sudo systemctl restart dnsmasq

shell-db:
	docker compose exec trivia-db psql -U $$(grep POSTGRES_USER .env | cut -d= -f2) $$(grep POSTGRES_DB .env | cut -d= -f2)
