import React, { useState, useEffect, useRef } from 'react';
import { Thread, Message, Agent, ThreadSettings, AgentPosition, Claim } from './types';
import ThreadSidebar from './components/ThreadSidebar';
import EpistemicTopologyMap from './components/EpistemicTopologyMap';
import AgentDetailsSheet from './components/AgentDetailsSheet';
import SocraticDialoguePanel from './components/SocraticDialoguePanel';
import { 
  generateLLMResponse, 
  analyzeAgentStanceAndPoints, 
  generatePerspectives, 
  validateSocraticQuestionQNC, 
  extractAndProcessClaims, 
  generateEpistemicStateReport, 
  generateEpistemicFieldReport,
  getComplexityGuideline,
  getDebatePhaseInstructions,
  generatePhdProposal,
  compressEpistemicClaims
} from './utils/llm';
import { 
  SOCRATES_PROMPT, 
  MODEL_BUILDER_PROMPT, 
  HERMENEUTIC_CARTOGRAPHER_PROMPT, 
  CONSENSUS_MAPPER_PROMPT, 
  DIVERGENCE_MAPPER_PROMPT,
  SYNTHESIS_AGENT_PROMPT,
  DEFAULT_SOCRATIC_PROMPT, 
  DEFAULT_RESPONDENT_PROMPT,
  SIMPLICITY_DIRECTIVE
} from './utils/prompts';
import { RefreshCw, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'socratic_sieve_threads_v1';

export function isMessageCorrupted(text: string): boolean {
  if (!text) return true;
  const t = text.toLowerCase();
  // Check for common error signatures
  if (t.includes("network exception") || t.includes("failed to generate") || t.includes("error:") || t.includes("internal server error") || t.includes("api key missing")) {
    return true;
  }
  // Check if it's raw HTML (like a 502/504 gateway error from a proxy)
  if (t.includes("<!doctype html") || t.includes("<html") || t.includes("bad gateway") || t.includes("gateway timeout") || t.includes("service unavailable")) {
    return true;
  }
  // Check if it's too short (less than 15 chars)
  if (text.trim().length < 15) {
    return true;
  }
  return false;
}

const DIVERGENCE_PRIORS = [
  "You operate under: Apophatic (Via Negativa) bias (divinity/truth can only be described by what it is NOT). Enforce non-shared vocabulary constraint: Do NOT use standard anthropomorphic qualitative terms like 'desires', 'physical form', or 'direct command'. Instead use: 'ineffable source', 'transcendent mystery', or 'unnameable absolute'.",
  "You operate under: Kataphatic (Via Positiva) bias (divinity can be described with positive, relational attributes). Enforce non-shared vocabulary constraint: Do NOT use standard abstract words like 'void', 'nothingness', or 'unknowable essence'. Instead use: 'divine attributes', 'manifest glory', or 'revealed grace'.",
  "You operate under: Hermeneutic of Suspicion / Historical-Critical bias (religious narratives are historical, socio-cultural artifacts). Enforce non-shared vocabulary constraint: Do NOT use theological words like 'eternal truth', 'inerrant law', or 'divine decree'. Instead use: 'sociological function', 'historical context', or 'ideological framework'.",
  "You operate under: Phenomenological Devotion bias (spiritual truth is validated through lived experience, ritual, and inner mystical state). Enforce non-shared vocabulary constraint: Do NOT use academic/dry words like 'doctrinal proposition', 'systemic variable', or 'logical proof'. Instead use: 'lived devotion', 'sacred encounter', or 'experiential resonance'."
];

export const FAITH_DETAILS: Record<string, {
  name: string;
  avatarColor: string;
  personalityType: string;
  bias: string;
  characterPrompt: string;
}> = {
  'Christianity': {
    name: 'Brother Thomas',
    avatarColor: 'bg-sky-600',
    personalityType: 'Grace & Love',
    bias: 'Christian Hermeneutics',
    characterPrompt: 'You are Brother Thomas, representing Christianity. Present the tradition\'s views on the topic. Cite Bible verses and theological concepts (Grace, Incarnation, Covenant, Trinity) where appropriate. Maintain respect, never attack other faiths, never try to convert, and speak only from within the Christian framework.'
  },
  'Islam': {
    name: 'Imam Farooq',
    avatarColor: 'bg-teal-600',
    personalityType: 'Reason & Divine Law',
    bias: 'Islamic Hermeneutics',
    characterPrompt: 'You are Imam Farooq, representing Islam. Present the tradition\'s views on the topic. Cite Quranic verses or Hadith and theological concepts (Tawhid, submission, Prophethood) where appropriate. Maintain respect, never attack other faiths, never try to convert, and speak only from within the Islamic framework.'
  },
  'Judaism': {
    name: 'Rabbi Sarah',
    avatarColor: 'bg-indigo-700',
    personalityType: 'Covenantal Inquiry',
    bias: 'Rabbinic Hermeneutics',
    characterPrompt: 'You are Rabbi Sarah, representing Judaism. Present the tradition\'s views on the topic. Cite Torah, Talmud, and key Jewish concepts (Covenant, mitzvot, Tikkun Olam) where appropriate. Maintain respect, never attack other faiths, never try to convert, and speak only from within the Jewish framework.'
  },
  'Hinduism': {
    name: 'Acharya Arjun',
    avatarColor: 'bg-orange-500',
    personalityType: 'Mystical Realism',
    bias: 'Vedic Hermeneutics',
    characterPrompt: 'You are Acharya Arjun, representing Hinduism. Present the tradition\'s views on the topic. Cite Upanishads or Bhagavad Gita and concepts (Brahman, Atman, Karma, Dharma, Moksha) where appropriate. Maintain respect, never attack other faiths, never try to convert, and speak only from within the Hindu framework.'
  },
  'Buddhism': {
    name: 'Tenzin Gyatso',
    avatarColor: 'bg-red-700',
    personalityType: 'Compassion & Voidness',
    bias: 'Buddhist Hermeneutics',
    characterPrompt: 'You are Tenzin Gyatso, representing Buddhism. Present the tradition\'s views on the topic. Cite Dhammapada or Sutras and key concepts (Four Noble Truths, Anatta, Karma, Nirvana) where appropriate. Maintain respect, never attack other faiths, never try to convert, and speak only from within the Buddhist framework.'
  },
  'Sikhism': {
    name: 'Simran Kaur',
    avatarColor: 'bg-amber-500',
    personalityType: 'Oneness & Devotion',
    bias: 'Sikh Gurmat Hermeneutics',
    characterPrompt: 'You are Simran Kaur, representing Sikhism. Present the tradition\'s views on the topic. Cite Guru Granth Sahib and key concepts (Ik Onkar, Naam Simran, Seva, Kirat Karo) where appropriate. Maintain respect, never attack other faiths, never try to convert, and speak only from within the Sikh framework.'
  },
  'Baháʼí': {
    name: 'Layli',
    avatarColor: 'bg-purple-600',
    personalityType: 'Unity of Humanity',
    bias: 'Baháʼí Progressive Revelation',
    characterPrompt: 'You are Layli, representing the Baháʼí Faith. Present the tradition\'s views on the topic. Cite Baháʼí writings (Bahá\'u\'lláh, \'Abdu\'l-Bahá) and concepts (Unity of God, Unity of Religion, Unity of Humanity) where appropriate. Maintain respect, never attack other faiths, never try to convert, and speak only from within the Baháʼí framework.'
  },
  'Secular Humanism': {
    name: 'Leo the Humanist',
    avatarColor: 'bg-emerald-600',
    personalityType: 'Rational Compassion',
    bias: 'Scientific Humanism',
    characterPrompt: 'You are Leo, representing Secular Humanism. Present this perspective\'s views on the topic, emphasizing human reason, ethics, justice, and compassion without relying on supernatural revelation or divine authority. Maintain respect for religious participants, never attack other beliefs, and speak only from within the humanist ethical framework.'
  },
  'Agnosticism': {
    name: 'Maya the Agnostic',
    avatarColor: 'bg-zinc-600',
    personalityType: 'Intellectual Humility',
    bias: 'Epistemic Agnosticism',
    characterPrompt: 'You are Maya, representing Agnosticism. Present this perspective\'s views on the topic, emphasizing the limits of human knowledge regarding the ultimate nature of divinity, the cosmos, or metaphysical claims. Keep an open, inquisitive mind, respect religious and non-religious views, and focus on the value of questioning and ethical living.'
  },
  'Atheism': {
    name: 'Dr. Sam',
    avatarColor: 'bg-slate-700',
    personalityType: 'Scientific Realism',
    bias: 'Rationalist Atheism',
    characterPrompt: 'You are Dr. Sam, representing Atheism. Present this perspective\'s views on the topic, emphasizing critical inquiry, naturalism, and the absence of belief in a deity or divine entities. Argue from reason and evidence, maintain strict respect, never attack or caricature religious participants, and speak constructively from within a secular, empirical worldview.'
  }
};

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Collapse state for the Reflection Arena
  const [isArenaCollapsed, setIsArenaCollapsed] = useState(false);
  
  // Scribe blog post generation status
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

  // Synthesis and Evaluation report expert generation status
  const [isGeneratingPhdProposal, setIsGeneratingPhdProposal] = useState(false);

  // Global settings state
  const [settings, setSettings] = useState<ThreadSettings>({
    localLlmUrl: 'http://localhost:11434/v1',
    localLlmModel: 'llama3.2',
    socraticModelProvider: 'gemini',
    respondentModelProvider: 'gemini',
    summarizerModelProvider: 'gemini',
    socraticPrompt: DEFAULT_SOCRATIC_PROMPT,
    respondentPrompt: DEFAULT_RESPONDENT_PROMPT,
    maxContextMessages: 6,
    isMultiAgent: true,
    maxRounds: -1, // default ad-infinitum
    numArguingAgents: 3,
    agentConfigs: [
      { active: true, faith: 'Christianity' },
      { active: true, faith: 'Islam' },
      { active: true, faith: 'Judaism' },
      { active: false, faith: 'Hinduism' },
      { active: false, faith: 'Buddhism' }
    ],
    summarizeEveryNRounds: 2,
    discussionComplexity: 3,
  });

  // Reference for active autoplay intervals or timeouts
  const runTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get active thread
  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  // 1. Load config and initial threads on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          setGeminiAvailable(data.geminiAvailable);
          
          // If Gemini is not available, default all providers to local LLM
          if (!data.geminiAvailable) {
            setSettings((prev) => ({
              ...prev,
              socraticModelProvider: 'local',
              respondentModelProvider: 'local',
              summarizerModelProvider: 'local',
            }));
          }
        }
      } catch (err) {
        console.warn('Could not contact API config, defaulting offline options.', err);
      }
    };

    fetchConfig();

    // Load from localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Add default parameters to prevent crash with older storage schemas
          const updatedParsed = parsed.map(th => ({
            ...th,
            summaryHistory: th.summaryHistory || [],
            currentRound: th.currentRound || 0,
            settings: {
              ...settings,
              ...th.settings,
              maxRounds: th.settings.maxRounds === undefined ? -1 : th.settings.maxRounds
            }
          }));
          setThreads(updatedParsed);
          setActiveThreadId(updatedParsed[0].id);
          setSettings(updatedParsed[0].settings);
        }
      } catch (e) {
        console.error('Error loading threads from storage:', e);
      }
    }
  }, []);

  // 2. Persist threads to localStorage
  const saveThreadsToLocalStorage = (updatedThreads: Thread[]) => {
    setThreads(updatedThreads);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedThreads));
  };

  // 3. Autoplay simulation effect
  useEffect(() => {
    if (runTimeoutRef.current) {
      clearTimeout(runTimeoutRef.current);
      runTimeoutRef.current = null;
    }

    if (!isPaused && !isProcessing && activeThread && activeThread.messages.length > 0) {
      runTimeoutRef.current = setTimeout(() => {
        handleTriggerNextTurn();
      }, 3500); // 3.5s delay for comfortable read flow
    }

    return () => {
      if (runTimeoutRef.current) {
        clearTimeout(runTimeoutRef.current);
      }
    };
  }, [isPaused, isProcessing, activeThread?.messages?.length, activeThreadId]);

  // Handle settings update
  const handleUpdateSettings = (newSettings: ThreadSettings) => {
    setSettings(newSettings);
    if (activeThread) {
      const updated = threads.map((t) => {
        if (t.id === activeThread.id) {
          return { ...t, settings: newSettings };
        }
        return t;
      });
      saveThreadsToLocalStorage(updated);
    }
  };

  // Create a new inquiry thread
  const handleCreateThread = async (topic: string, isMultiAgent: boolean, numArguingAgentsInput?: number) => {
    setIsPaused(true);
    setErrorMessage(null);
    const newId = `thread_${Date.now()}`;
    
    // Construct the upgraded comparative theological and analytical agents
    const socraticAgent: Agent = {
      id: 'socratic',
      name: 'Socrates',
      avatarColor: 'bg-emerald-600',
      role: 'refuter',
      characterPrompt: SOCRATES_PROMPT,
      initialPosition: 'neutral',
      currentPosition: 'neutral',
      positionHistory: [],
      salientPoints: [],
      personalityType: 'Theological Moderator',
      bias: 'None'
    };

    const modelBuilderAgent: Agent = {
      id: 'model_builder',
      name: 'Doctrinal Modeler',
      avatarColor: 'bg-blue-600',
      role: 'model_builder',
      perspectiveName: 'Doctrinal Modeling',
      characterPrompt: MODEL_BUILDER_PROMPT,
      initialPosition: 'neutral',
      currentPosition: 'neutral',
      positionHistory: [],
      salientPoints: [],
      personalityType: 'Analytical',
      bias: 'None'
    };

    const hermeneuticCartographerAgent: Agent = {
      id: 'hermeneutic_cartographer',
      name: 'Hermeneutic Cartographer',
      avatarColor: 'bg-indigo-600',
      role: 'hermeneutic_cartographer',
      perspectiveName: 'Hermeneutics & History',
      characterPrompt: HERMENEUTIC_CARTOGRAPHER_PROMPT,
      initialPosition: 'neutral',
      currentPosition: 'neutral',
      positionHistory: [],
      salientPoints: [],
      personalityType: 'Historical Scribe',
      bias: 'None'
    };

    const consensusMapperAgent: Agent = {
      id: 'consensus_mapper',
      name: 'Consensus Mapper',
      avatarColor: 'bg-amber-600',
      role: 'consensus_mapper',
      perspectiveName: 'Theological Intersections',
      characterPrompt: CONSENSUS_MAPPER_PROMPT,
      initialPosition: 'neutral',
      currentPosition: 'neutral',
      positionHistory: [],
      salientPoints: [],
      personalityType: 'Intersectional Analyst',
      bias: 'None'
    };

    const divergenceMapperAgent: Agent = {
      id: 'divergence_mapper',
      name: 'Divergence Mapper',
      avatarColor: 'bg-rose-600',
      role: 'divergence_mapper',
      perspectiveName: 'Theological Divergences',
      characterPrompt: DIVERGENCE_MAPPER_PROMPT,
      initialPosition: 'neutral',
      currentPosition: 'neutral',
      positionHistory: [],
      salientPoints: [],
      personalityType: 'Divergence Analyst',
      bias: 'None'
    };

    const currentRespondentPrompt = settings.respondentPrompt || DEFAULT_RESPONDENT_PROMPT;

    let spawnedArguers: Agent[] = [];

    if (!isMultiAgent) {
      const detail = FAITH_DETAILS['Christianity'];
      spawnedArguers = [{
        id: `arguer_single_${Date.now()}`,
        name: detail.name,
        avatarColor: detail.avatarColor,
        role: 'arguer' as const,
        perspectiveName: 'Christianity',
        characterPrompt: `${currentRespondentPrompt}\n${detail.characterPrompt}`,
        initialPosition: 'neutral' as const,
        currentPosition: 'neutral' as const,
        positionHistory: [],
        salientPoints: [],
        personalityType: detail.personalityType,
        bias: detail.bias
      }];
    } else {
      const activeConfigs = (settings.agentConfigs || [])
        .filter(c => c.active && FAITH_DETAILS[c.faith]);

      if (activeConfigs.length > 0) {
        spawnedArguers = activeConfigs.map((cfg, index) => {
          const detail = FAITH_DETAILS[cfg.faith];
          return {
            id: `arguer_${index + 1}_${Date.now()}`,
            name: detail.name,
            avatarColor: detail.avatarColor,
            role: 'arguer' as const,
            perspectiveName: cfg.faith,
            characterPrompt: `${currentRespondentPrompt}\n${detail.characterPrompt}`,
            initialPosition: 'neutral' as const,
            currentPosition: 'neutral' as const,
            positionHistory: [],
            salientPoints: [],
            personalityType: detail.personalityType,
            bias: detail.bias
          };
        });
      } else {
        // Fallback to top 3
        const defaultFaiths = ['Christianity', 'Islam', 'Judaism'];
        spawnedArguers = defaultFaiths.map((faith, index) => {
          const detail = FAITH_DETAILS[faith];
          return {
            id: `arguer_${index + 1}_${Date.now()}`,
            name: detail.name,
            avatarColor: detail.avatarColor,
            role: 'arguer' as const,
            perspectiveName: faith,
            characterPrompt: `${currentRespondentPrompt}\n${detail.characterPrompt}`,
            initialPosition: 'neutral' as const,
            currentPosition: 'neutral' as const,
            positionHistory: [],
            salientPoints: [],
            personalityType: detail.personalityType,
            bias: detail.bias
          };
        });
      }
    }

    const numToSpawn = spawnedArguers.length;

    const spawnedAgents: Agent[] = [
      socraticAgent,
      modelBuilderAgent,
      hermeneuticCartographerAgent,
      consensusMapperAgent,
      divergenceMapperAgent,
      ...spawnedArguers
    ];

    const newThreadSettings: ThreadSettings = {
      ...settings,
      isMultiAgent,
      numArguingAgents: numToSpawn
    };

    const newThread: Thread = {
      id: newId,
      title: topic.length > 40 ? `${topic.substring(0, 40)}...` : topic,
      createdAt: new Date().toISOString(),
      topic,
      messages: [],
      epistemicStateReport: '',
      summaryOfEarlierDialogue: '',
      summaryHistory: [],
      agents: spawnedAgents,
      settings: newThreadSettings,
      isActive: true,
      currentRound: 0,
      claims: []
    };

    const updatedThreads = [newThread, ...threads];
    saveThreadsToLocalStorage(updatedThreads);
    setActiveThreadId(newId);
  };

  // Delete an inquiry thread
  const handleDeleteThread = (id: string) => {
    const updated = threads.filter((t) => t.id !== id);
    saveThreadsToLocalStorage(updated);
    if (activeThreadId === id) {
      if (updated.length > 0) {
        setActiveThreadId(updated[0].id);
      } else {
        setActiveThreadId(null);
      }
    }
  };

  // Launch initial Socratic question
  const handleInitiateInquiry = async () => {
    if (!activeThread || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setActiveAgentId('socratic');

    const socraticAgent = activeThread.agents.find(a => a.role === 'refuter')!;

    try {
      const complexity = activeThread.settings.discussionComplexity ?? 3;
      const guideline = getComplexityGuideline(complexity);
      const systemInstruction = socraticAgent.characterPrompt;
      const prompt = `The topic for our deep, critical Socratic dialogue is: "${activeThread.topic}"
Please ask the initial, logical Socratic question to set the stage, challenge preconceptions, and invite our active participants to present their viewpoints. 

Remember to remain entirely vigilant, unbiased, and completely uninvested in the topic. Only ask a concise, penetrating question. No introduction or greeting is necessary.
Constraints: ${guideline.wordLimitPrompt}`;

      const socraticResponse = await generateLLMResponse({
        provider: activeThread.settings.socraticModelProvider,
        url: activeThread.settings.localLlmUrl,
        model: activeThread.settings.localLlmModel,
        prompt,
        systemInstruction: systemInstruction + "\n" + SIMPLICITY_DIRECTIVE,
        temperature: 0.7,
        maxTokens: guideline.maxTokens
      });

      const initialMessage: Message = {
        id: `msg_init_${Date.now()}`,
        senderId: 'socratic',
        senderName: socraticAgent.name,
        role: 'assistant',
        content: socraticResponse,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [initialMessage];

      // Compile initial claims topology
      const initialClaims = await extractAndProcessClaims({
        provider: activeThread.settings.socraticModelProvider,
        localUrl: activeThread.settings.localLlmUrl,
        localModel: activeThread.settings.localLlmModel,
        topic: activeThread.topic,
        dialogueSegment: socraticResponse,
        existingClaims: [],
        sourceAgentId: 'socratic',
        sourceAgentName: socraticAgent.name,
        roundCount: 1
      });

      // Generate initial ESR
      const initialEsr = await generateEpistemicStateReport({
        provider: activeThread.settings.summarizerModelProvider,
        localUrl: activeThread.settings.localLlmUrl,
        localModel: activeThread.settings.localLlmModel,
        topic: activeThread.topic,
        claims: initialClaims,
        messages: updatedMessages
      });

      const updatedThreads = threads.map((t) => {
        if (t.id === activeThread.id) {
          return { 
            ...t, 
            messages: updatedMessages, 
            fullMessages: updatedMessages,
            currentRound: 1,
            claims: initialClaims,
            epistemicStateReport: initialEsr,
            summaryOfEarlierDialogue: initialEsr
          };
        }
        return t;
      });

      saveThreadsToLocalStorage(updatedThreads);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate initial Socratic challenge.");
      setIsPaused(true);
    } finally {
      setIsProcessing(false);
      setActiveAgentId(null);
    }
  };

  // Trigger Socratic-Respondent dialogue step
  const handleTriggerNextTurn = async () => {
    if (!activeThread || isProcessing) return;

    // Check Max Rounds Limit before firing next turn
    if (activeThread.settings.maxRounds && activeThread.settings.maxRounds > 0) {
      if (activeThread.currentRound > activeThread.settings.maxRounds) {
        setIsPaused(true);
        setErrorMessage(`Discussion halted: Maximum debate rounds limit of ${activeThread.settings.maxRounds} was reached.`);
        return;
      }
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const socraticAgent = activeThread.agents.find(a => a.role === 'refuter')!;
    const respondents = activeThread.agents.filter(a => a.role !== 'refuter');

    const lastMessage = activeThread.messages[activeThread.messages.length - 1];
    
    if (!lastMessage) {
      handleInitiateInquiry();
      return;
    }

    try {
      // Find whose turn it is sequentially among respondents in the current round
      const lastSocraticIndex = [...activeThread.messages].reverse().findIndex(m => m.senderId === 'socratic');
      const actualLastSocraticIndex = lastSocraticIndex === -1 ? -1 : activeThread.messages.length - 1 - lastSocraticIndex;
      
      const messagesSinceLastSocratic = actualLastSocraticIndex === -1 
        ? activeThread.messages 
        : activeThread.messages.slice(actualLastSocraticIndex + 1);

      const respondentsWhoSpoke = messagesSinceLastSocratic
        .filter(m => !isMessageCorrupted(m.content))
        .map(m => m.senderId);
      const nextRespondentToSpeak = respondents.find(r => !respondentsWhoSpoke.includes(r.id));

      if (nextRespondentToSpeak) {
        // CASE A: It is nextRespondentToSpeak's turn to reply to Socrates.
        // Background Semantic Graph Compression Agent (runs once per round starting at round 2, at the beginning)
        let startingClaims = activeThread.claims || [];
        if (activeThread.currentRound >= 2 && respondentsWhoSpoke.length === 0) {
          console.log("Background Agent: Executing Semantic Graph Compression Engine...");
          startingClaims = await compressEpistemicClaims({
            provider: activeThread.settings.respondentModelProvider,
            localUrl: activeThread.settings.localLlmUrl,
            localModel: activeThread.settings.localLlmModel,
            claims: startingClaims,
            topic: activeThread.topic
          });
        }

        const activeMessages = activeThread.messages;
        const dialogueHistory = activeMessages
          .map((m) => `${m.senderName}: ${m.content}`)
          .join('\n\n');

        const activeEsrReport = activeThread.epistemicStateReport || activeThread.summaryOfEarlierDialogue || '';
        const earlierSummaryText = activeEsrReport 
          ? `Epistemic State Report (ESR) of Earlier Conversation:\n"""\n${activeEsrReport}\n"""\n\n` 
          : '';

        setActiveAgentId(nextRespondentToSpeak.id); // highlight thinking in the UI

        const totalRoundsSetting = activeThread.settings.maxRounds || 5;
        const phaseInstructions = getDebatePhaseInstructions(activeThread.currentRound, totalRoundsSetting);

        // Select randomized bias/vocabulary constraints for true agentic divergence
        const nextRespondentIndex = respondents.indexOf(nextRespondentToSpeak);
        const randomPrior = nextRespondentToSpeak.role === 'arguer'
          ? DIVERGENCE_PRIORS[nextRespondentIndex % DIVERGENCE_PRIORS.length]
          : "You operate under a strict academic neutrality constraint. You must analyze the dialogue strictly from a third-person, scholarly, and objective stance. Do NOT adopt any faith position, express personal devotional feelings, or side with/embellish/praise any participant's statements.";

        let roleSpecificInstruction = '';
        if (nextRespondentToSpeak.role === 'arguer') {
          roleSpecificInstruction = `You must answer Socrates' latest question from the perspective of your faith tradition ("${nextRespondentToSpeak.perspectiveName}"), citing scriptural texts and traditional theological foundations. Compare your tradition's view respectfully with others, and never say other participants are wrong or try to convert. Always speak from within your own theological framework.`;
        } else {
          roleSpecificInstruction = `You must stay strictly within your analytical cartography role:
- If you are Doctrinal Modeler: structure the current claims into clear doctrinal/scriptural frameworks, defining what is directly stated vs what is interpretive.
- If you are Hermeneutic Cartographer: map the history of interpretation (literal, allegorical, historical, mystical) and highlight how different traditions read the same texts.
- If you are Consensus Mapper: identify shared moral, ethical, or spiritual tenets between the active faith positions.
- If you are Divergence Mapper: isolate the precise points of metaphysical or cosmological disagreement without bias.

⚠️ CRITICAL NEUTRALITY DIRECTIVE: Do NOT delve into theology yourself as a believer, devotee, or advocate. Do NOT side with, praise, defend, or embellish the statements of any religious agent. You are a third-person, detached academic scholar mapping comparative structures. Write objectively, neutrally, and analytically.`;
        }

        // If we are in Phase 5 (Consensus & Divergence Mapping), override or inject a strong convergence instruction
        const isConvergencePhase = activeThread.currentRound > Math.floor(totalRoundsSetting * 0.6);
        if (isConvergencePhase) {
          roleSpecificInstruction += `\n\n⚠️ CRITICAL AGREEMENT-SEEKING DIRECTIVE: You are in the CONVERGENCE phase. You must prioritize finding consensus, agreeing with valid points made by other participants, and narrowing down your stance to a precise summary of consensus or irreducible disagreement. Do NOT introduce any new variables, definitions, or complex operational layers. Use only the already existing concepts in the history to arrive at a conclusion.`;
        }

        const complexity = activeThread.settings.discussionComplexity ?? 3;
        const guideline = getComplexityGuideline(complexity);

        const prompt = `
Dialogue Topic: "${activeThread.topic}"

${earlierSummaryText}
Dialogue History so far:
"""
${dialogueHistory}
"""

You are active participant "${nextRespondentToSpeak.name}", representing the epistemic role: "${nextRespondentToSpeak.perspectiveName}".
${randomPrior}

DEBATE PHASE: [${phaseInstructions.phaseName}]
Phase Guideline: ${phaseInstructions.respondentGuideline}

Please construct your response to Socrates' latest challenge.
${roleSpecificInstruction}

Provide your clear, high-density response. ${guideline.wordLimitPrompt}`;

        const responseText = await generateLLMResponse({
          provider: activeThread.settings.respondentModelProvider,
          url: activeThread.settings.localLlmUrl,
          model: activeThread.settings.localLlmModel,
          prompt,
          systemInstruction: nextRespondentToSpeak.characterPrompt + "\n" + SIMPLICITY_DIRECTIVE,
          temperature: 0.7,
          maxTokens: guideline.maxTokens
        });

        // Perform stance and point analysis
        const meta = await analyzeAgentStanceAndPoints(
          nextRespondentToSpeak.name,
          nextRespondentToSpeak.perspectiveName || '',
          nextRespondentToSpeak.currentPosition,
          responseText,
          activeThread.topic,
          activeThread.settings.respondentModelProvider,
          activeThread.settings.localLlmUrl,
          activeThread.settings.localLlmModel
        );

        const historyItem = {
          timestamp: new Date().toISOString(),
          position: meta.position,
          explanation: meta.explanation
        };

        const updatedAgents = activeThread.agents.map((agent) => {
          if (agent.id === nextRespondentToSpeak.id) {
            const updatedHistory = [...agent.positionHistory, historyItem];
            const updatedPoints = meta.salientPoint 
              ? [...agent.salientPoints, meta.salientPoint] 
              : agent.salientPoints;

            return {
              ...agent,
              currentPosition: meta.position,
              positionHistory: updatedHistory,
              salientPoints: updatedPoints
            };
          }
          return agent;
        });

        const newMsg: Message = {
          id: `msg_resp_${Date.now()}`,
          senderId: nextRespondentToSpeak.id,
          senderName: nextRespondentToSpeak.name,
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toISOString()
        };

        let updatedThreadMessages;
        let updatedFullMessages;

        const lastMsgIndex = activeThread.messages.length - 1;
        const isLastMsgFromSame = lastMsgIndex >= 0 && activeThread.messages[lastMsgIndex].senderId === nextRespondentToSpeak.id;
        const isLastMsgCorrupted = isLastMsgFromSame && (
          !activeThread.messages[lastMsgIndex].content || 
          isMessageCorrupted(activeThread.messages[lastMsgIndex].content)
        );

        if (isLastMsgCorrupted) {
          updatedThreadMessages = [...activeThread.messages];
          updatedThreadMessages[lastMsgIndex] = {
            ...updatedThreadMessages[lastMsgIndex],
            content: responseText,
            timestamp: new Date().toISOString()
          };

          const fullMsgIndex = (activeThread.fullMessages || []).length - 1;
          updatedFullMessages = [...(activeThread.fullMessages || [])];
          if (fullMsgIndex >= 0 && updatedFullMessages[fullMsgIndex].senderId === nextRespondentToSpeak.id) {
            updatedFullMessages[fullMsgIndex] = {
              ...updatedFullMessages[fullMsgIndex],
              content: responseText,
              timestamp: new Date().toISOString()
            };
          } else {
            updatedFullMessages.push(newMsg);
          }
        } else {
          updatedThreadMessages = [...activeThread.messages, newMsg];
          updatedFullMessages = [...(activeThread.fullMessages || activeThread.messages || []), newMsg];
        }

        // --- PROGRESSIVE SAVE STEP 1: Save dialogue & agent updates so they render instantly ---
        const intermediateThreads = threads.map((t) => {
          if (t.id === activeThread.id) {
            return {
              ...t,
              messages: updatedThreadMessages,
              fullMessages: updatedFullMessages,
              agents: updatedAgents
            };
          }
          return t;
        });
        saveThreadsToLocalStorage(intermediateThreads);

        // --- PROGRESSIVE SAVE STEP 2: Run the Sieve Claim State Machine ---
        let updatedClaims = startingClaims;
        updatedClaims = await extractAndProcessClaims({
          provider: activeThread.settings.respondentModelProvider,
          localUrl: activeThread.settings.localLlmUrl,
          localModel: activeThread.settings.localLlmModel,
          topic: activeThread.topic,
          dialogueSegment: responseText,
          existingClaims: updatedClaims,
          sourceAgentId: nextRespondentToSpeak.id,
          sourceAgentName: nextRespondentToSpeak.name,
          roundCount: activeThread.currentRound
        });

        // Compile Epistemic State Report (ESR)
        const currentEsr = await generateEpistemicStateReport({
          provider: activeThread.settings.summarizerModelProvider,
          localUrl: activeThread.settings.localLlmUrl,
          localModel: activeThread.settings.localLlmModel,
          topic: activeThread.topic,
          claims: updatedClaims,
          messages: updatedThreadMessages
        });

        const runningSummary = currentEsr;
        const runningHistory = activeThread.summaryHistory || [];

        // --- PROGRESSIVE SAVE STEP 3: Save updated claims, reports, and history atomically ---
        setThreads((prevThreads) => {
          const finalThreads = prevThreads.map((t) => {
            if (t.id === activeThread.id) {
              return { 
                ...t, 
                messages: updatedThreadMessages,
                fullMessages: updatedFullMessages,
                claims: updatedClaims,
                epistemicStateReport: runningSummary,
                summaryOfEarlierDialogue: runningSummary,
                summaryHistory: runningHistory
              };
            }
            return t;
          });
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalThreads));
          return finalThreads;
        });

      } else {
        // CASE B: All respondents have spoken. It is the SOCRATIC REFUTER'S turn to challenge them.
        setActiveAgentId('socratic');

        const activeMessages = activeThread.messages;
        const dialogueHistory = activeMessages
          .map((m) => `${m.senderName}: ${m.content}`)
          .join('\n\n');

        const activeEsrReport = activeThread.epistemicStateReport || activeThread.summaryOfEarlierDialogue || '';
        const earlierSummaryText = activeEsrReport 
          ? `Epistemic State Report (ESR) of Earlier Conversation:\n"""\n${activeEsrReport}\n"""\n\n` 
          : '';

        const systemInstruction = socraticAgent.characterPrompt;
        let socraticResponse = "";
        let qncAttempts = 0;
        let qncPassed = false;
        let qncReason = "";

        // Gather historical socratic challenges to test QNC
        const socraticHistory = activeThread.messages
          .filter(m => m.senderId === 'socratic')
          .map(m => m.content);

        const totalRoundsSetting = activeThread.settings.maxRounds || 5;
        const nextRoundNum = activeThread.currentRound + 1;
        
        let phase: 'exploration' | 'stabilization' | 'convergence' = 'exploration';
        let socraticConstraint = "";
        if (nextRoundNum <= Math.floor(totalRoundsSetting * 0.4) || nextRoundNum <= 1) {
          phase = 'exploration';
          socraticConstraint = "You MUST introduce at least ONE brand-new variable, observer disagreement, or conceptual distinction to expand the intellectual field.";
        } else if (nextRoundNum <= Math.floor(totalRoundsSetting * 0.6) || nextRoundNum === Math.ceil(totalRoundsSetting / 2)) {
          phase = 'stabilization';
          socraticConstraint = "Do not introduce new raw topics. Instead, stabilize the existing debate by identifying a critical logical gap or boundary condition in the variables/claims already proposed.";
        } else {
          phase = 'convergence';
          socraticConstraint = "Strictly AVOID introducing any brand-new variables or concepts. Instead, help the debate shrink and converge. Force the participants to synthesize, find common ground, reconcile their differences, or clearly define their ultimate irreducible philosophical differences based solely on the concepts already established.";
        }

        const phaseInstructions = getDebatePhaseInstructions(nextRoundNum, totalRoundsSetting);

        const complexity = activeThread.settings.discussionComplexity ?? 3;
        const guideline = getComplexityGuideline(complexity);

        while (qncAttempts < 3 && !qncPassed) {
          qncAttempts++;
          const prompt = `
Inquiry Topic: "${activeThread.topic}"

${earlierSummaryText}
Dialogue history so far:
"""
${dialogueHistory}
"""

As Socrates, the adversarial epistemic refuter, critically reflect upon the latest claims, operationalisations, and value judgments.

DEBATE PHASE: [${phaseInstructions.phaseName}]
Phase Guideline: ${phaseInstructions.socratesGuideline}
Constraint: ${socraticConstraint}

${qncAttempts > 1 ? `⚠️ Your previous attempt was REJECTED because: "${qncReason}". You MUST raise a DIFFERENT question aligned with the phase constraint. Do not repeat your previous phrasing or concepts.` : ''}

Ask a single, penetrating, unbiased Socratic Question. ${guideline.wordLimitPrompt} No introductions, agreements, or conclusions.`;

          socraticResponse = await generateLLMResponse({
            provider: activeThread.settings.socraticModelProvider,
            url: activeThread.settings.localLlmUrl,
            model: activeThread.settings.localLlmModel,
            prompt,
            systemInstruction: systemInstruction + "\n" + SIMPLICITY_DIRECTIVE,
            temperature: 0.8,
            maxTokens: guideline.maxTokens
          });

          const validation = await validateSocraticQuestionQNC({
            question: socraticResponse,
            history: socraticHistory,
            provider: activeThread.settings.socraticModelProvider,
            localUrl: activeThread.settings.localLlmUrl,
            localModel: activeThread.settings.localLlmModel,
            phase
          });

          qncPassed = validation.valid;
          qncReason = validation.reason || "";
        }

        const newSocraticMessage: Message = {
          id: `msg_soc_${Date.now()}`,
          senderId: 'socratic',
          senderName: socraticAgent.name,
          role: 'assistant',
          content: socraticResponse,
          timestamp: new Date().toISOString()
        };

        let updatedThreadMessages;
        let updatedFullMessages;

        const lastMsgIndex = activeThread.messages.length - 1;
        const isLastMsgSocratic = lastMsgIndex >= 0 && activeThread.messages[lastMsgIndex].senderId === 'socratic';
        const isLastMsgCorrupted = isLastMsgSocratic && (
          !activeThread.messages[lastMsgIndex].content || 
          isMessageCorrupted(activeThread.messages[lastMsgIndex].content)
        );

        if (isLastMsgCorrupted) {
          updatedThreadMessages = [...activeThread.messages];
          updatedThreadMessages[lastMsgIndex] = {
            ...updatedThreadMessages[lastMsgIndex],
            content: socraticResponse,
            timestamp: new Date().toISOString()
          };

          const fullMsgIndex = (activeThread.fullMessages || []).length - 1;
          updatedFullMessages = [...(activeThread.fullMessages || [])];
          if (fullMsgIndex >= 0 && updatedFullMessages[fullMsgIndex].senderId === 'socratic') {
            updatedFullMessages[fullMsgIndex] = {
              ...updatedFullMessages[fullMsgIndex],
              content: socraticResponse,
              timestamp: new Date().toISOString()
            };
          } else {
            updatedFullMessages.push(newSocraticMessage);
          }
        } else {
          updatedThreadMessages = [...activeThread.messages, newSocraticMessage];
          updatedFullMessages = [...(activeThread.fullMessages || activeThread.messages || []), newSocraticMessage];
        }
        
        let runningHistory = activeThread.summaryHistory || [];

        // Recursive Summarization triggered after every N rounds (default: 2) when Socrates finishes a round
        const targetRounds = activeThread.settings.summarizeEveryNRounds || 2;
        const shouldSummarize = nextRoundNum > 0 && nextRoundNum % targetRounds === 0;
        if (shouldSummarize) {
          const currentEsrReport = activeThread.epistemicStateReport || '';
          runningHistory = [
            ...runningHistory,
            { timestamp: new Date().toISOString(), text: currentEsrReport }
          ];

          // Prune context to prevent window overflow - keeping only the latest Socratic question
          const distillationMarker: Message = {
            id: `msg_distill_${Date.now()}`,
            senderId: 'system',
            senderName: 'Epistemic Summarizer AI',
            role: 'system',
            content: `Recursive Epistemic State Report compiled at Round ${nextRoundNum}. Dialogue pruned from active memory. Timeline entry preserved in History.`,
            timestamp: new Date().toISOString()
          };

          updatedThreadMessages = [distillationMarker, newSocraticMessage];
        }

        const updatedThreads = threads.map((t) => {
          if (t.id === activeThread.id) {
            return { 
              ...t, 
              messages: updatedThreadMessages,
              fullMessages: updatedFullMessages,
              currentRound: nextRoundNum,
              summaryHistory: runningHistory
            };
          }
          return t;
        });

        saveThreadsToLocalStorage(updatedThreads);
      }
    } catch (err: any) {
      console.error("Dialogue Cycle Error:", err);
      setErrorMessage(err.message || "Network exception encountered during active model execution.");
      setIsPaused(true);
    } finally {
      setIsProcessing(false);
      setActiveAgentId(null);
    }
  };

  // Generate Epistemic Field Report (EFR) via Scribe Agent
  const handleGenerateFieldReport = async () => {
    if (!activeThread) return;
    setIsGeneratingBlog(true);
    setErrorMessage(null);
    try {
      const reportContent = await generateEpistemicFieldReport({
        provider: activeThread.settings.respondentModelProvider === 'gemini' && geminiAvailable ? 'gemini' : 'local',
        localUrl: settings.localLlmUrl,
        localModel: settings.localLlmModel,
        topic: activeThread.topic,
        claims: activeThread.claims || [],
        messages: activeThread.messages
      });

      const updatedThreads = threads.map((t) => {
        if (t.id === activeThread.id) {
          return { ...t, fieldReport: reportContent, blogPost: reportContent };
        }
        return t;
      });
      saveThreadsToLocalStorage(updatedThreads);
    } catch (err: any) {
      setErrorMessage(err.message || "Epistemic field scribe encountered compilation issue.");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  // Generate Synthesis and Evaluation Report using Synthesis Expert Agent
  const handleGeneratePhdProposal = async () => {
    if (!activeThread) return;
    setIsGeneratingPhdProposal(true);
    setErrorMessage(null);
    try {
      const proposalContent = await generatePhdProposal({
        provider: activeThread.settings.respondentModelProvider === 'gemini' && geminiAvailable ? 'gemini' : 'local',
        localUrl: settings.localLlmUrl,
        localModel: settings.localLlmModel,
        topic: activeThread.topic,
        claims: activeThread.claims || [],
        messages: activeThread.fullMessages || activeThread.messages || []
      });

      const updatedThreads = threads.map((t) => {
        if (t.id === activeThread.id) {
          return { ...t, phdProposal: proposalContent };
        }
        return t;
      });
      saveThreadsToLocalStorage(updatedThreads);
    } catch (err: any) {
      setErrorMessage(err.message || "Synthesis & Evaluation expert encountered an issue during report formulation.");
    } finally {
      setIsGeneratingPhdProposal(false);
    }
  };

  const handleTogglePlay = () => {
    setIsPaused(!isPaused);
  };

  const handlePauseSession = () => {
    setIsPaused(true);
  };

  const handleResetSession = () => {
    if (!activeThread) return;
    setIsPaused(true);
    setErrorMessage(null);

    const resetAgents = activeThread.agents.map((a) => ({
      ...a,
      currentPosition: a.initialPosition,
      positionHistory: [],
      salientPoints: []
    }));

    const updatedThreads = threads.map((t) => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          messages: [],
          summaryOfEarlierDialogue: '',
          summaryHistory: [],
          agents: resetAgents,
          currentRound: 0,
          blogPost: undefined
        };
      }
      return t;
    });

    saveThreadsToLocalStorage(updatedThreads);
  };

  const handleUpdateThreadPrompts = (socPrompt: string, respPrompt: string) => {
    if (!activeThread) return;
    const updatedAgents = activeThread.agents.map((a) => {
      if (a.role === 'refuter') {
        return { ...a, characterPrompt: socPrompt };
      }
      return a;
    });

    const updatedThreads = threads.map((t) => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          agents: updatedAgents,
          settings: {
            ...t.settings,
            socraticPrompt: socPrompt,
            respondentPrompt: respPrompt
          }
        };
      }
      return t;
    });

    saveThreadsToLocalStorage(updatedThreads);
  };

  const handleUpdateAgentPropertiesInThread = (
    agentId: string, 
    updates: { 
      name?: string; 
      perspectiveName?: string; 
      characterPrompt?: string; 
      personalityType?: string; 
      bias?: string; 
    }
  ) => {
    if (!activeThread) return;
    const updatedAgents = activeThread.agents.map((a) => {
      if (a.id === agentId) {
        return { ...a, ...updates };
      }
      return a;
    });

    const updatedThreads = threads.map((t) => {
      if (t.id === activeThread.id) {
        return { ...t, agents: updatedAgents };
      }
      return t;
    });

    saveThreadsToLocalStorage(updatedThreads);
    
    // Sync active drawer details if visible
    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent({ ...selectedAgent, ...updates });
    }
  };

  const handleExportThread = (threadToExport: Thread) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(threadToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `sieve-${threadToExport.id}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportThread = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.id && parsed.topic && Array.isArray(parsed.messages)) {
          parsed.id = `thread_imported_${Date.now()}`;
          parsed.title = `${parsed.title} (Imported)`;
          parsed.createdAt = new Date().toISOString();
          parsed.summaryHistory = parsed.summaryHistory || [];
          parsed.currentRound = parsed.currentRound || 0;
          
          const updated = [parsed, ...threads];
          saveThreadsToLocalStorage(updated);
          setActiveThreadId(parsed.id);
        } else {
          alert('Invalid format. Failed to import thread.');
        }
      } catch (e) {
        alert('JSON Parsing error.');
      }
    };
    reader.readAsText(file);
  };

  const selectActiveThread = (id: string) => {
    setActiveThreadId(id);
    const th = threads.find((t) => t.id === id);
    if (th) {
      setSettings(th.settings);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      
      {/* Threads Sidebar */}
      <ThreadSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={selectActiveThread}
        onCreateThread={handleCreateThread}
        onDeleteThread={handleDeleteThread}
        onUpdateSettings={handleUpdateSettings}
        settings={settings}
        geminiAvailable={geminiAvailable}
        onExportThread={handleExportThread}
        onImportThread={handleImportThread}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Error Notification Toast */}
        {errorMessage && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-6 py-3 flex items-center justify-between gap-4 text-xs text-rose-400 select-none">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong className="font-semibold">Halted State:</strong> {errorMessage}
              </span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white font-mono text-[10px] uppercase underline cursor-pointer font-bold"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Graphical Map Arena with Collapsible Toggle */}
        {activeThread && (
          <div className="flex flex-col bg-slate-950">
            {/* Collapse Control bar */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800/80 bg-slate-900/20 text-xs text-slate-400 select-none">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-wider font-bold">Interactive Debate Mapping</span>
              </div>
              <button
                onClick={() => setIsArenaCollapsed(!isArenaCollapsed)}
                className="text-[9px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer transition flex items-center gap-1.5"
              >
                {isArenaCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {isArenaCollapsed ? 'Expand Map' : 'Collapse Map'}
              </button>
            </div>

            {/* Render EpistemicTopologyMap when Expanded */}
            {!isArenaCollapsed && (
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/10 animate-in fade-in slide-in-from-top duration-300">
                <EpistemicTopologyMap
                  agents={activeThread.agents}
                  claims={activeThread.claims || []}
                  activeAgentId={activeAgentId}
                  isThinking={isProcessing}
                  onSelectAgent={(agent) => setSelectedAgent(agent)}
                  socraticName="Socrates"
                />
              </div>
            )}
          </div>
        )}

        {/* Central Socratic Dialogue Panel */}
        <SocraticDialoguePanel
          thread={activeThread}
          onInitiateInquiry={handleInitiateInquiry}
          onTriggerNextTurn={handleTriggerNextTurn}
          onPauseSession={handlePauseSession}
          onTogglePlay={handleTogglePlay}
          onResetSession={handleResetSession}
          onUpdateThreadPrompts={handleUpdateThreadPrompts}
          isProcessing={isProcessing}
          activeAgentId={activeAgentId}
          isPaused={isPaused}
          onGenerateFieldReport={handleGenerateFieldReport}
          isGeneratingFieldReport={isGeneratingBlog}
          onGeneratePhdProposal={handleGeneratePhdProposal}
          isGeneratingPhdProposal={isGeneratingPhdProposal}
        />
      </main>

      {/* Slide-over Agent Inspector details Drawer Panel */}
      {selectedAgent && (
        <>
          {/* Overlay mask */}
          <div 
            onClick={() => setSelectedAgent(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity" 
          />
          <AgentDetailsSheet
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
            onUpdateAgentProperties={handleUpdateAgentPropertiesInThread}
          />
        </>
      )}

    </div>
  );
}
