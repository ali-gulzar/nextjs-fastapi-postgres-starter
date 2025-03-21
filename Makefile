.PHONY: run-app-locally
run-app-locally:
	npx concurrently "docker compose up" \
	"cd backend && poetry install --no-root && poetry run uvicorn main:app --reload" \
	"cd frontend && npm i && npm run dev"

.PHONY: fmt
fmt:
	ruff check --fix && ruff format
