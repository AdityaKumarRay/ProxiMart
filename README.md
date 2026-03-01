# ProxiMart Backend

A local-grocery marketplace backend connecting neighborhood vendors and customers. Built with Node.js, TypeScript, Express v5, Prisma, and PostgreSQL.

## Tech Stack

| Layer          | Technology                         |
| -------------- | ---------------------------------- |
| Runtime        | Node.js 20 LTS                     |
| Language       | TypeScript (strict mode)           |
| Framework      | Express v5                         |
| ORM            | Prisma 6                           |
| Database       | PostgreSQL 16                      |
| Cache / PubSub | Redis 7                            |
| Message Broker | RabbitMQ 3                         |
| Validation     | Zod                                |
| Logging        | Pino (structured JSON)             |
| Testing        | Jest + Supertest                   |
| Security       | Helmet + CORS + express-rate-limit |
| ML Service     | Python + FastAPI + LangChain       |
| CI/CD          | GitHub Actions + Docker + EC2      |

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- RabbitMQ 3+
- Python 3.11+ (for ML service)
- Docker & Docker Compose (optional, for containerized setup)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AdityaKumarRay/ProxiMart.git
cd ProxiMart
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your local values
```

### 4. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Running with Docker

```bash
cd docker
docker compose up -d
```

This starts:

- **API** on port `3000`
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **RabbitMQ** on port `5672` (management UI on `15672`)
- **ML Service** on port `8000`

## Available Scripts

| Script              | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start dev server with hot reload |
| `npm run build`     | Compile TypeScript to dist/      |
| `npm start`         | Run compiled production build    |
| `npm test`          | Run Jest test suite              |
| `npm run lint`      | Run ESLint + Prettier checks     |
| `npm run lint:fix`  | Auto-fix lint and format issues  |
| `npm run format`    | Format all source files          |
| `npm run typecheck` | Type check without emitting      |

## Project Structure

```
src/
├── config/          # Environment validation, constants
├── middlewares/      # Auth, error handler, rate limit, validation
├── modules/         # Feature modules (health/, auth/, etc.)
│   └── [module]/
│       ├── [module].router.ts
│       ├── [module].controller.ts
│       ├── [module].service.ts
│       ├── [module].schema.ts
│       └── [module].test.ts
├── prisma/          # Prisma client singleton
├── utils/           # Logger, response helpers, errors
├── app.ts           # Express app setup (no listen)
└── server.ts        # Entry point (listen + graceful shutdown)
```

## API Documentation

See [API_SPEC.md](API_SPEC.md) for full endpoint documentation.

## License

MIT
