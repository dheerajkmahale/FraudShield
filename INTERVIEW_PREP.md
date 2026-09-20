# FraudShield — Interview Preparation Guide

## A. Resume-Ready Project Description

Use one of these depending on space available:

**Short (1 line):**
> FraudShield — MERN-stack fraud detection platform with JWT auth, rule-based risk scoring, and role-based investigation workflows (React, Node.js, Express, MongoDB).

**Standard (bullet form):**
> **FraudShield | Full-Stack MERN Application** — *Personal Project*
> - Built a full-stack financial fraud detection and investigation platform using React, Node.js, Express, and MongoDB with JWT-based authentication and three-tier role-based authorization (Admin/Investigator/Analyst).
> - Designed and implemented a rule-based fraud detection engine that scores transactions 0–100 across 7 configurable rules (velocity checks, amount thresholds, location anomalies, account risk history) and automatically flags suspicious activity.
> - Built RESTful APIs with server-side pagination, filtering, and MongoDB aggregation pipelines powering a live analytics dashboard (Recharts) and an SVG-based transaction network visualization.
> - Implemented centralized error handling, input validation (express-validator), audit logging, and security middleware (Helmet, rate limiting, NoSQL injection sanitization).
> - Wrote automated backend (Jest/Supertest) and frontend (Vitest/RTL) test suites covering authentication, authorization, and core business logic.

## B. 10 Strongest Interview Talking Points

1. **The fraud engine is deliberately isolated** — `evaluateTransaction()` has a stable input/output contract specifically so it could be swapped for a real ML model later without touching controllers, routes, or the frontend. This shows you think about maintainability, not just "make it work."
2. **You built real authorization, not just authentication** — three roles with genuinely different permissions enforced server-side on every route (not just hidden UI buttons), which is what actually matters for security.
3. **You used MongoDB aggregation pipelines**, not application-level loops, to compute dashboard statistics (`$group`, `$cond`, `$dateToString` for time-series) — this is a real skill interviewers probe for.
4. **You made an explicit engineering trade-off on the network graph**: rather than pulling in a heavy force-directed graph library with potential dependency conflicts, you shipped a deterministic SVG circular layout that's guaranteed to render — a pragmatic "ship something reliable" decision you can defend.
5. **Consistent API contract** (`{success, message, data}`) across all 25+ endpoints, with a single centralized error handler normalizing Mongoose validation errors, cast errors, and duplicate-key errors into clean HTTP responses.
6. **Security is layered, not a single feature**: bcrypt hashing → JWT → route-level authorization → Helmet headers → rate limiting → input sanitization → validated inputs → generic error messages in production. You can walk through each layer and explain what it defends against.
7. **You tested the things that actually break**: auth edge cases (weak passwords, duplicate emails, wrong passwords), role-based 403s, and that the fraud engine actually assigns higher risk to genuinely risky transactions — not just happy-path CRUD.
8. **Indexes were chosen deliberately** based on actual query patterns (compound index on `senderAccount + occurredAt` because the fraud engine's velocity/rapid-movement rules query exactly that), not added blindly.
9. **The seed script tells a story**: it generates both realistic "clean" traffic and deliberately structured fraud patterns (rapid transfers, round-number amounts, repeat receivers) so the fraud engine has something meaningful to catch — useful for demoing the app convincingly.
10. **You know the limits of what you built**: it's explicitly a rule-based system, not ML — you can articulate exactly what would need to change to add a real model (feature engineering from the existing transaction schema, a scoring service behind the same `evaluateTransaction` contract, likely a Python microservice or an ONNX model called from Node).

## C. Prepared Answers

**Explain your project.**
FraudShield is a full-stack MERN app that lets financial teams track transactions, automatically flags suspicious ones using a rule-based scoring engine, and gives investigators a structured workflow — cases, notes, linked transactions — to resolve them. It has three user roles with different permissions, a live dashboard built on MongoDB aggregations, and a network graph showing how accounts relate to each other.

**What problem does it solve?**
Manually reviewing every transaction for fraud doesn't scale. The app automatically scores every transaction the moment it's created and only surfaces the ones that actually look risky, so investigators spend their time on the transactions that matter instead of scanning everything.

**Why did you choose MERN?**
It's a single language (JavaScript) across the stack, which sped up development, and React + Express + MongoDB is a natural fit for a data-heavy CRUD-and-dashboard app like this — MongoDB's flexible schema suited transaction records that gained fields (risk score, suspicion reasons) over the course of development, and Express made it easy to structure a clean layered backend.

**Why MongoDB?**
Transaction records aren't perfectly uniform (some fields like `detectedAt` or `investigation` are only populated conditionally), and MongoDB's document model handles that more naturally than forcing a rigid relational schema. Aggregation pipelines also made the dashboard statistics straightforward without pulling all data into the app layer.

**Why React?**
Component reusability (badges, tables, stat cards used across many pages) and a mature ecosystem (React Router, Recharts) for exactly the kind of dashboard-heavy app this is.

**Why Node.js / Express?**
Non-blocking I/O suits an API that's mostly waiting on database calls, and Express's middleware model mapped cleanly onto the layers I needed: auth, validation, authorization, then business logic.

**Explain your architecture.**
Layered MVC-ish: routes define endpoints and attach middleware (auth, role checks, validation), controllers handle request/response and call into a services layer for business logic like fraud scoring and notifications, and Mongoose models own schema and persistence. Errors thrown anywhere bubble up to one centralized error handler.

**Explain the request-response flow.**
A request hits Express → CORS/Helmet/rate-limiting middleware → JSON body parsing → mongo-sanitize → the route's validator chain (express-validator) → `protect` (verifies JWT, loads user) → `authorize(...)` (checks role) → the controller (wrapped in `asyncHandler` so rejected promises route to the error handler) → often a service function → a Mongoose model call → response sent as `{success, message, data}`.

**Explain JWT authentication.**
On login, the server verifies the password hash and signs a JWT containing the user's id and role, signed with a server-side secret and given an expiry. The client stores it and sends it as a Bearer token on every request. The server verifies the signature and expiry on each request — no server-side session state is needed, which is why logout is essentially a client-side action (clearing the token) plus an audit log entry.

**Explain password hashing.**
Passwords are hashed with bcrypt (cost factor 12) in a Mongoose pre-save hook, so plaintext never touches the database. Login compares the submitted password against the hash with `bcrypt.compare`, which is designed to be slow enough to resist brute-forcing but fast enough for normal login latency.

**Explain middleware.**
Functions that run between the incoming request and the final handler, each able to inspect/modify the request or short-circuit it. I use middleware for cross-cutting concerns — auth, authorization, validation, error handling — so controllers stay focused purely on business logic.

**Explain role-based authorization.**
Every protected route optionally chains an `authorize(...roles)` middleware after `protect`. It checks `req.user.role` against an allow-list and throws a 403 if the user's role isn't permitted — enforced on the server regardless of what the UI shows, which is the only place authorization actually matters.

**Explain CRUD.**
Create/Read/Update/Delete — the four basic data operations. Transactions and investigations both implement full CRUD (with delete restricted to admins for transactions), each backed by a Mongoose model and validated input.

**Explain your database schema.**
Five collections: User, Transaction, Investigation, Notification, AuditLog — with references (not embedding) between them so, for example, an investigation's `relatedTransactions` array holds ObjectId references rather than duplicating transaction data, keeping each collection as the single source of truth for its entity.

**Explain your fraud detection algorithm.**
It's a deterministic rule-based scorer, not ML. Seven rules each add points to a running score (0–100) based on the transaction and the sender account's recent history — large amounts, high transaction velocity, funds fanning out to many accounts quickly, repeated transfers to the same receiver, an unfamiliar location, links to accounts with confirmed prior fraud, and round-number "structuring" amounts. The total determines a risk level (Low/Medium/High/Critical) and whether the transaction gets auto-flagged.

**How is the risk score calculated?**
Each rule independently evaluates the transaction against its own threshold and, if triggered, adds a fixed point value; the points sum and are capped at 100. This makes the score explainable — every point is traceable to a specific reason, which is stored alongside the score (`suspicionReasons`) so investigators can see exactly why something was flagged.

**How would you prevent fraud detection rules from becoming slow?**
Right now each transaction triggers a few indexed queries against the sender's recent history (bounded by time windows and a `.limit()`), which keeps it fast even as the collection grows, since the compound index on `(senderAccount, occurredAt)` makes those lookups efficient. At larger scale I'd cache a rolling per-account summary (transaction count/velocity in the last N minutes) instead of querying raw history every time, and could move scoring to a background queue if it ever needed to be fully asynchronous.

**How did you implement pagination?**
Standard skip/limit with `page` and `limit` query parameters, validated and capped (max 100 per page) server-side, with the total count returned via a parallel `countDocuments()` call so the frontend can compute total pages without a second round trip.

**Why use server-side filtering?**
Loading the entire transaction collection into the browser to filter client-side doesn't scale past a few hundred records and leaks more data than a given user's role should see. Server-side filtering with proper indexes keeps response payloads small and lets MongoDB do what it's good at.

**How did you secure the API?**
Bcrypt hashing, JWT auth, server-enforced role checks, Helmet security headers, CORS locked to the known frontend origin, rate limiting on all API routes, input sanitization against NoSQL injection, and server-side validation on every mutating endpoint — plus generic error messages in production so internal details never leak.

**What happens if MongoDB goes down?**
Mongoose connection error/disconnect events are logged; in-flight requests would fail and surface as 500s through the central error handler (with details hidden in production). For production resilience I'd add retry/backoff on the connection and consider a read replica, but that's flagged as a future improvement here rather than implemented.

**How would you scale the application?**
Horizontally scale the stateless Express API behind a load balancer (JWT auth means no sticky sessions needed), move to MongoDB Atlas with proper replica sets/sharding as data grows, add Redis caching for the dashboard aggregation queries, and move fraud scoring to a background worker queue if synchronous scoring ever became a bottleneck.

**How would you add machine learning later?**
Because `evaluateTransaction()` has a fixed contract (transaction in, `{riskScore, riskLevel, suspicionReasons}` out), I'd build a feature vector from the same transaction/account history data already being queried, train a model (likely a gradient-boosted classifier) offline, and either port it to a Node-compatible format (ONNX) or call out to a small Python inference service — swapping the internals of that one function without touching controllers, routes, or the frontend.

**What was the hardest part?**
Designing the fraud rules so they were meaningful without a real historical fraud dataset to train against — I had to reason from first principles about what patterns (velocity, fan-out, structuring) are actually indicative of fraud in the literature, then validate the scoring felt right against the seeded data.

**What would you improve?**
Move the rule thresholds out of code and into an admin-editable configuration collection, add WebSocket-based real-time notifications instead of polling, and add proper integration tests that don't depend on downloading a MongoDB binary at test time (e.g. a pre-pulled Docker image in CI).

**What did you personally learn?**
How to structure a non-trivial Express API so business logic (the fraud engine, notification fan-out) stays separate from HTTP concerns, why aggregation pipelines beat pulling data into application code for reporting, and how much authorization logic actually needs to live on the server versus the client.

**What would you do differently in version 2?**
Start with the admin-configurable rules engine from day one rather than hardcoded constants, add WebSockets for notifications instead of polling, and set up Docker + CI from the start rather than retrofitting it.
