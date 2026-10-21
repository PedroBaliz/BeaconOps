# BeaconOps

BeaconOps is a web application for analyzing HTTP endpoints and monitoring service availability and performance. It provides on-demand URL analysis, automated monitoring, health assessments, and historical data storage.

## Features

- On-demand HTTP endpoint analysis.
- Response time measurement in milliseconds.
- Service availability and HTTP status monitoring.
- Health classification and recommendations.
- Automated monitoring with scheduled checks.
- Analysis history stored in PostgreSQL.
- Monitored service registration and management.
- Web interface for interacting with the application.
- URL validation and DNS safety checks.
- Automated unit and integration tests.
- Docker-based deployment.

## Architecture

BeaconOps uses a modular architecture that separates the user interface, API, core business logic, and database operations.

The application follows this general flow:

1. **Frontend:** The files in `public/` provide the web interface using HTML, CSS, and JavaScript.
2. **API:** The Express server receives HTTP requests and routes them to the appropriate application functionality.
3. **URL validation and security:** The validation components check submitted URLs and perform DNS-related safety checks before the application connects to external endpoints.
4. **HTTP checker:** The checker sends HTTP requests and collects response status, latency, and error information.
5. **Health analyzer:** The analyzer evaluates the check results and produces a health classification, summary, and recommendations.
6. **Automated monitor:** A scheduled task uses `node-cron` to check registered services according to their configured intervals.
7. **Database layer:** PostgreSQL stores analysis history and registered services, including scheduling information.
8. **Testing and deployment:** Vitest and Supertest support automated testing, while Docker and Docker Compose provide containerized execution.

### Project Structure

```text
BeaconOps/
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src/
│   ├── api/
│   │   └── analyze.ts
│   ├── core/
│   │   ├── analyzer.ts
│   │   ├── checker.ts
│   │   ├── monitor.ts
│   │   ├── safe-dns.ts
│   │   ├── types.ts
│   │   └── url-validator.ts
│   ├── db/
│   │   ├── history.ts
│   │   ├── monitored-services.ts
│   │   ├── pool.ts
│   │   └── test-connection.ts
│   ├── utils/
│   │   └── logger.ts
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

- **`src/index.ts`:** Application entry point and server initialization.
- **`src/api/`:** API routes and request handling.
- **`src/core/checker.ts`:** Performs HTTP checks and measures response latency.
- **`src/core/analyzer.ts`:** Interprets check results and generates health assessments.
- **`src/core/monitor.ts`:** Coordinates scheduled service monitoring.
- **`src/core/url-validator.ts`:** Validates submitted URLs.
- **`src/core/safe-dns.ts`:** Implements DNS-related safety checks.
- **`src/db/`:** Handles database connections, analysis history, and monitored services.
- **`public/`:** Contains the web interface.
- **`tests/`:** Contains unit and integration tests.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| TypeScript | Type-safe application development |
| Express | HTTP server and API |
| Axios | HTTP requests |
| PostgreSQL | Data persistence |
| node-cron | Scheduled monitoring |
| Vitest | Automated testing |
| Supertest | HTTP integration testing |
| Docker | Containerization |
| Docker Compose | Container orchestration |
| dotenv | Environment configuration |

## Requirements

- Node.js 22 or a compatible version.
- npm.
- PostgreSQL.
- Docker Desktop and Docker Compose for containerized deployment.

## Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd BeaconOps
```

Replace `<YOUR_REPOSITORY_URL>` with the repository's actual URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a reference.

Configure your PostgreSQL connection:

```dotenv
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/beaconops
```

Replace the placeholders with your local database credentials. Ensure the database exists before starting the application.

Never commit your `.env` file or expose database credentials.

### 4. Start the development server

```bash
npm run dev
```

The application runs on port `3000` by default, depending on the configured environment.

## Docker Deployment

Configure `DATABASE_URL_DOCKER` in your `.env` file if using the current Docker Compose configuration. When PostgreSQL runs on the host machine, the connection can use `host.docker.internal`.

Build and start the application:

```bash
docker compose up --build -d
```

Check the container status:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs --tail=50 app
```

Stop the application:

```bash
docker compose down
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Analyze a URL |
| `GET` | `/api/history` | Retrieve recent analysis history |
| `GET` | `/api/monitors` | List monitored services |
| `POST` | `/api/monitors` | Register a monitored service |

### Example: Analyze a URL

Request body:

```json
{
  "url": "https://example.com"
}
```

PowerShell example:

```powershell
$body = @{
    url = "https://example.com"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3000/api/analyze" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

The response includes information such as the URL, HTTP status code, response latency, availability, and analysis results.

## Testing and Validation

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

## Future Improvements

- Authentication and user management.
- Notification integrations.
- Performance charts and historical metrics.
- Improved monitoring execution diagnostics.
- Continuous integration and deployment.
- Expanded API documentation.

## Project Status

BeaconOps is a portfolio project focused on HTTP endpoint analysis, service availability monitoring, scheduled checks, PostgreSQL persistence, automated testing, and containerized deployment.

## License

The project declares the ISC license in `package.json`. Include a `LICENSE` file in the repository if distributing the project under that license.
