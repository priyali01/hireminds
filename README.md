# HireMinds 🧠

**HireMinds** is a production-grade, AI-powered career companion platform designed specifically for the Indian job market. It leverages Google's Gemini AI to provide actionable resume feedback, level-aware ATS scoring, and keyword suggestions for candidates at various career stages.

Currently at **Phase 1** completion, the platform features a fully modular backend, secure authentication, user onboarding, and core resume analysis capabilities.

---

## 📸 Product Preview

Here is a glimpse into the HireMinds platform, showcasing our dynamic UI and core features:

### Secure Authentication & Onboarding
![Login Page](./client/public/visuals%20(14).png)
*A sleek, secure login portal featuring our AI companion robot, designed to give users a premium entry experience into their career journey.*

### Comprehensive Dashboard & Tracking
![Dashboard](./client/public/visuals%20(5).png)
*The central hub providing an at-a-glance view of the user's Interview Readiness, ATS Score, current streak, and recommended jobs.*

![Application Tracker](./client/public/visuals%20(10).png)
*Manage your job hunt and analyze your journey with the Application Tracker.*

![Leaderboard](./client/public/visuals%20(12).png)
*Climb the ranks by practicing interviews and uploading resumes, competing globally and on campus.*

### Personalized AI Career Coach
![AI Coach Chat](./client/public/visuals%20(1).png)
*A 24/7 available AI Career Coach powered by Gemini, offering tailored advice based on the candidate's resume, goals, and interview history.*

![AI Coach Feedback](./client/public/visuals%20(2).png)
*Context-aware suggestions and guidance for resume enhancement and interview preparation.*

### Mock Interview Simulator
![Interview Center](./client/public/visuals%20(11).png)
*The AI Interview Center tracks your placement readiness and highlights areas like DBMS and OS for improvement.*

![Mock Interview](./client/public/visuals%20(3).png)
*Real-time mock interview environment simulating technical and HR rounds, complete with timed questions to build pressure resilience.*

### Deep Resume Analysis
![Resume Upload](./client/public/visuals%20(4).png)
*Level-aware ATS scoring tailored for freshers—simply upload your PDF resume to get started.*

![Score Breakdown 1](./client/public/visuals%20(6).png)
![Score Breakdown 2](./client/public/visuals%20(7).png)
*Instant ATS scoring out of 100 with detailed section breakdowns for Skills, Projects, Education, and Experience.*

![Line-by-line Feedback](./client/public/visuals%20(8).png)
*Actionable, line-by-line feedback on the user's uploaded resume, highlighting missing metrics, weak verbs, and formatting issues.*

![Keywords & Fix Plan](./client/public/visuals%20(9).png)
*Identifies missing keywords (e.g., Docker, CI/CD) and generates a personalized one-week fix plan to improve the score.*

### Community Knowledge Hub
![Community Hub](./client/public/visuals%20(13).png)
*A collaborative space where students share interview experiences, placement tips, and company insights.*

---

## ✨ Comprehensive Feature Scope

HireMinds is being developed in modular phases. The complete system encompasses the following core modules:

### 🚀 Phase 1: Core Engine (Completed)
- **MOD-0: Secure Auth & Onboarding**: JWT authentication with rotating `httpOnly` refresh tokens, bcrypt hashing, and DPDP Act 2023 compliant data consent. 5-step onboarding capturing career level, target roles, and graduation timelines.
- **MOD-2: Resume Analyzer Engine**: Robust PDF parsing with text extraction. Features a fresher-aware ATS scoring algorithm (dynamically weighting projects over experience for students) and deep AI analysis via Gemini (identifies strengths, missing keywords, and generates a one-week fix plan).

### ⏳ Upcoming Phases
- **MOD-1: Dynamic Dashboard**: Personalized job opportunity slider, quick stats bar (ATS score, readiness, streak), news feed (SerpAPI + Gemini), full-year hiring calendar, and a Kanban application tracker.
- **MOD-3: Mock Interview Simulator**: 4 specialized round types (Technical, HR, STAR behavioral, Placement Drive). Reads the user's resume to generate context-aware questions. Realistic simulations of TCS NQT, Infosys InfyTQ, AMCAT, Wipro NLTH, and Cognizant GenC.
- **MOD-4: Intelligent Job Matcher**: JD analysis tool that matches candidate resumes against specific job descriptions, highlighting keyword gaps and required skills, enriched with real-time role research via SerpAPI.
- **MOD-5: Personal Career Trainer**: Weekly AI-generated actionable goals based on resume scores and interview weaknesses. Tracks goal completion and provides a daily streak heatmap calendar.
- **MOD-6: Community Hub**: Anonymous interview experience submissions with verified badges, peer resume reviews matched by target role, and an admin moderation queue.
- **MOD-7: Enterprise & Business Layer**: Tiered usage limits enforced via custom middleware, Razorpay subscription integration, and a dedicated Campus portal for Training & Placement Officers (TPO) with aggregate cohort analytics.

---

## 🏛️ System Architecture

HireMinds is built as a production-grade **Modular Monolith**, designed for high scalability and solo-maintainability without the overhead of microservices.

```mermaid
graph TD
    Client[React + Vite Frontend]
    API[Express API Server]
    Queue[BullMQ / Redis]
    Worker[Background Workers]
    DB[(MongoDB Atlas)]
    Cache[(Upstash Redis)]
    AI[Google Gemini AI]
    Ext[SerpAPI / Cloudinary / Resend]

    Client <-->|REST API| API
    Client <--|Server-Sent Events| API
    
    API <-->|Read / Write| DB
    API <-->|Cache layer| Cache
    API -->|Offload tasks| Queue
    
    Queue -->|Process Jobs| Worker
    Worker <-->|LLM Inference| AI
    Worker <-->|3rd Party APIs| Ext
    Worker -->|Update Status| DB
```

- **Asynchronous Processing Engine**: Heavy tasks (AI prompt execution, PDF parsing, email delivery) are completely decoupled from the HTTP request-response cycle using **BullMQ** and Redis.
- **Three-Layer Caching Strategy**: 
  - *In-Memory*: Fast local reads for configuration.
  - *Distributed (Upstash Redis)*: Caches API responses, job insights, and SerpAPI results.
  - *Database (MongoDB TTL)*: Ephemeral data and rate-limit tracking.
- **Resilient AI Layer**: Implements a robust **Gemini API Fallback Chain** (`2.5-flash` → `1.5-flash` → `1.5-pro`) to ensure high availability during rate limits (429) or timeouts. AI responses are strictly validated against **Zod** schemas before storage.
- **Real-Time Streaming**: Utilizes **Server-Sent Events (SSE)** to stream large AI analysis chunks directly to the UI, minimizing perceived latency for the user.
- **Security-First Approach**: Implements global IP rate limiting, per-user AI endpoint throttling, helmet.js headers, strict CORS, and NoSQL injection prevention.



---

## 🏗️ Folder Structure

```text
hireminds/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/               # Login, Register, Onboarding, Dashboard, Resume
│   │   ├── store/               # Redux Toolkit + RTK Query (silent refresh API)
│   │   ├── styles/              # Component-specific CSS
│   │   ├── index.css            # Tailwind directives & CSS Design Tokens
│   │   ├── App.jsx              # React Router v6 (Protected/Public routes)
│   │   └── main.jsx             # React entry point
│   └── .env.example             # Client environment template
├── server/                      # Node.js Backend (Express)
│   ├── config/                  # DB connection and graceful shutdown
│   ├── controllers/             # Express route handlers
│   ├── middleware/              # Auth (JWT) & Error handling
│   ├── models/                  # Mongoose schemas (User, Resume)
│   ├── routes/                  # API route definitions
│   ├── services/                # Business logic & AI Integration
│   ├── tests/                   # Jest test suites (Unit & Integration)
│   ├── utils/                   # Custom error classes & Winston logger
│   ├── validators/              # Zod validation schemas
│   ├── index.js                 # Entry point (connects DB then starts app)
│   ├── app.js                   # Express app configuration
│   └── .env.example             # Backend environment template
└── README.md                    # Project documentation
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Redux Toolkit (RTK Query), Tailwind CSS v3, Framer Motion, React Hook Form, Recharts, react-pdf.
- **Backend**: Node.js 20 LTS, Express 5, Zod, BullMQ, node-cron, Multer, Winston.
- **Database & Cache**: MongoDB Atlas (Mongoose), Upstash Redis.
- **AI & External APIs**: Google Generative AI (Gemini SDK), SerpAPI.
- **Infrastructure**: Cloudinary (Storage), Resend (Email), Razorpay (Payments).
- **Monitoring & Deployment**: Sentry, Posthog, Vercel (Frontend), Railway (Backend).
- **Testing**: Jest, Supertest, MongoDB Memory Server (Backend), Vitest, React Testing Library, Playwright (Frontend E2E).

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A **Google Gemini API Key** (Get it from [Google AI Studio](https://aistudio.google.com/))
- A **MongoDB** database (Local instance or [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database))

### 2. Quick Setup (Root Level)

We have configured root-level scripts so you can install and run the entire application concurrently from the main project folder.

1. **Install all dependencies** (Installs root, server, and client packages):
   ```bash
   npm run install:all
   ```
2. **Environment Variables**:
   - Navigate to the `server/` directory and copy `.env.example` to `.env`. Update your MongoDB URI, JWT Secrets, and Gemini API Key.
   - Navigate to the `client/` directory and copy `.env.example` to `.env`.
3. **Start the Application**:
   ```bash
   npm run dev
   ```
   *This command runs both the Node/Express backend (`http://localhost:3001`) and the Vite/React frontend (`http://localhost:5173`) concurrently.*

## 🧪 Running Tests

The backend is fully tested using a TDD approach. To run the test suite:

```bash
cd server
npm test
```
*Note: The tests use `mongodb-memory-server` and do not require a running MongoDB instance.*

---

## 📅 Roadmap

- **Phase 1 (Completed)**: Core Authentication, User Onboarding, and Resume Analysis (MOD-0 & MOD-2).
- **Phase 2**: Interview Prep & Mock Placement Drives (MOD-3). Simulation of TCS NQT, Infosys InfyTQ, AMCAT, Wipro NLTH, Cognizant GenC formats.
- **Phase 3**: Job Matcher & Dashboard Enhancements (MOD-1 & MOD-4).
- **Phase 4**: Personal Trainer (MOD-5).
- **Phase 5**: Community Hub (MOD-6).
- **Phase 6**: Business layer, Payments, and Campus tier (MOD-7).
- **Phase 7**: Fine-tuned custom models and agentic workflow layer.
