export type AgentPosition = 'agree' | 'disagree' | 'neutral';

export type EpistemicRole = 
  | 'refuter'                  // Socrates (Theological Moderator)
  | 'model_builder'            // Doctrinal Modeler / Model Builder
  | 'hermeneutic_cartographer' // Hermeneutic Cartographer
  | 'consensus_mapper'         // Consensus Mapper
  | 'divergence_mapper'        // Divergence Mapper
  | 'arguer'                   // Faith Representative
  | 'synthesis';               // Atlas Synthesiser

export type ClaimLifecycle = 
  | 'RAW' 
  | 'INTERPRETED' 
  | 'OPERATIONALISED' 
  | 'CONTESTED' 
  | 'STABLE' 
  | 'UNSTABLE';

export type ConceptLifecycle =
  | 'Introduced'
  | 'Tentative'
  | 'Operational Candidate'
  | 'Operationalised'
  | 'Established Construct'
  | 'Split'
  | 'Merged'
  | 'Collapsed'
  | 'Deprecated';

export type ObservationCategory =
  | 'Direct Observation'
  | 'Composite Observable'
  | 'Latent Construct'
  | 'Pure Theoretical Construct';

export type DisagreementTaxonomyType =
  | 'definition'
  | 'measurement'
  | 'causal'
  | 'value'
  | 'ontological'
  | 'meta-epistemic';

export interface AlternativeInterpretation {
  observerName: string;
  interpretation: string;
}

export interface Claim {
  id: string;
  statement: string;          // Concept layer (language claim)
  operationalisation: string; // Operational layer (observed/detected variables)
  disagreement: string;       // Disagreement layer (how two observers disagree on detection)
  observerA: string;          // Observer Duality - Interpretation A
  observerB: string;          // Observer Duality - Interpretation B
  status: ClaimLifecycle;
  stabilityScore: number;     // 0.0 = fully operationalised/stable, 1.0 = purely interpretive
  normativeLoad: string;      // Explicit list of value assumptions / shoulds
  disagreementDensity: number;// 0.0 (low) to 1.0 (high unresolved observer views)
  operationalComplete: boolean;// Concept + Operational + Disagreement layers populated?
  sourceAgentId: string;
  sourceAgentName: string;
  timestamp: string;

  // Socratic Sieve v3 Epistemic Cartography additions
  origin?: 'user' | 'emergent' | 'operational_proxy' | 'normative_abstraction';
  introducedBy?: string;
  generationRound?: number;
  derivedFrom?: string[];
  lifecycle?: ConceptLifecycle;
  category?: ObservationCategory;
  dependencies?: string[]; // IDs of claims this claim depends on
  observable?: 'Yes' | 'No';
  requiresTheory?: 'Yes' | 'No';
  observerAgreement?: 'High' | 'Medium' | 'Low';
  alternativeInterpretations?: AlternativeInterpretation[];
  disagreementType?: DisagreementTaxonomyType;
  
  // Stability redesign dimensions (0.0 to 1.0)
  definitionCompleteness?: number;
  operationalCompleteness?: number;
  observerConsensus?: number;
  dependencyRobustness?: number;
  epistemicMaturity?: number;

  // Interfaith Cartography additions
  scripturalReferences?: string[];
  traditionIdentity?: string;
  conceptEquivalents?: ConceptEquivalent[];
}

export interface ConceptEquivalent {
  tradition: string;
  concept: string;
}

export interface PositionUpdate {
  timestamp: string;
  position: AgentPosition;
  explanation: string;
}

export interface Agent {
  id: string;
  name: string;
  avatarColor: string; // e.g. bg-blue-500, bg-emerald-500
  role: EpistemicRole;
  characterPrompt: string;
  perspectiveName?: string; // e.g. "Adversarial Refuter", "Empirical Validator"
  initialPosition: AgentPosition;
  currentPosition: AgentPosition;
  positionHistory: PositionUpdate[];
  salientPoints: string[];
  personalityType?: string;
  bias?: string; // e.g. "Linguistic realism bias", "Empiricist bias" etc. (Divergence injection layer)
}

export interface Message {
  id: string;
  senderId: string; // 'socratic', 'user', or custom agent ID
  senderName: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isSummary?: boolean;
  isThinking?: boolean;
}

export interface SelectedAgentConfig {
  active: boolean;
  faith: string;
}

export interface ThreadSettings {
  localLlmUrl: string; // e.g. http://localhost:11434/v1
  localLlmModel: string; // e.g. llama3
  socraticModelProvider: 'local' | 'gemini';
  respondentModelProvider: 'local' | 'gemini';
  summarizerModelProvider: 'gemini' | 'local';
  socraticPrompt: string;
  respondentPrompt: string;
  maxContextMessages: number; // Trigger recursive summarization when reached
  isMultiAgent: boolean;
  maxRounds: number; // number of turns before pausing (e.g. 5, 10, or -1 for infinite)
  numArguingAgents?: number; // Preference of arguing agents (1-3)
  agentConfigs?: SelectedAgentConfig[]; // List of up to 5 custom active agents & their faith
  summarizeEveryNRounds?: number; // How many rounds before summarizing (default: 2)
  discussionComplexity?: number; // Complexity slider: 1 (fast/minimal) to 5 (heavy/comprehensive)
}

export interface SummaryHistoryItem {
  timestamp: string;
  text: string;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: string;
  topic: string;
  messages: Message[];
  fullMessages?: Message[];
  epistemicStateReport: string; // Epistemic State Report (ESR)
  summaryOfEarlierDialogue?: string; // Kept for backwards compatibility fallback
  summaryHistory: SummaryHistoryItem[];
  agents: Agent[];
  settings: ThreadSettings;
  isActive: boolean;
  fieldReport?: string; // Epistemic Field Report (replacing blogPost)
  blogPost?: string; // Kept for backwards compatibility fallback
  currentRound: number; // counter for current turns of debate
  claims: Claim[]; // The active epistemic claims topology
  phdProposal?: string; // The generated candidate PhD level thesis proposal
}

export interface ModelOption {
  id: string;
  name: string;
  provider: 'local' | 'gemini';
}
