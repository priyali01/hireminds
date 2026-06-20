# HireMinds 🧠

**HireMinds** is a production-grade, AI-powered career companion platform designed specifically for the Indian job market. It leverages Google's Gemini AI to provide actionable resume feedback, level-aware ATS scoring, and keyword suggestions for candidates at various career stages.

Currently at **Phase 1** completion, the platform features a fully modular backend, secure authentication, user onboarding, and core resume analysis capabilities.

---

## ✨ Features (Phase 1)

- **🔐 Secure Authentication**: JWT-based auth with `httpOnly` refresh token rotation (bcrypt-hashed storage) and DPDP Act 2023 consent tracking.
- **🎯 Level-Aware Scoring**: Resume analysis weights are tailored to the candidate's career stage (Fresher, Intermediate, Experienced). For example, freshers are scored heavily on projects and skills rather than professional experience.
- **📄 Robust PDF Parsing**: Automatic text extraction from PDF resumes.
- **🤖 Gemini AI Fallback Chain**: Deep analysis using Google's Generative AI. Features a robust fallback chain (`gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-1.5-pro`) to ensure high availability.
- **📊 Detailed Score Breakdown**: Visual scores for Skills, Projects, Education, and Experience.
- **💡 Actionable Insights**: Returns specific strengths, a one-week fix plan, and missing keywords focused on the Indian job market.
- **🎨 Premium UI**: A clean, dynamic interface built with React 18, Tailwind CSS v3, and Framer Motion. Features a dark mode design system, glassmorphism aesthetics, responsive layouts, and interactive dashboard previews.
- **🧪 Test-Driven (TDD)**: The backend is covered by a comprehensive suite of unit and integration tests (58/58 passing) using Jest, Supertest, and `mongodb-memory-server`.

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

- **Frontend**: React 18, Vite, React Router v6, Redux Toolkit (RTK Query), Tailwind CSS v3, Framer Motion, React Hook Form.
- **Backend**: Node.js, Express 5, MongoDB (Mongoose), Zod, Winston, Multer, bcryptjs, jsonwebtoken.
- **AI**: Google Generative AI (Gemini SDK).
- **Testing**: Jest, Supertest, MongoDB Memory Server.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A **Google Gemini API Key** (Get it from [Google AI Studio](https://aistudio.google.com/))
- A **MongoDB** database (Local instance or [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database))

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your credentials (MongoDB URI, JWT Secrets, and Gemini API Key). *You can generate secure JWT secrets by running: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`*.
5. Start the server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:3001`*

### 3. Frontend Setup
1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173`*

---

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
- **Phase 2 (Next)**: Interview Prep & Mock Placement Drives (MOD-3). Simulation of TCS NQT, Infosys InfyTQ, AMCAT, Wipro NLTH, Cognizant GenC formats.
- **Phase 3**: Job Matcher & Dashboard Enhancements (MOD-1 & MOD-4).
- **Phase 4**: Personal Trainer & Community Features (MOD-5 & MOD-6).
