# Socratic Sieve v3 ✦ Epistemic Cartography & Theory Formation Workspace

Socratic Sieve v3 is an interactive **Epistemic Cartography & Theory Formation Workspace** designed to map the structure of knowledge formation, trace conceptual lineages, analyse observation dependencies, localise irreducible disagreements, and discover the deeper research programmes hidden within discourse.

Rather than acting as a multi-agent debate simulator, **Socratic Sieve v3** treats discussion as an epistemic excavation process. Dialogue becomes the mechanism through which assumptions are exposed, concepts evolve, observations are separated from abstractions, and unresolved tensions become visible.

The primary artifact is an interactive **Epistemic Atlas**—a structured map of the logical terrain explored during reasoning. Once the atlas has stabilised, the system performs a second-order analysis to identify the underlying scientific or philosophical problems that generated the discussion, producing candidate research programmes and doctoral-level thesis proposals.

Socratic Sieve therefore shifts the central question away from:

> **"Who is right?"**

towards:

- **What would have to be true for this position to be correct?**
- **Which assumptions generated this disagreement?**
- **How did the conceptual landscape evolve?**
- **What deeper research question does this debate accidentally reveal?**

---

## 🧭 Core Philosophy

Socratic Sieve is founded on a simple premise:

> **The purpose of discourse is not merely to establish truth, but to reveal the structure within which truth claims become possible.**

The system therefore treats every discussion as a dynamic exploration of conceptual space. Its objective is not persuasion; its objective is cartography. The debate itself is transient; the evolving topology of knowledge is the product.

---

## 🏛 Core Architectural Pillars

### 1. No Concept Without Provenance
Every concept introduced into discourse carries permanent provenance. Each concept records its originating agent, debate round, parent concepts, supporting observations, operational definitions, and evolution history. Concepts originate from one of four sources: User supplied, Emergent, Operational proxy, or Normative abstraction. Nothing appears without lineage.

### 2. Constructs Are Not Observations
To prevent category errors, every entity is explicitly classified:
- Direct Observation
- Composite Observable
- Operational Proxy
- Latent Construct
- Pure Theoretical Construct
- Normative Principle

The workspace visually distinguishes measurable reality from explanatory models.

### 3. Concept Lifecycles
Ideas are treated as evolving objects rather than static definitions:
```
Introduced ──► Tentative ──► Operational Candidate ──► Operationalised ──► Established Construct
                                                                                │
                                                                   ┌────────────┼────────────┐
                                                                   ▼            ▼            ▼
                                                                 Split        Merge       Collapse
```
Promotion requires independent convergence, survival through Socratic challenge, stable operational definition, and observer agreement. Collapse occurs when operationalisation fails or redundancy is discovered.

### 4. Claim Dependency Topology
Claims exist as a Directed Acyclic Graph (DAG) rather than a flat conversation. Every claim answers the question: *What assumptions must already be true before this claim becomes meaningful?* The atlas exposes root assumptions, dependency chains, downstream consequences, and hidden conceptual bottlenecks.

### 5. Epistemic Inspector & Tension Panel
Every concept is continuously evaluated across independent dimensions (Definition completeness, Operational completeness, Observer agreement, Dependency robustness). Disagreements are localized precisely and classified as Definition, Measurement, Causal, Normative, Ontological, or Meta-epistemic.

### 6. Semantic Graph Compression
To stop claim and concept graphs from exploding as the debate progresses, a **Semantic Graph Compression Engine** runs at the beginning of each round (starting at round 2). It canonicalizes equivalent claims, merges duplicate nodes, prunes redundancies, and cleans up the dependencies array while preserving core contradictions, unique claims, and inferential dependencies.

---

## 🧠 Multi-Agent Architecture

1. **Socrates v3 (The Eliminative Moderator)**: Systematically removes ambiguity and exposes hidden assumptions, boundaries, and philosophical tensions.
2. **Epistemic Cartographer**: Maintains the evolving knowledge map, dependency tracking, lineage, and topology.
3. **Model Builder**: Constructs operational models focused on measurable variables, simple experiments, and empirical starting points.
4. **Normative Auditor**: Separates descriptive claims from value judgments and hidden prescriptions.
5. **Synthesis Engine**: Consolidates the conversation into the canonical **Epistemic Atlas** (dependency graphs, construct audits, lineage, and maps).
6. **PhD Thesis Builder (Synthesis Expert Agent)**: Analyzes the completed Epistemic Atlas to identify conceptual migrations, formulate testable hypotheses, and generate doctoral-level research programmes and thesis proposals.

---

## 🛠 Features & Debugging Tools

- **Immersive Cosmic Slate Theme**: Beautifully designed UI with a dark cosmic slate color palette, tailored typography (Space Grotesk & JetBrains Mono), and fluid transitions.
- **Interactive D3/Recharts Graphing**: Render and explore complex claim dependency DAGs dynamically.
- **Dual LLM Orchestration**: Run Socratic mediators or respondents using either cloud frontier models (via Gemini SDK) or local developer servers (via Ollama / LM Studio).
- **Raw LLM Responses Log**: Access a real-time append-only server log (`llm_responses.log`) directly via the UI settings to verify raw completions, check prompt construction, and determine if an LLM response is being clipped or truncated.

---

## 🚀 Installation & Setup

Follow these steps to run Socratic Sieve v3 on your local machine or in a development environment.

### Prerequisites

- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- *(Optional)* **Ollama** or **LM Studio** for local LLM inference.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/socratic-sieve-v3.git
cd socratic-sieve-v3
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory of the project:

```env
# Google Gemini API Credentials
GEMINI_API_KEY=your_gemini_api_key_here

# Application Configuration
APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run the Development Server

Start the full-stack development environment (Express API + Vite Frontend):

```bash
npm run dev
```

The application will be accessible at: **`http://localhost:3000`**

### 4. Build for Production

To compile the application into a production-ready package:

```bash
npm run build
```

This compiles the client-side SPA bundle to `dist/` and compiles the backend server into a single, highly performant CommonJS file at `dist/server.cjs` using `esbuild`.

To start the production server:

```bash
npm run start
```

---

## 💻 Local LLM Integration

Socratic Sieve v3 supports running models fully locally!

### Ollama Setup
1. Download and install [Ollama](https://ollama.com/).
2. Run your preferred model (e.g., `llama3`, `mistral`, `phi3`):
   ```bash
   ollama run llama3
   ```
3. In the Socratic Sieve Settings sidebar:
   - Set **Local LLM Host URL** to `http://localhost:11434`
   - Select your provider as **Local LLM** for any of the agents.
   - Enter your model name (e.g., `llama3`).

### LM Studio Setup
1. Open [LM Studio](https://lmstudio.ai/) and download a model.
2. Start the Local Inference Server (default port: `1234`).
3. In the Socratic Sieve Settings sidebar:
   - Set **Local LLM Host URL** to `http://localhost:1234`
   - Select your model name.

---

## 🌍 Vision

Socratic Sieve is not intended to replace human reasoning; its purpose is to make reasoning visible. By mapping how concepts emerge, evolve, diverge, and stabilise, the workspace provides a living cartography of knowledge formation. Rather than producing answers, it produces landscapes. Rather than selecting winners, it exposes assumptions. Rather than ending conversations, it identifies the deeper questions that remain worth asking.

---

## 📄 License

Private and Proprietary. All Rights Reserved.
