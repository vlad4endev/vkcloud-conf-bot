.PHONY: up dev

up:
	docker-compose up -d
	sleep 3
	npm run db:migrate
	npm run db:seed

dev:
	npm run dev:bot & npm run dev:admin & npm run dev:miniapp & npm run dev:admin-panel
