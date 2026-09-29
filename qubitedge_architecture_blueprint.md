# QubitEdge: Platform Architecture & Routing Blueprint

**Lead Developer:** Ayush Sharma  
**Document Type:** Full Stack Implementation & Routing Specification

---

## 1. Platform Routing & User Journey

### The Home Page (`/`)
* **Purpose:** The primary public landing page serving as an introduction to the QubitEdge platform.
* **Structure & Content:**
  * Provides a high-level project overview and value proposition.
  * Showcases a quick visual preview of the circuit builder in action.
  * Features clear Call-to-Action buttons directing users to either browse the curriculum (`/learn`) or experiment immediately (`/build`).
* **Access:** Fully public. Static React components ensuring instant load times.

### The Curriculum Hub (`/learn`)
* **Purpose:** The structured educational environment where users progress through theoretical and practical quantum computing concepts.
* **Public View (Module Catalog):**
  * Unauthenticated users can freely view the full list of available learning modules (e.g., Module 1: Superposition) and read their brief overviews.
* **Protected View (Inside a Module):**
  * Users must be logged in to open and start a module.
  * Once inside, the module is strictly divided into three core sections:
    1. **Theoretical Learning:** Bite-sized text and conceptual reading material.
    2. **Interactive Activity:** A guided, constrained mini-sandbox task directly tied to the theory.
    3. **Dedicated Assessments:** Quizzes or circuit-validation challenges to prove mastery before unlocking the next module.

### The Free Playground (`/build`)
* **Purpose:** The unrestricted dual-mode quantum circuit simulator where users can experiment freely.
* **Public View (Design Phase):**
  * Anyone can navigate to `/build` and use the visual composer (drag-and-drop gates) or the Python code editor. 
  * Users can fully construct complex circuits without needing an account.
* **Protected View (Execution & Outputs):**
  * Clicking "Run Simulation" requires authentication. Guest users will trigger a "Log in to execute" modal.
  * Once authenticated, the circuit is processed by the server, returning **multiple types of outputs** (e.g., probability histograms, 3D Bloch sphere renders, raw statevectors).

---

## 2. Frontend Architecture (React.js / Vite)

* **Core Framework:** Next.js 14 with TypeScript, React for optimized hot-module replacement and fast build times.
* **Routing Strategy:** React Router handling public pages, hybrid pages, and protected routes using authentication guards.
* **Workspace Components:**
  * **Visual Composer:** React Flow implementation for the drag-and-drop circuit canvas, managing gate nodes and wire connections.
  * **Code Editor:** Monaco Editor integrated for the native Python environment, supporting syntax highlighting for Qiskit.
  * **Visualization Engine:** Three.js for rendering dynamic 3D Bloch spheres and Plotly for real-time probability histograms.

---

## 3. Backend Architecture (Python / FastAPI)

* **Stateless API Design:** 
  * Fully stateless REST API. No circuit data is held in server memory between requests, ensuring horizontal scalability without the immediate need for Redis.
  * **Primary Endpoint:** `/api/v1/simulate/sync` — Receives circuit JSON (from Visual mode) or Python string (from Code mode), processes the math, and instantly returns results.
* **Execution Engine:** 
  * Qiskit Aer running locally within the FastAPI container, optimized for instantaneous sub-5 qubit processing.
* **AI Integration:** 
  * Google Gemini API integration for the Socratic Tutor. Endpoints ingest the active workspace JSON and user query, strictly prompted to provide hints without revealing direct answers.

---

## 4. Database & Authentication (Supabase / PostgreSQL)

* **Authentication Flow:** 
  * Supabase Auth manages sign-ups and JWT session tokens.
  * Creates a frictionless "try before you buy" funnel—guests can play with the UI, but require an account to see the actual quantum math results or access detailed curriculum.
* **Row Level Security (RLS):** 
  * PostgreSQL RLS policies strictly applied so users can only read/write their own saved circuits and module progress.
* **Core Schema Design:**
  * `users`: Auth mapping and profile data.
  * `saved_circuits`: JSON payload storage for users' custom `/build` designs.
  * `module_progress`: Completion tracking and assessment scores for `/learn`.