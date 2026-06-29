# Functional Specification: Socratic Sieve v3
**Epistemic Validation and Philosophical Exploration Engine**

---

## 1. Executive Summary & Core Mandate

**Socratic Sieve v3** is a multi-agent dialectic simulation engine designed to subject ideas, policy proposals, and philosophical hypotheses to extreme epistemic stress-testing. Unlike typical debate simulators that optimize for operational steps or technical implementability, Socratic Sieve v3 is strictly focused on **philosophical, conceptual, and moral/ethical inquiry**.

### 1.1 Scope Boundaries & Core Principles
* **Anti-Over-Operationalization**: The system is designed to prevent participants from getting trapped in granular, tedious operational details or "KPI-building". It directs focus toward high-level ontological, normative, and conceptual questions.
* **Dialectic Convergence**: The system implements an active contraction system over a designated number of rounds (default: 5). The dialogue transitions from broad divergence and alternative-interpretation mapping into rigorous convergence, forcing consensus or a clear, structured formulation of irreducible philosophical differences.
* **Strict Question Novelty Constraint (QNC)**: All Socratic questions are vetted through a multi-pass validation layer to ensure Socrates never asks repetitive, superficial, or overlapping questions.

---

## 2. System Architecture & Component Mapping

The application operates as a desktop-optimized full-stack web application built using **React 18**, **Vite**, and **Tailwind CSS**, with dual-engine LLM capabilities (Google Gemini SDK server-side and local/Ollama endpoints).

```
 ┌─────────────────────────────────────────────────────────────┐
 │                       User Interface                        │
 │  ┌───────────────────────┐ ┌─────────────────────────────┐  │
 │  │ Thread Sidebar        │ │ Socratic Dialogue Panel    │  │
 │  └───────────────────────┘ └─────────────────────────────┘  │
 └───────────────────────────────┬─────────────────────────────┘
                                 │ HTTP / JSON
                                 ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                   Agent Orchestration Engine                │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │             Phase-Progression Controller              │  │
 │  │        (Exploration -> Stabilization -> Convergence)  │  │
 │  └───────────────────────────────────────────────────────┘  │
 │  ┌───────────────────────┐ ┌─────────────────────────────┐  │
 │  │ Socratic QNC Verifier │ │ LLM Response Sanity-Check   │  │
 │  └───────────────────────┘ └─────────────────────────────┘  │
 └───────────────────────────────┬─────────────────────────────┘
                                 │ API Proxies
                                 ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     LLM Provider Layer                      │
 │     [Gemini API Server-Side]   [Local Ollama / Open-WebUI]  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 3. Cognitive Roles & Specialty Agents

Socratic Sieve v3 orchestrates up to five specialized intellectual perspectives, preventing the flat "assistant-style" responses common in single-prompt architectures.

| Agent Name | Epistemic Persona | Core Focus / Behavioral Constraint |
| :--- | :--- | :--- |
| **Socrates** | *Adversarial Epistemic Refuter* | Exposes deep-seated conceptual, value-based, and logical contradictions. Uses highly concise, sharp questions (max 3-4 sentences). Does not seek technical operationalization. |
| **Model Builder** | *Balanced Explorer* | Proposes the absolute simplest, most intuitive observable points to ground abstract concepts, then quickly pivots back to help the group explore broader philosophical implications. Avoids overly dense or tedious metric systems. |
| **Skeptical Empiricist** | *Reductionist Auditor* | Identifies where trying to measure a concept causes it to lose its philosophical/moral essence. Challenges complex, tedious metric systems, urging participants to return to foundational ethical realities. |
| **Normative Auditor** | *Prescriptive Analyst* | Isolates implicit value judgments, moral biases, or prescriptive weights ("should") disguised as descriptive, empirical claims ("is"). |
| **Synthesis Engine** | *Epistemic Cartographer* | Compiles stable agreements, outstanding tensions, and concept drift into the final **Epistemic State Report (ESR)** and fields. |

---

## 4. Phase-Progression Engine (Dialogue Geometry)

To prevent endless loops and rabbit holes, discussions undergo a structured geometric contraction mapped across a total of $N$ rounds (typically 5).

```
   Round 1 - 2: Exploration        Round 3: Stabilization         Round 4 - 5: Convergence
      [ EXPANSION ]               [ CONCEPT CRITIQUE ]                [ CONTRACTION ]
    
    /\                     /\              | |                     \                     /
   /  \                   /  \             | |                      \                   /
  /    \                 /    \            | |                       \                 /
 /______\               /______\           |_|                        \_______________/
Introduce alternative   Generate simple    Examine existing            Seek common ground,
interpretations.        observable starting  concepts for logical      synthesize, formulate
Explore moral depths.   points.            coherence & limits.         irreducible disagreements.
```

### 4.1 Phase 1: Exploration & Expansion (Rounds 1–2)
* **Socratic Prompting**: Socrates is directed to expand the intellectual map, introducing fresh conceptual distinctions, value-based tensions, or alternative angles.
* **Respondents**: Focus on proposing creative alternative definitions and straightforward, intuitive ways to ground the core idea, establishing a broad field of inquiry.

### 4.2 Phase 2: Stabilization & Critical Audit (Round 3)
* **Socratic Prompting**: Socrates halts the introduction of new variables. Instead, Socrates critically audits the existing constructs and concepts suggested in earlier rounds, identifying logical gaps, contradictions, or boundary conditions.
* **Respondents**: Assess and critique the stability of the proposed concepts. Show where ideas overlap and establish clear boundary thresholds.

### 4.3 Phase 3: Convergence & Agreement-Seeking (Rounds 4–5)
* **Socratic Prompting**: Socrates actively forces contraction. He prohibits new raw terms and asks participants to reconcile their differences, build consensus, or clearly state their ultimate, irreducible philosophical disagreements.
* **Respondents**: Strictly forbidden from adding new operational layers or details. They must seek agreement, narrow their differences, and work together using only established elements to formulate a definitive conclusion.

---

## 5. Epistemic Verification & Robustness Systems

To ensure robust operation in real-world contexts, Socratic Sieve v3 implements two core validation loops:

### 5.1 Question Novelty Constraint (QNC) Validation
Every Socratic question is analyzed by a secondary, non-biased evaluator model before it is committed to the thread history.

1. **Phase-Specific Guidelines**: The evaluator inspects the question against the current dialogue phase rules (e.g., in Phase 3, the evaluator rejects the question if it introduces any brand-new variables or unrelated topics).
2. **Repetition Check**: The evaluator compares the proposed question with all previous questions in the thread history.
3. **Recovery Mechanism**: If the evaluator flags the question as invalid (e.g., redundant or out of phase bounds), it returns a specific failure reason. Socrates receives the failure reason and is given up to 3 automatic regeneration attempts to formulate an acceptable, compliant question.

### 5.2 LLM Response Sanity-Check (Clipped & Empty Output Recovery)
To combat incomplete generations, network hiccups, or truncated tokens from external and local API endpoints:

1. **Length Threshold**: A response containing fewer than 15 characters is flagged.
2. **Punctuation Check**: The system validates that the response ends with standard, finished sentence-ending punctuation (`.`, `?`, `!`, `*`, `"`).
3. **Code Block Balance**: The system ensures all markdown code blocks (```` ``` ````) are fully closed.
4. **Hanging Conjunction Filter**: The response is checked to ensure it does not terminate on common hanging words or conjunctions (such as *and, but, or, the, of, to, in*).
5. **Auto-Recovery Loop**: If a response fails any sanity check, the orchestrator automatically boosts the temperature slightly (to encourage creative completion) and attaches a strict formatting compliance instruction. The query is re-run transparently up to 3 times before failing gracefully.

---

## 6. Analytical Maps & Epistemic Outputs

Socratic Sieve v3 generates four primary analytical reports:

1. **Epistemic State Report (ESR)**: A live summary capturing currently stable claims, contested concepts, value-based biases, and unresolved questions.
2. **Epistemic Topology Map**: A real-time visual grid graphing claims, stability indices, disagreement densities, and specific operationalization criteria.
3. **Agent Evolution Profile**: Tracks shifts in agent positions (`Agree`, `Disagree`, `Neutral`) over the course of the debate, detailing the precise reasons for their intellectual evolution.
4. **Epistemic Atlas**: A final comprehensive summary containing concept evolution timelines, value structures, and final consensus statements.

---

## 7. Custom Data Serialization & Exports

Socratic Sieve v3 ensures zero data loss during archiving through robust export utilities:

### 7.1 JSON Sieve Export
Saves the complete raw state tree of the debate, including complete threads, settings, full agent profiles, position history, and lists of claims.

### 7.2 Custom-Styled HTML Export
Exports a fully self-contained, beautifully styled document containing:
* **Interactive/Readable Dialogue Transcript**: Includes the full history of the debate.
* **Background Analytics**: Displays the full underlying background reasoning, claims metadata, stability ratings, and agent evolution profiles.
* **Preservation Guarantee**: Keeps the original text in the transcript entirely intact while supplementing it with the synthesized reports.
