# QubitEdge

An AI-Powered Interactive Quantum Learning Platform — build, simulate, and understand quantum circuits with a visual composer, Python code editor, and AI tutor.

---

## Project Structure

```
QubitEdge/
├── frontend/          # Next.js 16 + TypeScript + Tailwind CSS
├── backend/           # FastAPI + Qiskit + Gemini AI
└── quantum_platform_srs.md
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional — works in mock mode without it)

# Start the API server
uvicorn main:app --reload --port 8000
```

**Health check:** http://localhost:8000/health  
**API docs:** http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.local.example .env.local

# Start the dev server
npm run dev
```

Open **http://localhost:3000**

---

## Features

| Feature | Description |
|---|---|
| **Visual Composer** | Drag-and-drop quantum gates (H, X, Y, Z, S, T, CNOT) onto qubit wires |
| **Code Editor** | Monaco-powered Python editor with Qiskit & PennyLane starter templates |
| **Simulation** | Real-time Qiskit AerSimulator backend, max 5 qubits · 1024 shots |
| **Histogram** | Interactive Plotly.js probability bar chart with ket notation labels |
| **AI Tutor** | Gemini-powered chat with full circuit + results context injection |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Google Gemini key — [get one free](https://aistudio.google.com) |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Which Gemini model to use |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## API Reference

### `POST /api/simulate` — Run simulation

**Visual mode:**
```json
{ "mode": "visual", "shots": 1024, "num_qubits": 2,
  "gates": [{"type":"H","qubit":0,"step":0}, {"type":"CNOT","qubit":1,"control":0,"step":1}] }
```

**Code mode:**
```json
{ "mode": "code", "shots": 1024, "code": "import json\n..." }
```

### `POST /api/ai/chat` — AI Tutor

```json
{ "message": "Why does this give 50/50?", "context": { "mode": "visual", "circuit": {...}, "results": {...} } }
```

---

## Running Tests

```bash
cd backend
pip install pytest
pytest tests/ -v
```

---

## Deployment

- **Backend:** Docker image → Hugging Face Spaces (free tier)
- **Frontend:** `npm run build` → Vercel / Cloudflare Pages (free tier)
