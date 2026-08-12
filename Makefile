.PHONY: setup install dev build db-push db-seed clean format docker-up docker-down

setup: install
	@echo "Copying .env file..."
	@cp .env.example .env
	@echo "Setup complete. Please update .env with your real API keys."

install:
	@echo "Installing monorepo dependencies..."
	pnpm install
	@echo "Installing Python dependencies..."
	cd packages/agents && pip install -r requirements.txt

db-push:
	@echo "Pushing database schema..."
	cd packages/database && pnpm prisma db push

db-seed:
	@echo "Seeding database with sample data..."
	cd packages/database && pnpm ts-node seed.ts

dev:
	@echo "Starting development environment..."
	pnpm run dev

build:
	@echo "Building monorepo..."
	pnpm run build

clean:
	@echo "Cleaning monorepo build artifacts..."
	pnpm run clean

docker-up:
	@echo "Starting Docker Compose environment..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker Compose environment..."
	docker-compose down
