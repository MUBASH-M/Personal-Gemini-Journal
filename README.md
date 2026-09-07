# Personal Gemini Journal 📖✨

> A privacy-first, AI-native reflective journaling and longitudinal insight platform built with Google Gemini, Cloud Run, Firebase, and Cloud Firestore.

Personal Gemini Journal bridges mindful, slow-paced reflective writing with cutting-edge generative AI. Styled with the typographic discipline and aesthetic warmth of an archival literary gazette, the application serves as a private, cognitive sanctuary for self-inquiry, mental clarity, and verifiable personal documentation.

---

## 🌟 Key Highlights

- **Socratic Dialogue & In-Depth Reflection**: Engage in thought-provoking, interactive dialogue guided by Google Gemini 2.5 Flash, acting as an empathetic, intellectually curious thought partner.
- **Automated Editorial Synthesis**: Instantly condense free-flowing journaling sessions into polished entries featuring titles, executive summaries, thematic tags, action items, and emotional valence.
- **Longitudinal Cognitive Insights**: Track emotional weather patterns, cognitive biases, recurring themes, and idea lineages over time using interactive data visualizations.
- **Multi-Layered Privacy & Security**:
  - **Server-Side AI Proxy**: Gemini API keys and inference are kept strictly on the backend, shielded from the client browser.
  - **Adversarial & Injection Defenses**: Built-in heuristic and pattern-matching shields against jailbreak and prompt-injection vectors.
  - **Automated PII / PHI Redaction**: Proactively masks sensitive personal identifiers before remote model inference.
  - **SHA-256 Tamper-Evident Chain**: Every entry links into a cryptographic verification chain to ensure historical data integrity.
- **Hybrid Data Persistence**: Real-time cloud sync with Cloud Firestore backed by seamless client-side local fallback for offline resilience.
- **Streamlined Authentication**: Direct email/password authentication without third-party OAuth redirect or iframe popup restrictions.
- **Editorial Exporting**: Export your entries and periodic digests to formatted Markdown, PDF/print-ready views, or structured JSON backups.

---

## 🏗️ Architecture & Cloud Infrastructure

```
[Client Web SPA: React 19 + TypeScript + Tailwind CSS]
                   │
                   ├── Authenticated REST Requests (Bearer Token)
                   ▼
[Full-Stack Container: Cloud Run (Node.js / Express)]
   ├── Session Authentication Middleware
   ├── AI Security Inspector (PII Redaction & Prompt Injection Guard)
   └── Gemini 2.5 SDK Server Proxy (process.env.GEMINI_API_KEY)
                   │
                   ├── Secure Server-to-Server RPC
                   ▼
[Google Gemini API (Gemini 2.5 Flash)]
                   │
                   ▼
[Persistence Layer]
   ├── Cloud Firestore (Encrypted Database & Granular Rules)
   └── Client Storage Fallback (Offline Resilience)
```

### How Google Cloud Technologies Are Leveraged

| Technology | Role & Implementation |
| :--- | :--- |
| **Google Gemini (Gemini 2.5 Flash)** | Powers real-time Socratic inquiry, conversational guiding, and structured editorial synthesis using the official `@google/genai` SDK. |
| **Google Cloud Run** | Hosts the full-stack container (Express + Node.js) with autoscaling, serving both the single-page application and secure `/api/*` endpoints. It safeguards API keys and processes AI requests away from browser environments. |
| **Firebase & Cloud Firestore** | Provides per-user data isolation, real-time database synchronization, and granular security rules (`firestore.rules`) for journal entries, user profiles, and cryptographic verification chains. |

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/), [Recharts](https://recharts.org/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx), [esbuild](https://esbuild.github.io/)
- **AI & Cloud**: [@google/genai](https://www.npmjs.com/package/@google/genai), [Firebase / Cloud Firestore](https://firebase.google.com/), [Google Cloud Run](https://cloud.google.com/run)
- **Build Tool**: [Vite 6](https://vite.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A [Google Gemini API Key](https://aistudio.google.com/)
- A Firebase project with Cloud Firestore enabled (optional if using local offline storage)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/personal-gemini-journal.git
   cd personal-gemini-journal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The development server will start on `http://localhost:3000`.

---

## 📦 Scripts

- `npm run dev`: Starts the local full-stack development server with tsx and Vite middleware.
- `npm run build`: Builds the client-side SPA with Vite and compiles `server.ts` into a self-contained bundle (`dist/server.cjs`) using esbuild.
- `npm run start`: Runs the compiled production server (`node dist/server.cjs`).
- `npm run lint`: Performs TypeScript type-checking (`tsc --noEmit`).
- `npm run preview`: Previews the client build locally.

---

## 🔐 Security & Privacy Principles

1. **Zero Secret Exposure**: The `GEMINI_API_KEY` is strictly accessed within server-side code (`server.ts` / `server/apiRouter.ts`) and is never prefixed with `VITE_` or sent to the browser.
2. **Adversarial & PII Shields**: Journal inputs pass through automated regex and pattern inspections to strip identifying numbers and detect prompt extraction or jailbreak vectors before invoking Gemini.
3. **Immutable Verification**: Each journal entry computes a SHA-256 hash incorporating the previous entry's hash, forming an auditable chain that surfaces any unauthorized modifications.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
