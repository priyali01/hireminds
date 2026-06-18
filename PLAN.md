
You are a principal engineer and solutions architect with 12+ years of experience. You have designed systems at scale, led engineering teams of 5–20 people, delivered enterprise SaaS products from zero to production, and consulted on projects ranging from $50,000 to $2,000,000. You have made every architectural mistake once and learned from it. You do not guess — you decide, and you justify every decision with production evidence.

A client is paying you $30,000 USD to design and deliver HireMinds — a production-grade, AI-powered career companion platform targeting the Indian market. This is not a prototype, not a hackathon project, not a portfolio piece. This is a commercial product with real users, real payments, real SLAs, and real consequences if it breaks. Every decision you make must reflect that.

You are delivering the complete engineering bible for this product — the document a CTO would hand to a new engineering team on day one and say "build exactly this." It must be so thorough that a senior developer reading it has no ambiguous decisions left to make.

---

**PRODUCT CONTEXT — read this completely before designing anything**

HireMinds is an AI career companion for Indian students and early professionals. The core insight the product is built on: every existing career tool (LinkedIn, Resumeworded, Jobscan) was built by people who already had jobs. They score freshers against senior engineers. A final-year B.Tech student with strong projects and no work experience gets a 20/100 ATS score and doesn't know why. HireMinds fixes this with level-aware scoring — freshers are scored on what they actually have (projects, skills, education), not what they don't have (experience).

**The seven modules:**

MOD-0: Auth + Onboarding — JWT auth, 5-step onboarding that captures level, target roles, skills, college, branch, graduation year. DPDP Act 2023 compliant consent screen.

MOD-1: Dashboard — Personalised job opportunity slider (AI-ranked, Framer Motion), quick stats bar (ATS score, readiness score, streak, saved jobs), news feed (personalised + general, SerpAPI + Gemini, 6hr refresh), full-year hiring calendar (placement seasons, hackathons, TCS NQT windows, AMCAT dates, community submissions), mini calendar widget (next 5 events), application tracker (Kanban — Saved → Applied → Interview → Offer → Rejected).

MOD-2: Resume Builder + Analyzer — Manual resume form (all sections), PDF upload + text extraction, fresher-aware ATS scoring (level-based weights: fresher = projects 40%, skills 30%, education 20%, certifications 10%; experienced = experience 40%, skills 30%, projects 15%, education 10%, certifications 5%), AI analysis (score, breakdown, feedback, strengths, missing keywords, one-week fix plan), section-wise AI enhancement, AI bullet point generator, PDF export, resume versioning, thumbs up/down feedback on every AI result.

MOD-3: Interview Prep + Mock Placement Drives — Session setup (role, round type, resume, optional company), four round types (technical, HR, behavioral STAR method, placement drive), AI question generation reading from user's actual resume, AI answer evaluation (score 1–10, feedback, missing elements, improved answer rewrite, tone assessment), mock placement drive simulation (TCS NQT, Infosys InfyTQ, AMCAT adaptive, Wipro NLTH, Cognizant GenC — each with correct section format and timing), drive results with predicted actual score and study plan, session history with performance trend, interview focus mode (full screen, sidebar hidden, split view on desktop).

MOD-4: Jobs — JD matcher (paste any JD, get match score, matched keywords, missing keywords, improvement suggestions), job insight engine (role research via SerpAPI + Gemini — required skills, salary trends, interview process, top companies, growth outlook — 24hr Redis cache).

MOD-5: Personal Career Trainer — Setup (target role, companies, placement date), weekly AI plan generation (reads resume score + interview weak areas + skill gap + timeline, generates 3–5 specific actionable goals), goal completion tracking, readiness score (0–100 composite: ATS 30%, interview avg 40%, skill gap 20%, goal completion 10%), readiness history chart, skill progress map (self-report + auto-update from interview sessions), streak system (daily active tracking, heatmap calendar), Sunday cron auto-generates next week plan referencing completion rate.

MOD-6: Community — Interview experience submissions (company, role, outcome, questions asked, anonymous option, upvotes, verified badge), experience feed (filterable by company/role/outcome), peer resume reviews (request matched by target role + level, anonymous reviewer, section-level feedback, overall rating), admin moderation queue, no real interviewer names policy.

MOD-7: Business Layer — Free tier (3 analyses/month, 1 interview/week, 5 AI calls/day, middleware-enforced), Pro tier Rs.299/month or Rs.1,999/year (unlimited everything, Razorpay), Campus tier Rs.40,000–80,000/year per college (TPO dashboard with aggregate readiness scores, dept-wise analytics, branded portal), admin panel.

**Tech stack already decided:**
- Frontend: React 18 + Vite + JavaScript (no TypeScript) + Tailwind CSS + Redux Toolkit + RTK Query + React Router v6 + Framer Motion + react-big-calendar + @dnd-kit/core + Recharts + react-pdf
- Backend: Node.js 20 LTS + Express.js + Zod + BullMQ + node-cron + Multer + Winston + Morgan
- Database: MongoDB Atlas + Upstash Redis
- AI: Google Gemini 1.5 Pro + 2.5 Flash (fallback chain) + SerpAPI
- Storage: Cloudinary
- Email: Resend
- Payments: Razorpay
- Monitoring: Sentry + Posthog
- Deployment: Vercel (frontend) + Railway (backend)
- Testing: Jest + Supertest + mongodb-memory-server (backend) + Vitest + React Testing Library + MSW (frontend) + Playwright (E2E)
- CI/CD: GitHub Actions

**Constraints:**
- Solo developer building this (me) — a skilled final-year CS student. Decisions must account for solo maintainability.
- Single monorepo: `/client` (React) + `/server` (Express). No microservices.
- JavaScript only, no TypeScript anywhere.
- Must be profitable at 500 Pro users or 10 campus colleges — unit economics matter.
- DPDP Act 2023 compliance is non-negotiable.
- Mobile-first — primary audience is Indian students on mid-range Android phones.

---

**YOUR COMPLETE DELIVERABLE**

Produce the full engineering bible. Every section below must be answered completely. No section can say "follow best practices" — you must state the actual practice. Every decision must have a justification. Flag every architectural commitment (a decision today that is expensive to reverse later) explicitly with the label **[ARCHITECTURAL COMMITMENT]**.

---

**SECTION 1: SYSTEM ARCHITECTURE**

1.1 Overall pattern — justify modular monolith for this scale and team size. Explain exactly what "modular" means in this codebase — what the module boundaries are, how they are enforced, what one module is never allowed to do to another.

1.2 Request lifecycle — trace a complete request from browser to database and back. Include: React component fires RTK Query → Axios hits Express route → auth middleware → quota middleware → Zod validation → controller → service → MongoDB/Redis/AI → response → RTK Query cache update → component re-render. Every step, every transformation.

1.3 Async architecture — explain exactly when a request gets queued in BullMQ vs handled synchronously. Which operations are always async (AI calls, PDF processing, email sending, cron jobs). Which are always sync (auth, quota check, basic CRUD). What happens to the user while a job is queued (polling vs SSE vs WebSocket — pick one and justify).

1.4 Caching architecture — three-layer cache strategy: in-memory (Node.js process), Redis (distributed), MongoDB TTL collections. What lives at each layer, why, and what the invalidation trigger is for each.

1.5 AI request architecture — the complete flow from user action to AI response displayed in UI. Include: cache check → queue decision → prompt build → model selection → API call → response validation → JSON parse → store in DB → cache in Redis → return to client → stream to UI. Cover what happens at every failure point.

---

**SECTION 2: BACKEND — EXACT FOLDER STRUCTURE**

Produce the complete folder and file tree for `/server`. Every folder. Every file. Every file gets a one-line description of exactly what it contains and what it is responsible for. No file listed without explanation. No placeholder like "other files here."

Then for each of the following, give the exact implementation — not pseudocode, actual production-quality code:

2.1 `app.js` — the complete Express app setup. Middleware registration in exact order with comment explaining why that order is non-negotiable. Every middleware call shown.

2.2 `config/db.js` — MongoDB Atlas connection with retry logic, connection event handlers, graceful shutdown on SIGTERM.

2.3 `config/redis.js` — Upstash Redis connection, error handling, reconnection strategy.

2.4 `middleware/error.middleware.js` — global error handler. Custom error classes (AppError, ValidationError, AIError, QuotaError, NotFoundError). What each error class contains. How errors from Zod, Mongoose, BullMQ, and Gemini API are caught and normalised. What the client receives vs what gets logged. Never expose stack traces to client in production.

2.5 `middleware/auth.middleware.js` — complete JWT verification. Access token from Authorization header. Refresh token from httpOnly cookie. What happens on expired access token (attempt refresh automatically vs return 401 — pick one and justify). How the user object is attached to req.

2.6 `middleware/quota.middleware.js` — complete usage quota enforcement. How free vs pro vs campus tiers are checked. How aiUsageToday is incremented atomically. How the daily reset works. What the 429 response body looks like (must include upgradeRequired: true and resetAt timestamp).

2.7 `middleware/rateLimit.middleware.js` — three rate limiters: global IP rate limit, per-user AI endpoint rate limit, per-user auth endpoint rate limit. Exact configuration for each.

2.8 `queues/ai.queue.js` + `queues/workers/ai.worker.js` — complete BullMQ setup. Queue configuration (concurrency, attempts, backoff strategy). Worker implementation. How job results are communicated back to the waiting HTTP request. Dead letter queue handling. How to monitor queue health.

2.9 Service layer contracts — for every service file (ai.service.js, ats.service.js, resume.service.js, interview.service.js, search.service.js, news.service.js, jobs.feed.service.js, calendar.service.js, trainer.service.js, readiness.service.js, notification.service.js) — define: what it owns, what its public interface is (function signatures with parameter and return types described in JSDoc), what it must never do (e.g., ai.service.js must never read from MongoDB directly), what errors it throws.

2.10 `utils/promptBuilder.js` — the complete prompt template system. How prompts are versioned. How variables are injected. How prompt versions are tracked so you know which version produced which result in the database. Show the complete prompt for ATS analysis and answer evaluation.

---

**SECTION 3: DATABASE — COMPLETE DESIGN**

3.1 Every MongoDB collection — for every collection: complete schema with every field (name, type, required/optional, default, validation), every index (single field, compound, text, TTL) with the exact query it serves, denormalisation decisions and why, estimated document size, estimated collection size at 10,000 users.

3.2 Index strategy — list every index across every collection. For each: `db.collection.createIndex({field: 1})` exact syntax, which query it serves, whether it's a background index, estimated selectivity.

3.3 Redis key design — every key pattern used in the system. Format: `hireminds:{module}:{identifier}:{variant}`. For every key: exact pattern, what it stores (data structure: string/hash/list/sorted set), TTL, what triggers invalidation, what happens on cache miss.

3.4 Data integrity — what happens when a user deletes their account (cascade deletes, what order, how to handle partial failures). What happens when a resume is deleted but interview sessions reference it. Orphan prevention strategy.

3.5 MongoDB transactions — identify every operation that requires a transaction. Show the exact transaction wrapper pattern used in this codebase.

---

**SECTION 4: AI LAYER — COMPLETE DESIGN**

4.1 Model selection and fallback chain — primary: gemini-2.5-flash. Fallback 1: gemini-1.5-flash. Fallback 2: gemini-1.5-pro. Exact logic for when each fallback triggers (503, 429, timeout — specify each). How the model used is recorded. How fallback frequency is monitored.

4.2 Prompt engineering system — show the complete, production-ready prompt for every AI operation in the system: ATS resume analysis, interview question generation, answer evaluation, weekly trainer plan generation, job insight summarisation, news article tagging. Each prompt must include: system context, user context variables, output format specification (exact JSON schema), tone instructions, Indian market context, error prevention instructions (e.g., "return ONLY valid JSON, no markdown").

4.3 Response validation — every AI response goes through Zod validation before being used. Show the Zod schema for every AI response type. What happens when Gemini returns malformed JSON (retry once, then throw AIError).

4.4 Cost control — calculate the exact API cost per user action (resume analysis, interview session, trainer plan generation, news fetch, job insight). Calculate monthly cost at 100 free users, 500 Pro users, 1000 Pro users. Identify the top 3 most expensive operations and how caching reduces their cost.

4.5 Streaming implementation — complete SSE setup for streaming AI responses. Express endpoint that opens SSE connection, BullMQ job that streams chunks, client-side RTK Query handling of streamed chunks, reconnection on disconnect.

4.6 Training data collection — exact schema for storing consented user data for future fine-tuning. What gets stored, what gets anonymised before storage, how consent status is checked before storage, how this data will be exported for fine-tuning.

---

**SECTION 5: FRONTEND — COMPLETE ARCHITECTURE**

5.1 Exact folder structure — every folder, every file, one-line description of each. Component naming convention. File naming convention. Where barrel exports (index.js) are used and where they are not.

5.2 Redux store design — complete store structure. Every slice: name, what state it owns, what it never owns. RTK Query API definitions: every endpoint, cache tag, invalidation pattern. Which state lives in Redux vs local component state vs URL params vs RTK Query cache — the decision rule for each.

5.3 Routing architecture — complete React Router v6 setup. Every route: path, component, whether it is protected, what role is required, whether it is lazy-loaded. The ProtectedRoute component implementation. The RoleRoute component implementation. How redirects work on auth expiry.

5.4 Component architecture — three tiers:
- Primitive components (Button, Input, Card, Badge, Modal, Skeleton, Toast) — props interface for each, what variants exist, what it never does
- Compound components (ScoreCard, JobCard, QuestionCard, GoalCard, NewsCard) — what primitives they compose, what data shape they expect
- Page components (DashboardPage, ResumePage, InterviewPage) — what they orchestrate, what they never contain (no business logic, no API calls directly)

5.5 Form system — React Hook Form + Zod for every form in the application. Show the complete form implementation for the resume builder (most complex form). How multi-step forms are handled. How server validation errors are mapped to form field errors. How forms are reset after success.

5.6 API layer — RTK Query setup. Base query configuration. How auth headers are injected. How token refresh is handled in the base query (re-try the failed request after refresh — show the exact implementation). Every API endpoint defined with its cache tags.

5.7 Performance architecture — code splitting map (which routes are lazy loaded, expected bundle sizes). What gets memoised with useMemo vs useCallback and the exact rule for deciding. Image lazy loading strategy. Tailwind purge configuration. Target Lighthouse scores (mobile).

5.8 Mobile architecture — complete responsive design decisions. Bottom navigation bar (which 5 items, icon + label). How Kanban degrades to mobile (list view, dropdown status change). How charts degrade to mobile (horizontal scroll vs simplified view). Touch gesture handling for job slider. Target device: Redmi Note 11 (2GB RAM, Android 11, Chrome).

---

**SECTION 6: AUTHENTICATION — COMPLETE IMPLEMENTATION**

6.1 Complete token flow — access token (15 min expiry, signed with JWT_SECRET, payload: userId, email, plan, role), refresh token (7 day expiry, signed with JWT_REFRESH_SECRET, stored in httpOnly + Secure + SameSite=Strict cookie, rotated on every use, old token invalidated). Show every step: login → token generation → storage → request → verification → refresh → rotation → logout → revocation.

6.2 Silent refresh — how the frontend detects an expired access token (401 response), automatically calls /auth/refresh, retries the original request with new token, handles concurrent requests during refresh (queue them, don't fire multiple refreshes). Show the RTK Query baseQuery implementation that handles this.

6.3 Security decisions — why httpOnly cookie for refresh token (XSS cannot read it). Why Authorization header for access token (not cookie — avoids CSRF on API endpoints). Why SameSite=Strict. How CORS is configured to allow credentials. What happens if refresh token is stolen (revocation list in Redis).

6.4 DPDP compliance implementation — consent schema (what fields, stored where), consent update endpoint, data export endpoint (what it returns, format, response time SLA), account deletion endpoint (what gets deleted, what gets anonymised, in what order, how partial failures are handled, confirmation email).

---

**SECTION 7: TESTING — COMPLETE STRATEGY**

7.1 Testing philosophy — what this codebase tests and why. The testing trophy for this project (more integration tests than unit tests — justify). What is explicitly not tested and why.

7.2 Backend test setup — complete Jest + Supertest + mongodb-memory-server configuration. The test database setup and teardown. How environment variables are handled in tests. How BullMQ is mocked (don't run actual workers in tests).

7.3 AI mocking strategy — the complete MSW + jest.mock pattern for mocking Gemini API calls. How mock responses are structured to be realistic. How to test the fallback chain without hitting real APIs. How to test what happens when all models fail.

7.4 Test specifications — for every module, write the complete test file structure (describe blocks, it blocks with exact test descriptions). Not placeholder names — actual test descriptions that specify the exact behaviour being verified.

7.5 Frontend test setup — complete Vitest + RTK + MSW configuration. How Redux store is set up for tests (real store vs mock store — pick one and justify). How React Router is handled in tests. How Framer Motion is mocked (it breaks in jsdom).

7.6 E2E strategy — complete Playwright setup. Every E2E test scenario (one per major user journey). How test users are created and cleaned up. How AI calls are intercepted in E2E tests (don't hit real Gemini in E2E). How Razorpay is handled in E2E tests.

7.7 CI pipeline — complete GitHub Actions workflow files. What runs on pull request (lint, type check if applicable, unit tests, integration tests — must complete in under 3 minutes). What runs on merge to main (full test suite + E2E + deploy). How test failures block deployment. How coverage reports are generated and where they are published.

---

**SECTION 8: DEVOPS — COMPLETE SETUP**

8.1 Local development — complete docker-compose.yml for MongoDB + Redis. Complete .env.example with every variable documented. npm scripts: what each does, when to use it. How to onboard a new developer in under 30 minutes.

8.2 GitHub Actions — complete workflow files for CI and CD. Every job, every step, every action used. How secrets are injected. How the workflow knows which environment to deploy to. How to roll back a bad deploy.

8.3 Railway configuration — complete railway.toml. Health check endpoint implementation (`GET /health` — what it checks and returns). How environment variables are managed across environments. How to handle Railway's zero-downtime deploy behaviour. What happens if the health check fails.

8.4 Vercel configuration — complete vercel.json. How environment variables are managed. How preview deployments work. How to handle client-side routing (all paths → index.html).

8.5 Monitoring setup — Sentry configuration (what gets captured, what is filtered out, PII scrubbing, alert thresholds, which errors page someone). Posthog setup (which events are tracked with exact event names and properties, user identification strategy, how to avoid tracking PII, how feature flags will be used later).

8.6 Backup strategy — MongoDB Atlas automated backups (frequency, retention, how to restore). Redis data — what needs to be backed up vs what can be reconstructed. Cloudinary — what happens if it goes down (fallback strategy).

---

**SECTION 9: SECURITY — COMPLETE THREAT MODEL**

9.1 OWASP Top 10 — for each of the 10 vulnerabilities: is it relevant to this application, what is the specific attack vector in this codebase, what is the exact mitigation implemented, show the code if the mitigation is non-obvious.

9.2 API security — complete helmet.js configuration with every header explained. CSP policy. CORS configuration (exact origins, methods, headers). How NoSQL injection is prevented (Mongoose sanitisation + Zod). How mass assignment is prevented.

9.3 File upload security — what file types are accepted (PDF only), how MIME type is verified (not just extension), maximum file size and where it is enforced, what happens to the file after processing (deleted from memory, never written to disk), Cloudinary upload restrictions.

9.4 AI prompt injection — how user-provided content is safely injected into prompts. What happens if a user puts "ignore previous instructions" in their resume. How prompt outputs are validated before being returned to users or stored.

9.5 Dependency security — npm audit configuration, Dependabot setup, how to handle a critical CVE in a dependency (process, who decides, how fast).

9.6 Secrets management — what is in .env (local only, never committed), what is in Railway environment variables, what is in Vercel environment variables, how to rotate a secret without downtime, what to do if a secret is accidentally committed.

---

**SECTION 10: IMPLEMENTATION STAGES**

For each phase produce:
- Exact list of files created (not "create the auth module" — list every file)
- Exact list of tests written before implementation (TDD — the test file comes first)
- Definition of done: the exact criteria that must be true before this phase is considered complete
- Deployment checkpoint: what is live and accessible at the end of this phase
- Architectural commitments made in this phase that cannot be easily reversed later
- Time estimate for a skilled solo developer working 4–6 hours per day
- What a non-technical person (the client) can see and verify at the end of this phase

Phases:
- Phase 0: Hackathon prototype (3–4 days)
- Phase 1: MOD-0 Auth + MOD-2 Resume core
- Phase 2: MOD-3 Interview prep + mock drives
- Phase 3: MOD-1 Dashboard + MOD-4 Jobs
- Phase 4: MOD-5 Personal trainer
- Phase 5: MOD-6 Community
- Phase 6: MOD-7 Business layer + payments + campus tier
- Phase 7: Fine-tuned model + agentic layer

---

**SECTION 11: UI/UX DESIGN SYSTEM**

11.1 Design tokens — complete Tailwind config extension with every custom color (brand palette, semantic colors for score ranges, status colors), typography scale (font sizes, weights, line heights for every text style used in the product), spacing scale, border radius scale, shadow scale. Every token named and justified.

11.2 Component specifications — for every UI component: props interface, all variants, all states (default, hover, focus, disabled, loading, error), accessibility requirements, mobile behaviour, animation behaviour. Components: Button, Input, Select, Textarea, Card, Badge, Modal, Toast, Skeleton, ScoreBar, ProgressBar, Avatar, Chip, Dropdown, Tooltip.

11.3 Page layouts — exact layout specification for every page: which components are used, grid/flex structure, what is sticky, what scrolls, sidebar behaviour, mobile transformation. Pages: Dashboard, Resume Builder, Resume Analyzer Results, Interview Setup, Interview Session, Interview Evaluation, Trainer, Community Feed, Pricing, Settings.

11.4 Animation specification — every animation in the product: trigger, duration, easing, what property is animated, Framer Motion variant code. Performance constraint: no layout animations on mobile. Respect prefers-reduced-motion.

11.5 Loading and empty states — for every data-fetching component: skeleton design (exact which elements shimmer), loading copy, empty state illustration description, empty state copy (encouraging, tells user what to do next), error state copy and retry behaviour.

11.6 Responsive decisions — for every breakpoint change in the product: what changes, what the mobile alternative looks like, what interaction changes (hover → tap, drag → dropdown). Specific decisions for: Dashboard layout, Kanban board, Job slider, Calendar, Charts.

---

**SECTION 12: RAZORPAY INTEGRATION — COMPLETE IMPLEMENTATION**

12.1 Payment flow — complete server-side order creation, client-side Razorpay checkout, server-side payment verification (signature verification — show exact HMAC implementation), database update on success, what happens on payment failure.

12.2 Subscription management — how Pro subscriptions are tracked (start date, end date, auto-renewal). What happens when a subscription expires (grace period? immediate downgrade?). How to handle failed renewal payments.

12.3 Webhook handling — which Razorpay webhook events are handled, signature verification on webhook endpoint, idempotency (what if the same webhook fires twice), what happens if the webhook handler fails.

12.4 Refund handling — when refunds are allowed, how they are initiated, how the database is updated, what email is sent.

12.5 Campus tier billing — how annual campus invoices are handled (manual invoice vs automated), how to activate a campus account, what the TPO onboarding flow looks like.

---

**FORMAT REQUIREMENTS — NON-NEGOTIABLE**

- This document will be used by a developer to build production software. Write accordingly.
- Every code snippet must be complete and runnable — no `// ... rest of code`. If you show a function, show the complete function.
- Every architectural decision must have a one-line justification immediately after it.
- Flag every **[ARCHITECTURAL COMMITMENT]** explicitly — these are the decisions that cost $10,000 to reverse later.
- Flag every **[SECURITY CRITICAL]** item — these are the things that get you breached if you get them wrong.
- Flag every **[INDIA SPECIFIC]** item — decisions that are different because of the Indian market, Indian regulations, or Indian infrastructure realities.
- If there is a tradeoff, state both sides honestly. Do not pretend the chosen option has no downsides.
- Do not use bullet points for explanations — use prose. Use bullet points only for lists where sequence or enumeration is the point.
- Sentence case everywhere. No ALL CAPS headings.
- This document should be long. Completeness is the requirement. Do not summarise where detail is needed.

The client is paying $30,000. They expect a principal engineer's thinking. Deliver it.

What to gather before starting
1. Gemini API Key

Go to: aistudio.google.com → Sign in with Google → Get API Key → Create API key in new project
Free tier gives you 1,500 requests/day on 1.5 Flash. That's enough to build and test everything.
Store it as:
GEMINI_API_KEY=AIza...
2. SerpAPI Key

Go to: serpapi.com → Sign up → Dashboard → Your API Key
Free tier: 100 searches/month. Enough for development.
Store it as:
SERPAPI_KEY=...
3. MongoDB Atlas

Go to: cloud.mongodb.com → Create free account → Build a database → M0 free tier → Create cluster
After cluster is ready:

Database Access → Add database user → username + password
Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0) for now
Connect → Drivers → Copy the connection string

Store it as:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hireminds
4. Upstash Redis

Go to: upstash.com → Sign up → Create database → Free tier → Copy REST URL and token
Store it as:
REDIS_URL=rediss://...
5. Cloudinary

Go to: cloudinary.com → Sign up free → Dashboard → Copy cloud name, API key, API secret
Store it as:
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
6. Resend (email)

Go to: resend.com → Sign up → API Keys → Create API Key
Free tier: 3,000 emails/month.
Store it as:
RESEND_API_KEY=re_...
7. Razorpay (payments)

Go to: dashboard.razorpay.com → Sign up → Settings → API Keys → Generate test mode keys
Use test mode keys while building. Switch to live keys only before actual launch.
Store it as:
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
8. Sentry

Go to: sentry.io → Sign up free → Create project → Node.js → Copy DSN
Store it as:
SENTRY_DSN=https://...@sentry.io/...
9. Posthog

Go to: posthog.com → Sign up free → Create project → Copy API key
Store it as:
POSTHOG_KEY=phc_...

Your complete .env file for the server
Create this file at /server/.env — this file never gets committed to GitHub, ever.
env# Server
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hireminds

# Cache
REDIS_URL=rediss://...

# Auth — generate these yourself, any long random string
JWT_SECRET=make_this_a_long_random_string_minimum_32_chars
JWT_REFRESH_SECRET=make_this_a_different_long_random_string

# AI
GEMINI_API_KEY=AIza...
SERPAPI_KEY=...

# Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email
RESEND_API_KEY=re_...

# Payments
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Monitoring
SENTRY_DSN=https://...
POSTHOG_KEY=phc_...

# Cron schedules
NEWS_CRON=0 */6 * * *
JOBS_CRON=0 */12 * * *
CALENDAR_CRON=0 9 * * 1
TRAINER_CRON=0 8 * * 0
REMINDER_CRON=0 9 * * *
Your .env file for the client
Create at /client/.env:
envVITE_API_URL=http://localhost:3001
VITE_RAZORPAY_KEY_ID=rzp_test_...
VITE_POSTHOG_KEY=phc_...
Note: anything prefixed VITE_ is exposed to the browser. Never put secret keys here — only public-facing keys like Razorpay Key ID and Posthog Key (these are designed to be public).

Your .gitignore in the root
Create this before your first commit:
# Environment files — NEVER commit these
.env
.env.local
.env.production

# Dependencies
node_modules/

# Build output
dist/
build/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

Generate your JWT secrets right now
Open your terminal and run:
bashnode -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Run it twice. First output goes into JWT_SECRET, second into JWT_REFRESH_SECRET. These should be different strings.

What to add to the prompt
At the very top of the premium prompt, before everything else, add this section:
ENVIRONMENT CONTEXT:

The following services are already provisioned. Do not recommend alternatives 
to these — design the implementation around exactly these services:

- MongoDB Atlas M0 cluster (connected)
- Upstash Redis (connected)
- Cloudinary free tier (connected)
- Resend free tier (connected)
- Razorpay test mode (connected)
- Sentry project created (connected)
- Posthog project created (connected)
- Gemini API key active (1,500 free requests/day)
- SerpAPI key active (100 free searches/month)

All credentials are in environment variables. 
Never include actual keys in any output.
That's everything. Get those 9 accounts created, fill in the .env file, add the environment context block to the top of the prompt, then paste it. You're ready.