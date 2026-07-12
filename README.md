# TransitOps: Smart Transport Operations Platform

### Project Leadership

- **Mohit Maulekhi** (mohitmaulekhi312@gmail.com)
- **Tanmay Gupta** (tanmaygupta.0215@gmail.com)

---

## 1. Executive Summary

TransitOps is a centralized, end-to-end transport operations and fleet asset management platform. It digitizes vehicle registries, driver safety profiles, dispatching, maintenance records, and fuel/expense logs. TransitOps replaces manual spreadsheets with automated business rules, real-time safety compliance locks, and unified operational insights.

---

## 2. Role-Based Access Control (RBAC) Architecture

TransitOps enforces role boundaries both at the client interface level and the REST API layer:

- **Fleet Manager:** Administers fleet assets, edits vehicle records, and opens/closes maintenance logs.
- **Driver:** Views assigned schedules, dispatches routes, and logs completed odometers and fuel refills.
- **Safety Officer:** Ensures driver compliance, tracks driving licenses, audits safety scores, and controls suspensions.
- **Financial Analyst:** Monitors fuel outlays, administrative tolls, maintenance costs, and analyzes vehicle profitability.

---

## 3. Technology Stack & Modern Tooling

TransitOps is structured as a unified monorepo workspace for compilation safety:

### Monorepo Structure

- **Monorepo Orchestration:** Turborepo with dynamic build caching.
- **Package Manager:** pnpm Workspaces for fast, space-efficient dependency linking.

### Frontend Application (apps/web)

- **Core Framework:** Next.js 16 (React 19 App Router) with Turbopack compilation.
- **Styling & UI:** Tailwind CSS v4 with a custom, polished Glassmorphism Dark Theme.
- **State Management:** Zustand for persistent, client-side session and theme configurations.
- **Asynchronous Queries:** TanStack React Query v5 for fully cached server synchronization.

### Backend Application (apps/api)

- **Server Engine:** Node.js & Express with full TypeScript support.
- **Session Security:** jsonwebtoken (JWT) token validation with authorization headers.
- **Database ORM:** Drizzle ORM for type-safe query compilation.
- **Database Engine:** PostgreSQL database schemas.

### Shared Workspace Packages

- `@repo/schemas`: Universal, shared Zod validation schemas (guaranteeing identical API payload validation on both frontend and backend).
- `@repo/typescript-config` & `@repo/eslint-config`: Shared workspace rules for strict compiling and ESLint audits.

---

## 4. Key Core Features & Enforced Business Rules

### KPI Dashboard

- Active, available, and in-maintenance vehicle counts, drivers on duty, active dispatches, and live fleet utilization rates.
- Fully interactive filters to isolate records by Vehicle Type, Status, or Region.

### Vehicle Registry

- Unique registration number indexing checking constraints before saving.
- Track model specifications, load capacity, odometers, and acquisition costs.

### Driver Safety & Compliance

- Strict validation preventing driver assignment if their license is expired or if their status is set to SUSPENDED.
- Driver lists feature dynamic visual warnings highlighting expired credentials in real-time.

### Google Maps Integrated Trip Dispatcher

- Google Places Autocomplete for warehouse address inputs.
- Google Directions API rendering a real-time dark-mode vector map preview, automatically calculating driving distances.
- Safety limit validations checking cargo weights against vehicle load capacity to block overloaded draft plans.
- Seamless state management transitions:
  - **Dispatch:** Moves vehicle and driver to ON_TRIP.
  - **Cancel:** Restores vehicle and driver back to AVAILABLE.
  - **Completion:** Solicits final odometers, logs fuel refills, and restores assets back to AVAILABLE.

### Maintenance Management

- Logging a vehicle in maintenance sets its status to IN_SHOP and instantly locks it out from the Trip Dispatcher pool.
- Single-click closure records to restore the asset back to AVAILABLE.

### Fuel & Administrative Ledger

- Record refuels and generic expenses (Tolls, Registrations, Insurances).
- Live summaries tracking total operational outlays (fuel + repairs + administrative tolls).

### Reports, Analytics & Dual Exporters

- Dynamic Cost vs. Revenue Side-by-Side Bar Charts.
- Fuel Mileage plots (km/L) and interactive Vehicle Return on Investment (ROI) Leaderboards.
- **Dual Exporters:**
  - **CSV Exporter:** Authenticated data retrieval downloading formatted ledger files.
  - **PDF Exporter:** Dynamically generates formatted, corporate tabular PDF reports on-the-fly.

---

## 5. Directory Structure & Architecture

```text
├── apps/
│   ├── api/             # Express API application (Controllers, Routers, Services)
│   └── web/             # Next.js frontend application (App Router, Stores, Components)
├── packages/
│   ├── schemas/         # Shared Zod validation schemas (unified client-server contracts)
│   ├── eslint-config/   # Shared code style guidelines
│   └── typescript-config/# Shared TS compilations configs
└── pnpm-lock.yaml       # Monorepo lockfile
```

---

## 6. Installation & Execution Guidelines

### Development Mode Setup

1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Build shared schemas and packages:
   ```bash
   pnpm run build
   ```
3. Execute the development servers (runs web and API concurrently):
   ```bash
   pnpm run dev
   ```
