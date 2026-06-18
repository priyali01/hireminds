# HireMinds 🚀

HireMinds is an AI-powered resume evaluator specifically designed for the Indian job market. It leverages Google's Gemini AI to provide actionable feedback, ATS scoring, and keyword suggestions for candidates at various career stages.

## 🏗️ Folder Structure

```text
hireminds/
├── client/                # React Frontend (Vite + Tailwind CSS 4)
│   ├── src/               # Application logic and components
│   │   ├── App.jsx        # Main UI and API integration logic
│   │   └── main.jsx       # React entry point
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                # Node.js Backend (Express)
│   ├── index.js           # Express server, Multer upload, & Gemini AI logic
│   ├── .env               # Environment secrets (GEMINI_API_KEY)
│   └── package.json       # Backend dependencies
├── .gitignore             # Git ignored files (node_modules, .env)
└── README.md             # Project documentation
```

## ✨ Features

- **🎯 Specialized Scoring**: Analysis tailored to Fresher, Intermediate, and Experienced levels.
- **📄 PDF Parsing**: Automatic text extraction from PDF resumes using `pdf-parse-fork`.
- **🤖 Gemini AI Integration**: Deep analysis using Google's Generative AI for high-speed, intelligent feedback.
- **📊 Detailed Score Breakdown**: Visual scores for Skills, Projects, and Education.
- **💡 Actionable Insights**: Lists specific strengths, improvement tips, and missing keywords focused on the Indian job market.
- **🎨 Premium UI**: A clean, responsive dashboard built with Tailwind CSS 4 and modern React patterns.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Axios.
- **Backend**: Node.js, Express, Multer.
- **AI**: Google Generative AI (Gemini SDK).

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/))

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the server:
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
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173`*

## 📝 Usage
1. Select your career level (Fresher, Intermediate, Experienced).
2. Upload your resume in PDF format.
3. Click **Analyze Resume**.
4. Review your ATS score, strengths, and missing keywords to optimize your profile!
