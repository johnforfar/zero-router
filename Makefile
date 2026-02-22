.PHONY: setup build-program deploy-local run-gateway run-frontend restart stop all

# 🚀 ZeroRouter - Speed of Light AI Utility

setup:
	@echo "🔧 Installing dependencies..."
	cd frontend && npm install
	cd program && yarn install
	@echo "✅ Setup complete."

build-program:
	@echo "🏗️ Building Anchor program..."
	cd program && anchor build

deploy-local:
	@echo "🌐 Deploying to Localnet..."
	cd program && anchor deploy

run-gateway:
	@echo "🌊 Starting ZeroRouter Gateway (Rust)..."
	cd gateway && cargo run

run-frontend:
	@echo "🖥️ Starting Next.js Frontend..."
	cd frontend && npm run dev

stop:
	@echo "🛑 Stopping all ZeroRouter services..."
	@pkill -f "zerorouter-gateway" || true
	@pkill -f "next-router-worker" || true
	@pkill -f "next" || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@rm -rf frontend/.next || true
	@echo "✅ Stopped and Cache Cleared."

restart: stop
	@echo "🔄 Restarting ZeroRouter with Docker..."
	DOCKER_HOST=unix:///Users/johnny/.docker/run/docker.sock docker compose up -d --build
	@echo "✅ ZeroRouter is spinning up in Docker."
	@echo "🖥️ Frontend: http://localhost:3000"
	@echo "🌊 Gateway: http://localhost:8080"

native: stop
	@echo "🏠 Starting ZeroRouter Natively (Fallback)..."
	@cd gateway && cargo run > gateway.log 2>&1 &
	@echo "🌊 Gateway starting in background (tail -f ZeroRouter/gateway/gateway.log)..."
	@cd frontend && npm run dev

prune:
	@echo "🧹 Cleaning up Docker system (Freeing space)..."
	@docker system prune -af --volumes || true
	@echo "✅ Cleanup complete."

upgrade:
	@echo "🚀 Upgrading Docker and cleaning socket..."
	@killall Docker || true
	@sudo rm -f /var/run/docker.sock
	@brew upgrade --cask docker || echo "Manual upgrade required from https://www.docker.com/products/docker-desktop/"
	@open -a Docker
	@echo "⌛ Docker is restarting. Wait 60s."

all: setup build-program deploy-local run-gateway run-frontend
