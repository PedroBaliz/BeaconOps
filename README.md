# BeaconOps

BeaconOps is a web application for analyzing HTTP endpoints and monitoring service availability and performance.

It provides on-demand URL analysis, response latency measurement, health assessments, scheduled monitoring, and historical data storage using PostgreSQL.

The project combines backend development, HTTP communication, security-oriented URL validation, relational database design, automated testing, and Docker containerization.

---

## Features

- On-demand HTTP endpoint analysis
- Response latency measurement in milliseconds
- HTTP status and availability monitoring
- Health classification and recommendations
- Automated monitoring of registered services
- Analysis history stored in PostgreSQL
- Monitored service registration and management
- URL validation and DNS safety checks
- Automated unit and integration tests
- Docker-based execution

---

## Architecture

BeaconOps uses a modular architecture built with Node.js, TypeScript, and Express.

```text
Web Interface
     |
     v
Express API
     |
     v
URL Validation and DNS Safety
     |
     v
HTTP Checker
     |
     v
Health Analyzer
     |
     v
PostgreSQL
```

Automated monitoring runs through a separate scheduled process coordinated by `node-cron`, which checks registered services according to their configured intervals.

### Design Decisions

**Modular application structure**

API handling, HTTP checks, health assessment, scheduled monitoring, and database operations are separated into dedicated modules. This improves maintainability and allows individual components to be tested independently.

**Separation of checking and analysis**

The HTTP checker collects response data, while the health analyzer interprets the results and generates assessments. This separates data collection from business logic.

**Scheduled monitoring**

`node-cron` coordinates recurring checks independently of on-demand analysis requests, allowing registered services to be monitored over time.

**Security-oriented URL handling**

URL validation and DNS safety checks are handled separately from HTTP communication to help reduce risks associated with user-controlled destinations.

---

## Database

BeaconOps uses PostgreSQL to persist analysis history and registered services.

The database layer separates connection management, history operations, and monitored service management into dedicated modules.

## Security

The application includes URL validation and DNS-related safety checks before making outbound HTTP requests. These mechanisms help reduce risks associated with unsafe destinations.

Because URL validation alone does not prevent every form of server-side request forgery (SSRF), protection also depends on how IP addresses, DNS resolution, redirects, and outbound connections are handled.

Sensitive configuration, including database credentials, should be provided through environment variables rather than committed to version control.

---

## Technology Stack

**Languages:** TypeScript, JavaScript, HTML, CSS, SQL

**Backend:** Node.js, Express

**HTTP Requests:** Axios

**Database:** PostgreSQL

**Scheduling:** node-cron

**Testing:** Vitest, Supertest

**Containerization:** Docker, Docker Compose

**Configuration:** dotenv

---

## Project Structure

```text
BeaconOps/
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src/
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── utils/
│   └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── compose.yaml
├── package.json
├── tsconfig.json
└── .env.example
```

### Main Components

- `src/api/` — API routes and request handling.
- `src/core/checker.ts` — HTTP requests and latency measurement.
- `src/core/analyzer.ts` — health assessments and recommendations.
- `src/core/monitor.ts` — scheduled monitoring.
- `src/core/url-validator.ts` — URL validation.
- `src/core/safe-dns.ts` — DNS-related safety checks.
- `src/db/` — PostgreSQL connections and data operations.
- `public/` — web interface.
- `tests/` — automated unit and integration tests.

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Analyzes a URL |
| `GET` | `/api/history` | Retrieves recent analysis history |
| `GET` | `/api/monitors` | Lists monitored services |
| `POST` | `/api/monitors` | Registers a monitored service |

### Example Request

```json
{
  "url": "https://example.com"
}
```

Send the request to `POST /api/analyze` with a JSON content type. The response includes information such as HTTP status, latency, availability, and analysis results.

---

## Running Locally

### Requirements

- Node.js 22 or a compatible version
- npm
- PostgreSQL

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd BeaconOps
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file based on `.env.example`.

```dotenv
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/beaconops
```

Replace the placeholders with your PostgreSQL credentials and ensure the database exists.

### 4. Start the Application

```bash
npm run dev
```

The server uses port `3000` by default, depending on the environment configuration.

---

## Running with Docker

Configure the environment variables required by `compose.yaml`, including the appropriate PostgreSQL connection string.

Build and start the containers:

```bash
docker compose up --build -d
```

Check container status:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs --tail=50 app
```

Stop the containers:

```bash
docker compose down
```

---

## Testing

Run the automated tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Check TypeScript types:

```bash
npm run typecheck
```

Build the application:

```bash
npm run build
```

These commands require the corresponding scripts to be configured in `package.json`.

---

## Future Improvements

- Service failure notifications
- Historical performance charts and availability statistics
- Improved monitoring diagnostics
- Continuous integration and deployment

---

## License

The project declares the ISC license in `package.json`.
