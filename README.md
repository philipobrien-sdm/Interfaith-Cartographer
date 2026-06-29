# Interfaith Socratic Cartography Workspace ✦ Comparative Theology & Epistemic Mapping
<img width="1361" height="786" alt="Screenshot 2026-06-29 144820" src="https://github.com/user-attachments/assets/fce1ce39-5669-41b1-b536-d8266f38fb68" />

The **Interfaith Socratic Cartography Workspace** is an immersive, multi-agent research platform designed to map comparative theological, moral, and philosophical positions across world religions, secular worldviews, and philosophical traditions.

Rather than simulating standard debates or pushing for superficial consensus, this platform treats interfaith dialogue as an **epistemic excavation process**. It uncovers the logical structures, underlying assumptions, scriptural references, and conceptual crossovers that shape how different traditions formulate truth claims.

The workspace visualises these intersections through an interactive **Epistemic Atlas**—a live knowledge graph displaying theological claims, scriptural provenance, observer dualities, and irreducible dogmatic or metaphysical disagreements.
<img width="1352" height="792" alt="Screenshot 2026-06-29 144858" src="https://github.com/user-attachments/assets/5b63a4a7-4836-4ca0-9f8c-c22fb8125224" />
<img width="1348" height="787" alt="Screenshot 2026-06-29 144843" src="https://github.com/user-attachments/assets/4525b701-906e-4036-afcb-9a3f14bdfc47" />

---

## 🧭 Core Philosophy

> **"Truth is one, though the wise speak of it by many names."**  
> — Rig Veda (I.164.46)

The platform is designed around the premise that interfaith discourse is most productive when it is intellectually rigorous, scholarly, and objective. It seeks to answer:
- Where do different traditions share **concept equivalents** (e.g., *Logos* in Christian theology, *Dharma* in Indian philosophy, *Tao* in Chinese thought) despite using radically different vocabularies?
- How do different observers or traditions interpret the same moral or empirical reality (**Observer Duality**)?
- What are the absolute scriptural boundaries or dogmatic constraints that lead to **irreducible disagreements**?
- How does the conceptual terrain evolve as traditions challenge and respond to one another in Socratic inquiry?

---

## 🏛 Core Architectural Pillars

### 1. Scriptural & Traditional Lineage
Every claim or concept mapped by the system carries explicit traditional ownership (**Tradition Identity**) and scriptural provenance (**Scriptural References**). It traces claims back to canonical texts (e.g., the Bible, the Qur'an, the Upanishads, the Buddhist Sutras, the Guru Granth Sahib) or founding secular manifestos.

### 2. Concept Equivalents & Syncretism
The platform maps connections where distinct traditions have formulated analogous concepts. The **Concept Equivalents** registry identifies overlap without flattening the unique metaphysical distinctions of each tradition.

### 3. Observer Duality & Disagreement Tensions
To capture religious disagreements honestly, each claim features a dual-observer analysis (**Observer A vs. Observer B**). This allows the workspace to model exactly how two traditions interpret the same phenomenon or concept differently. Disagreements are classified into distinct categories:
- **Ontological**: Differences in core metaphysical assumptions (e.g., personal God vs. non-dual ultimate reality).
- **Epistemological**: Differences in sources of authority (revelation vs. reason vs. empirical observation).
- **Normative**: Divergence in moral duties and ultimate purpose (*Soteriology* or *Dharma*).
- **Hermeneutical**: Textual and scriptural interpretation differences.

### 4. Semantic Graph Compression
To prevent claim and concept graphs from becoming redundant as dialogues progress, a **Semantic Graph Compression Engine** runs in the background. It merges equivalent concepts across traditions, prunes duplicated logical nodes, and repairs the dependency topology while preserving all genuine doctrinal tensions, scriptural citations, and historical contradictions.

### 5. Multi-Tradition Socratic Agents
Dynamic, AI-driven scholarly respondents representing diverse traditions (e.g., Christianity, Islam, Hinduism, Buddhism, Judaism, Sikhism, Secular Humanism) converse under a strict academic neutrality constraint. A Socratic-Respondent mediator systematically exposes their hidden assumptions and logical dependencies.
<img width="366" height="800" alt="Screenshot 2026-06-29 155525" src="https://github.com/user-attachments/assets/3ec91a40-d33e-4f10-a058-f933882e8e4e" />

### 6. Supporting Agents

- **Epistemic field reporter**: Agent whose purpose is to prepare topic agnostic, unbiased reports on the outstanding field of comcepts and claims.
- **Synthesis reporter**: agen whose role is to synthesise a report at the end of the debate, summing up the discussion and the concepts/claims raised as well as pointing to future questions for discussion.
<img width="762" height="622" alt="Screenshot 2026-06-29 155434" src="https://github.com/user-attachments/assets/cf724e84-6d11-44e1-8362-b6eb923b2034" />
<img width="674" height="629" alt="Screenshot 2026-06-29 155254" src="https://github.com/user-attachments/assets/70475578-06ab-49da-abdf-cbf1af596d9d" />

  
---

## 🛠 Features & Engineering Capabilities

- **Cosmic Slate Theme**: A beautifully styled, eye-safe slate interface paired with elegant display typography (**Space Grotesk** for headings and **JetBrains Mono** for structural data).
- **Interactive D3/Recharts Graphing**: Explore claim dependencies, lineage trees, and the conceptual geography of theological debates in real-time.
- **Dual LLM Orchestration**: Toggle individual scholarly agents or the summarizer between powerful frontier models (via Gemini SDK) and locally hosted development models.
- **Raw LLM Responses Log**: Access a real-time, server-side log file (`llm_responses.log`) directly from the UI settings. This allows researchers and developers to inspect raw completions, debug truncated responses, and verify prompt construction.

---

## 🚀 Installation & Setup

Follow these steps to run the Interfaith Socratic Cartography Workspace locally.

### Prerequisites

- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- *(Optional)* **Ollama** or **LM Studio** for local offline inference.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/interfaith-cartography-workspace.git
cd interfaith-cartography-workspace
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# App configuration
APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run the Development Server

Start the full-stack development environment (Vite frontend with an Express proxy backend):

```bash
npm run dev
```

The application will be running at: **`http://localhost:3000`**

### 4. Build for Production

To build the client-side SPA bundle and compile the Express backend into a single, optimized CJS server file:

```bash
npm run build
```

This uses `esbuild` to compile `server.ts` into `dist/server.cjs` for high-performance and dependency-free Node deployments.

Start the production server:

```bash
npm run start
```

---

## 💻 Local LLM Integration (Ollama / LM Studio)

You can run the entire workspace offline or map theological topics using locally run open-source models!

### Ollama Configuration
1. Install [Ollama](https://ollama.com/) and run your model:
   ```bash
   ollama run llama3
   ```
2. In the App Settings panel:
   - Set **Local LLM Host URL** to `http://localhost:11434`
   - Set the agent's model provider to **Local LLM** and specify the model name (e.g., `llama3`).

### LM Studio Configuration
1. Launch [LM Studio](https://lmstudio.ai/) and start the local server on port `1234`.
2. In the App Settings panel:
   - Set **Local LLM Host URL** to `http://localhost:1234`
   - Set your provider and model name.

---

## 📄 License

Private and Proprietary. All Rights Reserved.
