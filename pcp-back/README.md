# Custom Prompt

A **NestJS-based backend** for AI-powered prompt management and generation, with PostgreSQL integration, Redis-powered queues, and external services like Notion and OpenAI.

---

## 🚀 Prerequisites

Make sure you have the following installed:

- **Node.js** v20+
- **Docker** & **Docker Compose**
- **PostgreSQL**
- **Redis**

---

## 🧰 Tech Stack

- **NestJS** — backend framework
- **PostgreSQL** — primary database
- **Redis + Bull** — job queues
- **Qdrant** — Vector database for storing and searching AI memory embeddings
- **AI Copilot System** — Autocomplete, memory summarization, glossary extraction
- **Stripe** — Subscription billing and webhook handling
- **Swagger (OpenAPI)** — API documentation via decorators
- **ESLint + Prettier** — Code quality and formatting

---

## ⚙️ Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd custom-prompt
Set up environment variables
Copy .env.example to .env and fill in the required values.

Install dependencies
   ```bash

npm install


Build Docker containers

npm run local:docker:build


Run database migrations

npm run typeorm:run-migrations

npm run seed
   ```

# Start local development
npm run local

Local Development Commands
ℹ️ Note: When adding a new entity, import it in orm.config.ts.
   ```bash

# Start app locally
npm run local

# TypeORM migrations
npm run typeorm:run-migrations                         # Run all migrations
npm run typeorm:generate-migration --name=create-table-example
npm run typeorm:revert-migration                       # Revert last migration

npm run seed
# Docker
npm run local:docker:down                              # Stop containers
npm run local:docker:build                             # Rebuild containers

# Code quality
npm run prettier                                       # Format codebase
npm run lint                                           # Run ESLint
   ```
## Project Structure

- `src/` - Source code
    - `mail/templates/` - Email templates
    - `common/` - Shared utilities and configurations

Base URL: /api

CORS: Enabled

For full OpenAPI/Swagger docs — contact the maintainers.

📜 License

This project is proprietary and not open source. All rights reserved.