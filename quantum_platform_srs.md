# Software Requirements Specification (SRS)
## For AI-Powered Interactive Quantum Learning Platform

**Version:** 1.0
**Date:** September 11, 2026

---

## 1. Introduction

### 1.1 Purpose
The purpose of this Software Requirements Specification (SRS) is to provide a comprehensive architectural and functional description of the AI-Powered Interactive Quantum Learning Platform. This document outlines the system requirements, design constraints, and technical architecture for a web-based educational environment designed to teach foundational quantum computing concepts through visual circuit design, code-based programming, and real-time simulation.

### 1.2 Scope
The system is an integrated, dual-mode web application that enables users to design, simulate, and analyze quantum circuits. Initially constrained to 5-qubit simulations to ensure real-time performance within a zero-budget infrastructural footprint, the platform provides:
*   A graphical, drag-and-drop quantum circuit composer.
*   An integrated Python code editor supporting major Quantum SDKs (Qiskit, PennyLane).
*   Real-time execution via a Python-based backend simulator.
*   Interactive visualizations of quantum states (Bloch spheres, probability histograms).
*   Context-aware AI tutoring for debugging and conceptual explanation.

The system specifically excludes bidirectional synchronization between the visual composer and the code editor; users will utilize these interfaces independently.

### 1.3 Definitions, Acronyms, and Abbreviations
*   **API:** Application Programming Interface
*   **JSON:** JavaScript Object Notation
*   **LLM:** Large Language Model
*   **OpenQASM:** Open Quantum Assembly Language
*   **SDK:** Software Development Kit
*   **UI/UX:** User Interface / User Experience

---

## 2. Overall Description

### 2.1 Product Perspective
The platform operates on a decoupled client-server architecture. The frontend handles state management, visual rendering, and code editing entirely within the browser. The backend, functioning as an API layer, is responsible for executing quantum simulations utilizing standard Python libraries and brokering requests to external LLM providers.

### 2.2 User Classes and Characteristics
1.  **Students/Beginners:** Users with minimal quantum mechanics background who primarily utilize the drag-and-drop composer and rely heavily on the AI tutor for conceptual guidance.
2.  **Intermediate Learners:** Users possessing foundational knowledge, utilizing the code editor to practice syntax using libraries such as Qiskit and PennyLane.
3.  **Instructors/Administrators (Future Phase):** Users capable of monitoring progress and assigning specific coding challenges.

### 2.3 Operating Environment
*   **Client Side:** Modern web browsers (Chrome, Firefox, Safari, Edge) on desktop operating systems.
*   **Server Side:** Dockerized Python environment hosted on cloud infrastructure (e.g., Hugging Face Spaces).
*   **Database:** Cloud-hosted PostgreSQL instance (e.g., Supabase).

### 2.4 Design and Implementation Constraints
*   **Resource Limitations:** The initial deployment must operate entirely on free-tier cloud services. Memory-intensive operations must be strictly managed.
*   **Simulation Threshold:** To prevent compute exhaustion and ensure sub-second response times, circuit execution is capped at 5 qubits and 1,024 shots per simulation.
*   **Execution Isolation:** Code submitted via the editor mode must be executed in a sandboxed, restricted environment with a strict timeout (e.g., 5 seconds) to prevent infinite loops or malicious execution.

---

## 3. System Features

### 3.1 Dual-Mode Circuit Design Interface
#### 3.1.1 Visual Drag-and-Drop Mode
*   **Description:** An interactive canvas where users construct circuits by placing quantum gates onto qubit wires.
*   **Inputs:** Mouse drag-and-drop events selecting gates (H, X, Y, Z, CNOT) and targeting specific qubit wires (0-4).
*   **Processing:** The client application serializes the visual grid into a standardized JSON payload detailing the gate type, target qubit, and chronological sequence.
*   **Outputs:** A constructed JSON object transmitted to the simulation API.

#### 3.1.2 Code Editor Mode
*   **Description:** An in-browser code editor tailored for Python.
*   **Inputs:** Alphanumeric keystrokes defining Python scripts utilizing Qiskit or PennyLane frameworks.
*   **Processing:** The client application captures the raw string of the script.
*   **Outputs:** A raw string payload transmitted to the simulation API.

### 3.2 Real-Time Quantum Simulation
*   **Description:** The backend processing engine responsible for calculating the mathematical outcomes of the user's circuits.
*   **Processing:** 
    *   For visual mode, a parser translates the JSON payload into native Qiskit API calls.
    *   For code mode, a sandboxed Python subprocess executes the raw string.
    *   Both modes utilize `qiskit_aer` (AerSimulator) to calculate the statevector and measurement counts.
*   **Outputs:** A standardized JSON response containing measurement probabilities and statevector arrays.

### 3.3 Interactive Visualization Engine
*   **Description:** Client-side rendering of simulation results to aid conceptual understanding.
*   **Features:**
    *   **Probability Histograms:** Dynamic bar charts illustrating the statistical likelihood of measurement outcomes (e.g., the distribution of '00' vs '11' states).
    *   **Bloch Sphere (Future Phase):** 3D rendering mapping the state of individual qubits.

### 3.4 Context-Aware AI Tutoring
*   **Description:** An integrated chatbot leveraging an external LLM to provide targeted, contextual assistance.
*   **Inputs:** Natural language queries from the user (e.g., "Why is my circuit doing this?").
*   **Processing:** The client application automatically appends the current workspace context (active JSON payload or Python code) and the most recent simulation results to the user's query. This combined payload is processed by the LLM (e.g., Gemini).
*   **Outputs:** Natural language explanations, debugging suggestions, or conceptual analogies displayed within the chat interface.

---

## 4. Technical Architecture and Stack

The system architecture is engineered to operate seamlessly within zero-cost constraints while remaining highly scalable.

### 4.1 Frontend Tier
*   **Framework:** Next.js or Vite (React ecosystem) utilizing TypeScript for strict type safety.
*   **Component Library:** Tailwind CSS for responsive styling.
*   **Visual Canvas:** React Flow (for node/edge-based drag-and-drop construction).
*   **Code Interface:** Monaco Editor (providing VS Code-equivalent syntax highlighting and IntelliSense).
*   **Data Visualization:** Plotly.js (for histograms) and Three.js (for 3D spatial representations).
*   **Hosting:** Vercel or Cloudflare Pages.

### 4.2 Backend API Tier
*   **Framework:** FastAPI (Python). Chosen for high performance and native asynchronous support.
*   **Simulation Core:** Qiskit (specifically `qiskit-aer` for high-performance statevector simulations).
*   **Containerization:** Docker.
*   **Hosting:** Hugging Face Spaces (providing robust free-tier compute/memory suitable for the >2GB quantum libraries).

### 4.3 Data and Authentication Tier
*   **Database Manager:** PostgreSQL.
*   **Provider:** Supabase (delivering relational data storage, user authentication, and secure session management via JWT).

### 4.4 Artificial Intelligence Tier
*   **LLM Provider:** Google Gemini API (via Google AI Studio) or Groq (Llama models) for high-speed, zero-cost inference.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
*   **Simulation Latency:** 5-qubit simulations must execute and return results to the client within 500 milliseconds under normal load.
*   **UI Responsiveness:** The drag-and-drop interface must maintain 60 frames per second (FPS) during interaction.
*   **Bundle Size:** The initial frontend payload must be optimized (e.g., utilizing code splitting) to ensure load times under 3 seconds on standard broadband connections.

### 5.2 Security Requirements
*   **Execution Sandboxing:** User-submitted Python code must be executed in a restricted environment utilizing the `subprocess` module with strict memory limits and execution timeouts to mitigate Denial-of-Service (DoS) and remote code execution vulnerabilities.
*   **Data Protection:** User credentials and session tokens must be encrypted in transit using HTTPS/TLS. Passwords must be hashed using industry-standard algorithms (handled natively by Supabase).

### 5.3 Scalability
*   While initially designed for stateless, synchronous execution capped at 5 qubits, the API architecture is structured to facilitate a transition to asynchronous task queues (e.g., Celery + Redis) in subsequent phases to support complex circuits and high concurrent user volume.

### 5.4 Maintainability
*   The codebase must adhere to strict linting and formatting standards (e.g., ESLint for TypeScript, Black for Python).
*   The separation of the visual JSON payload from the code string ensures the client and backend can be updated independently without breaking execution logic.
