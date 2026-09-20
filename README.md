# 🛡 FraudShield — Financial Fraud Detection & Investigation Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application for monitoring financial transactions, flagging suspicious activity with a rule-based fraud detection engine, and managing fraud investigations end-to-end.

Built as a portfolio-grade project demonstrating production-style architecture, authentication, authorization, testing, and documentation practices for a Full-Stack / MERN developer internship application.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Features](#3-features)
4. [Technology Stack](#4-technology-stack)
5. [Architecture](#5-architecture)
6. [Folder Structure](#6-folder-structure)
7. [Database Design](#7-database-design)
8. [API Documentation](#8-api-documentation)
9. [Authentication Flow](#9-authentication-flow)
10. [Fraud Detection Logic](#10-fraud-detection-logic)
11. [Setup Instructions](#11-setup-instructions)
12. [Environment Variables](#12-environment-variables)
13. [Database Setup](#13-database-setup)
14. [Seed Instructions](#14-seed-instructions)
15. [Running Locally](#15-running-locally)
16. [Testing](#16-testing)
17. [Build Instructions](#17-build-instructions)
18. [Deployment](#18-deployment)
19. [Security Considerations](#19-security-considerations)
20. [Future Improvements](#20-future-improvements)
21. [Screenshots](#21-screenshots)
22. [Author / Project Information](#22-author--project-information)

---

## 1. Project Overview

FraudShield is a transaction monitoring and fraud investigation platform aimed at small financial teams. Authenticated users create and review transactions, a rule-based engine scores each one for risk in real time, and investigators manage cases end-to-end — notes, linked transactions, status changes — while admins oversee users and audit trails.

## 2. Problem Statement

Financial institutions process large volumes of transactions daily, and manually reviewing each one for fraud is infeasible. FraudShield solves this by automatically scoring every transaction against a configurable rule set the moment it's created, surfacing only the transactions that actually need human attention, and giving investigators a structured workflow (cases, notes, linked evidence, status tracking) instead of a spreadsheet.

## 3. Features

- **Authentication**: register/login/logout, JWT, bcrypt password hashing, persistent sessions, protected & role-based routes.
- **Roles**: Admin, Investigator, Analyst — each with different permissions (see [Authentication Flow](#9-authentication-flow)).
- **User management**: profile updates, password changes, admin user list with search/filter, activate/deactivate accounts, role management.
- **Transaction management**: full CRUD, server-side search/filter/sort/pagination by account, amount, status, risk level, date range, type.
- **Rule-based fraud detection engine**: 7 configurable rules producing a 0–100 risk score (see [Fraud Detection Logic](#10-fraud-detection-logic)).
- **Dashboard**: total transactions, total value, suspicious count, critical count, active investigations, fraud rate, average risk score, user count — all from live backend aggregation queries, visualized with line/pie/bar charts (Recharts).
- **Investigation management**: create/assign/update cases, priority & status tracking, notes, linked transactions.
- **Transaction network visualization**: SVG-based account relationship graph (accounts as nodes, transactions as edges), click a node to inspect its transaction history.
- **Transaction details page**: full transaction record, detection reasons, related transactions, investigation link, role-gated actions.
- **In-app notifications**: critical/suspicious transaction alerts, investigation assignment/update notices, read/unread state.
- **Audit logging**: every sensitive action (login, transaction CRUD, investigation changes, role changes) is recorded with actor, resource, and metadata; viewable by admins.
- **Consistent REST API** with standard JSON envelopes and status codes.
- **Centralized error handling**, both backend (Mongo/JWT/validation errors normalized) and frontend (friendly messages, loading/empty/error states everywhere).
- **Backend + frontend automated tests** (Jest/Supertest, Vitest/Testing Library).

## 4. Technology Stack

**Frontend:** React 18, Vite, React Router v6, Axios, Context API, custom hooks, Recharts, plain CSS design system (no UI framework dependency).

**Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, express-validator, Helmet, CORS, express-rate-limit, express-mongo-sanitize, Morgan + Winston logging.

**Database:** MongoDB (Atlas or local), with compound indexes on frequently-queried fields and aggregation pipelines for statistics.

**Testing:** Jest + Supertest + mongodb-memory-server (backend), Vitest + React Testing Library (frontend).

**Tooling:** npm workspacesless monorepo (root scripts orchestrate both apps), dotenv, nodemon, concurrently.

## 5. Architecture

```
┌─────────────┐        HTTPS/JSON       ┌──────────────┐        Mongoose         ┌───────────┐
│  React SPA  │  ───────────────────►   │  Express API │  ───────────────────►   │  MongoDB  │
│  (Vite)     │  ◄───────────────────   │  (Node.js)   │  ◄───────────────────   │  Atlas    │
└─────────────┘                         └──────────────┘                         └───────────┘
      │                                        │
      │  JWT stored in localStorage            │  Layered MVC-ish structure:
      │  attached via Axios interceptor        │  routes → validators → controllers → services → models
```

Request flow: `Route → validate() middleware → protect/authorize middleware → controller → (service layer for business logic) → Mongoose model → MongoDB`. Errors thrown anywhere in that chain are caught by `asyncHandler` and normalized by the central `errorHandler`.

## 6. Folder Structure

```
fraudshield/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Reusable UI (Sidebar, Topbar, Badges, Modal, Tables, States...)
│   │   ├── pages/                # Route-level views (Dashboard, Transactions, Investigations...)
│   │   ├── layouts/              # AppLayout (sidebar + topbar shell)
│   │   ├── context/               # AuthContext, NotificationContext
│   │   ├── hooks/                 # useApi
│   │   ├── services/               # Axios instance + one module per resource
│   │   ├── utils/                  # formatters
│   │   ├── __tests__/               # Vitest component tests
│   │   ├── App.jsx / main.jsx / index.css
│   ├── index.html / vite.config.js / package.json
│
├── server/                      # Express + MongoDB backend
│   ├── src/
│   │   ├── config/                # db.js, constants.js
│   │   ├── controllers/            # one per resource
│   │   ├── middleware/              # auth, error handling, validation, audit logging
│   │   ├── models/                   # User, Transaction, Investigation, Notification, AuditLog
│   │   ├── routes/                    # one router per resource + index
│   │   ├── services/                   # fraudDetectionService, notificationService
│   │   ├── utils/                        # ApiError, asyncHandler, apiResponse, logger
│   │   ├── validators/                    # express-validator chains per resource
│   │   ├── seed/                           # seed.js
│   │   ├── __tests__/                       # Jest/Supertest suites
│   │   ├── app.js / server.js
│   ├── .env.example / package.json
│
├── README.md
├── .gitignore
└── package.json                  # root scripts (dev, install:all, seed, build, test)
```

## 7. Database Design

**User** — `name, email (unique), password (hashed, select:false), role (admin|investigator|analyst), isActive, lastLogin, timestamps`. Text index on name/email for search.

**Transaction** — `transactionRef (unique), senderAccount, receiverAccount, amount, currency, transactionType, paymentMethod, status, location, ipAddress, deviceInfo, occurredAt, riskScore, riskLevel, fraudStatus, suspicionReasons[], detectedAt, investigation (ref), createdBy (ref User)`. Compound indexes on `occurredAt`, `(riskLevel, fraudStatus)`, `(senderAccount, occurredAt)`, `amount`.

**Investigation** — `caseId (unique), title, description, assignedTo (ref User), createdBy (ref User), relatedTransactions[] (ref Transaction), priority, status, notes[{author (ref User), text, timestamps}]`. Index on `(status, priority)`.

**Notification** — `user (ref), type, message, relatedTransaction (ref), relatedInvestigation (ref), isRead`. Index on `(user, isRead, createdAt)`.

**AuditLog** — `user (ref), action, resource, resourceId, metadata (Mixed), ipAddress`. Indexes on `createdAt`, `(user, createdAt)`, `action`.

**Relationships:** User → Investigations (assignedTo/createdBy) → Transactions (relatedTransactions); Transaction → Investigation (back-reference); User → Notifications; User → AuditLogs.

## 8. API Documentation

All responses follow: `{ "success": boolean, "message": string, "data": any, "meta"?: {...} }`. Errors: `{ "success": false, "message": string, "details"?: [...] }`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Current user |
| POST | `/api/auth/logout` | Bearer | Audit-logged logout (stateless JWT) |
| GET | `/api/users` | Admin | List/search/filter users |
| GET | `/api/users/:id` | Admin | Get one user |
| PUT | `/api/users/profile` | Bearer | Update own profile |
| PUT | `/api/users/change-password` | Bearer | Change own password |
| PUT | `/api/users/:id/role` | Admin | Change a user's role |
| PUT | `/api/users/:id/status` | Admin | Activate/deactivate a user |
| GET | `/api/transactions` | Bearer | List with filters/sort/pagination |
| GET | `/api/transactions/suspicious` | Bearer | Flagged/confirmed-fraud transactions |
| GET | `/api/transactions/statistics` | Bearer | Aggregated stats for charts |
| GET | `/api/transactions/network` | Bearer | Node/edge data for the network graph |
| GET | `/api/transactions/:id` | Bearer | One transaction + related |
| POST | `/api/transactions` | Admin/Analyst/Investigator | Create (runs fraud engine) |
| PUT | `/api/transactions/:id` | Admin/Investigator | Update |
| DELETE | `/api/transactions/:id` | Admin | Delete |
| GET | `/api/investigations` | Bearer | List with filters |
| GET | `/api/investigations/:id` | Bearer | One investigation |
| POST | `/api/investigations` | Admin/Investigator | Create |
| PUT | `/api/investigations/:id` | Admin/Investigator | Update status/priority/assignment |
| POST | `/api/investigations/:id/notes` | Admin/Investigator | Add a note |
| POST | `/api/investigations/:id/link-transaction` | Admin/Investigator | Link a transaction |
| GET | `/api/notifications` | Bearer | List own notifications |
| PUT | `/api/notifications/:id/read` | Bearer | Mark one read |
| PUT | `/api/notifications/read-all` | Bearer | Mark all read |
| GET | `/api/audit-logs` | Admin | List audit trail |
| GET | `/api/dashboard/statistics` | Bearer | Aggregated dashboard summary |

Status codes used: `200, 201, 400, 401, 403, 404, 409, 422, 500`.

## 9. Authentication Flow

1. Client submits credentials to `/api/auth/login` (or `/register`).
2. Server verifies the password with `bcrypt.compare`, signs a JWT containing `{ id, role }`, and returns it.
3. Client stores the token in `localStorage` and attaches it to every request via an Axios request interceptor.
4. The `protect` middleware verifies the token on every protected route, loads the user, and rejects deactivated accounts.
5. The `authorize(...roles)` middleware checks `req.user.role` against an allow-list per route.
6. **Role permissions:**
   - **Admin**: manage users, view all transactions/investigations, delete transactions, view audit logs.
   - **Investigator**: view transactions, create/update investigations, add notes, update transactions, view/manage assigned cases.
   - **Analyst**: view transactions, create transactions, view dashboards/statistics, cannot manage investigations or users.
7. A 401 response from the API triggers the frontend to clear the stored session; `ProtectedRoute` then redirects to `/login`.

## 10. Fraud Detection Logic

**This is a rule-based engine, not machine learning.** It lives in `server/src/services/fraudDetectionService.js` as a single `evaluateTransaction(transaction)` function with a stable input/output contract, specifically so it can be replaced or augmented with an ML model later without touching controllers or routes.

Each transaction is scored 0–100 by accumulating points from these rules:

| Rule | Points | Trigger |
|---|---|---|
| Very high amount | +35 | amount ≥ 500,000 |
| High amount | +20 | amount ≥ 200,000 |
| Velocity | +20 | ≥3 transactions from the sender within 10 minutes |
| Rapid movement | +15 | funds sent to ≥3 distinct accounts within 5 minutes |
| Repeated transfers | +15 | ≥5 transfers to the same receiver within 24 hours |
| Unusual location | +15 | location not seen in the account's recent history |
| Linked high-risk account | +25 | sender or receiver tied to a prior confirmed-fraud transaction |
| Round-number structuring | +5 | amount ≥ 50,000 and a round multiple of 10,000 |

Score is capped at 100. Risk levels: **0–29 Low, 30–59 Medium, 60–79 High, 80–100 Critical**. A score ≥ 30 sets `fraudStatus: 'flagged'` and triggers a notification to admins/investigators (critical scores get a distinct, higher-urgency notification type).

## 11. Setup Instructions

**Prerequisites:** Node.js 18+, npm 9+, a MongoDB instance (local or Atlas).

```bash
git clone <your-repo-url> fraudshield
cd fraudshield
npm run install:all        # installs both server and client dependencies
```

## 12. Environment Variables

**server/.env** (copy from `server/.env.example`):

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/fraudshield
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

**client/.env** (copy from `client/.env.example`):

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Never commit real `.env` files — both are already git-ignored.

## 13. Database Setup

**Option A — MongoDB Atlas (recommended for deployment):**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow-list your IP (or `0.0.0.0/0` for demo purposes).
3. Copy the connection string into `server/.env` as `MONGODB_URI`.

**Option B — Local MongoDB:** install MongoDB Community Edition, run `mongod`, and use `mongodb://127.0.0.1:27017/fraudshield` as the URI (already the default in `.env.example`).

## 14. Seed Instructions

```bash
cd server
npm run seed
```

This wipes and repopulates the database with ~250 realistic (entirely fictional) transactions, 4 users, 2 investigations, notifications, and audit logs. **Demo credentials (development only):**

| Role | Email | Password |
|---|---|---|
| Admin | admin@fraudshield.dev | Admin@1234 |
| Investigator | investigator@fraudshield.dev | Investigator@1234 |
| Analyst | analyst@fraudshield.dev | Analyst@1234 |

## 15. Running Locally

From the repository root, with both `.env` files in place:

```bash
npm run dev        # runs server (port 5000) and client (port 5173) concurrently
```

Or individually: `npm run server` / `npm run client`. Visit `http://localhost:5173` and log in with a demo account above.

## 16. Testing

```bash
npm run test:server   # Jest + Supertest, in-memory MongoDB (mongodb-memory-server)
npm run test:client   # Vitest + React Testing Library
```

Backend coverage: registration/login/validation, JWT auth middleware, transaction CRUD + fraud-engine scoring, role-based authorization (403 checks), investigation creation/authorization/updates. Frontend coverage: badge/status rendering, pagination behavior, formatting utilities, and `ProtectedRoute` auth/role redirect logic.

> **Note:** `mongodb-memory-server` downloads a MongoDB binary on first run. In fully offline/sandboxed environments this download can fail — the tests themselves are correct and will run normally with standard internet access (e.g. any local machine or CI runner).

## 17. Build Instructions

```bash
npm run build       # builds the client (client/dist) for production
```

The server needs no build step (plain Node.js/CommonJS).

## 18. Deployment

**Backend** (Render / Railway / any Node host):
1. Set the root/start directory to `server/`.
2. Build command: `npm install`. Start command: `npm start`.
3. Set environment variables from the table in [§12](#12-environment-variables) (`MONGODB_URI` pointing at your Atlas cluster, a strong `JWT_SECRET`, and `CLIENT_URL` set to your deployed frontend's origin).

**Frontend** (Vercel / Netlify):
1. Root directory: `client/`. Build command: `npm run build`. Output directory: `dist`.
2. Set `VITE_API_BASE_URL` to your deployed backend's `/api` URL.

**MongoDB Atlas:** as described in [§13](#13-database-setup); remember to allow-list your backend host's outbound IP (or use Atlas's "allow from anywhere" only for demos, never production).

## 19. Security Considerations

- Passwords hashed with **bcrypt** (cost factor 12); plaintext passwords are never stored or logged, and the password field is `select: false` by default.
- **JWT** authentication with configurable expiry; secrets are never hardcoded, only read from environment variables.
- **Role-based authorization** enforced server-side on every sensitive route — the frontend hides UI for unauthorized roles, but the API is the actual enforcement boundary.
- **Helmet** sets protective HTTP headers; **CORS** is locked to the configured `CLIENT_URL` origin.
- **express-rate-limit** throttles all `/api/*` traffic to reduce brute-force/abuse risk.
- **express-mongo-sanitize** strips `$`/`.` operators from user input to prevent NoSQL injection.
- **express-validator** validates and normalizes all inputs server-side (never trusting client-side validation alone); Mongoose `CastError`s from malformed ObjectIds are caught and returned as clean 400s rather than leaking internals.
- **Centralized error handler** hides stack traces and internal error messages in production, returning generic messages for unexpected 500s while still logging full detail server-side via Winston.
- **Audit logging** on all sensitive actions gives a tamper-evident trail of who did what and when.
- Self-registration cannot deactivate the registering admin's own account, and a user cannot deactivate themselves, preventing accidental lockout.

## 20. Future Improvements

- Replace/augment the rule-based engine with a trained ML model (e.g. an isolation forest or gradient-boosted classifier) — the engine's `evaluateTransaction` contract was designed specifically to make this a drop-in swap.
- Redis caching for hot aggregation queries (dashboard/statistics endpoints).
- Background job queue (e.g. BullMQ) for fraud re-scoring and scheduled reports, decoupled from the request/response cycle.
- Email/SMS alerts for critical-risk transactions via a transactional email provider.
- WebSocket-based real-time notifications instead of 30-second polling.
- Object storage (S3-compatible) for attaching evidence files to investigations.
- Dockerize both services and add a CI/CD pipeline (GitHub Actions) running the test suites on every PR.
- A proper admin-configurable rules table (currently rule thresholds are constants in code).

## 21. Screenshots

_Add screenshots here once you have a running deployment — e.g. `docs/screenshots/dashboard.png`, `transactions.png`, `investigation-detail.png`, `network-view.png`._

## 22. Author / Project Information

**Project:** FraudShield — Financial Fraud Detection & Investigation Platform
**Stack:** MongoDB · Express · React · Node.js (MERN)
**Purpose:** Portfolio project demonstrating full-stack development, secure authentication/authorization, rule-based business logic, REST API design, and test-driven backend/frontend development.
