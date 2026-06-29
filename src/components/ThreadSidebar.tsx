import React, { useState, useEffect } from 'react';
import { Thread, ThreadSettings } from '../types';
import { 
  MessageSquare, Plus, Trash2, Cpu, Sparkles, 
  Settings, FileUp, FileDown, Check, AlertCircle, RefreshCw, X, FileText 
} from 'lucide-react';
import { testLocalLlmConnection, fetchLocalModels } from '../utils/llm';

const AVAILABLE_FAITHS = [
  'Christianity',
  'Islam',
  'Judaism',
  'Hinduism',
  'Buddhism',
  'Sikhism',
  'Baháʼí',
  'Secular Humanism',
  'Agnosticism',
  'Atheism'
];

interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (topic: string, isMultiAgent: boolean, numArguingAgents?: number) => void;
  onDeleteThread: (id: string) => void;
  onUpdateSettings: (settings: ThreadSettings) => void;
  settings: ThreadSettings;
  geminiAvailable: boolean;
  onExportThread: (thread: Thread) => void;
  onImportThread: (file: File) => void;
}

export default function ThreadSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onUpdateSettings,
  settings,
  geminiAvailable,
  onExportThread,
  onImportThread,
}: ThreadSidebarProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [multiAgent, setMultiAgent] = useState(true);
  
  // Connection testing state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Load models on mount/URL change
  useEffect(() => {
    let active = true;
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const models = await fetchLocalModels(settings.localLlmUrl);
        if (active) {
          setLocalModels(models);
          // Auto-select first model if the current one is not in the list
          if (models.length > 0 && !models.includes(settings.localLlmModel)) {
            onUpdateSettings({ ...settings, localLlmModel: models[0] });
          }
        }
      } catch (e) {
        if (active) {
          setLocalModels(['llama3', 'llama3.2', 'mistral', 'gemma2']);
        }
      } finally {
        if (active) setLoadingModels(false);
      }
    };
    loadModels();
    return () => { active = false; };
  }, [settings.localLlmUrl]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testLocalLlmConnection(settings.localLlmUrl, settings.localLlmModel);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Error occurred during connection test.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    const activeCount = (settings.agentConfigs || [])
      .filter(c => c.active).length;
    onCreateThread(newTopic.trim(), multiAgent, activeCount || 3);
    setNewTopic('');
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none text-slate-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-white text-sm">Interfaith Cartographer</h1>
            <p className="text-[10px] text-slate-400 font-mono">THEOLOGICAL DIALOGUE ENGINE</p>
          </div>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className={`p-1.5 rounded-lg border transition ${
            showConfig 
              ? 'bg-slate-800 border-emerald-500 text-emerald-400' 
              : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="System Settings"
          id="btn-toggle-settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings / Config Panel (Scrollable when open) */}
      {showConfig ? (
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 max-h-[60%] overflow-y-auto flex flex-col gap-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white tracking-wider font-mono text-[10px] uppercase">AI ENGINE ROUTING</h3>
            <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Raw LLM Log Link */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-white text-[11px]">Raw LLM Responses Log</p>
                <p className="text-[9px] text-slate-400">Verify if responses are clipped or see raw outputs</p>
              </div>
            </div>
            <a 
              href="/api/logs/llm" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-2.5 py-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-900/40 rounded text-[10px] font-semibold transition"
              id="link-view-llm-logs"
            >
              Open Log
            </a>
          </div>

          {/* Local LLM Settings */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Local LLM Host URL</label>
            <input 
              type="text" 
              value={settings.localLlmUrl}
              onChange={(e) => onUpdateSettings({ ...settings, localLlmUrl: e.target.value })}
              placeholder="e.g. http://localhost:11434/v1"
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
              id="input-local-llm-url"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Local LLM Model</label>
              {loadingModels && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
            </div>
            <div className="flex gap-2">
              <select
                value={settings.localLlmModel}
                onChange={(e) => onUpdateSettings({ ...settings, localLlmModel: e.target.value })}
                className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                id="select-local-llm-model"
              >
                {localModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="or type"
                value={settings.localLlmModel}
                onChange={(e) => onUpdateSettings({ ...settings, localLlmModel: e.target.value })}
                className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                id="input-custom-llm-model"
              />
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase">Agent Provider Assigment</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Socratic Questioner:</span>
                <select 
                  value={settings.socraticModelProvider}
                  onChange={(e) => onUpdateSettings({ ...settings, socraticModelProvider: e.target.value as 'local' | 'gemini' })}
                  className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-white focus:outline-none focus:border-emerald-500"
                  id="select-socratic-provider"
                >
                  <option value="gemini">Gemini AI (Built-in)</option>
                  <option value="local">Local AI Model</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Respondents:</span>
                <select 
                  value={settings.respondentModelProvider}
                  onChange={(e) => onUpdateSettings({ ...settings, respondentModelProvider: e.target.value as 'local' | 'gemini' })}
                  className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-white focus:outline-none focus:border-emerald-500"
                  id="select-respondent-provider"
                >
                  <option value="gemini">Gemini AI (Built-in)</option>
                  <option value="local">Local AI Model</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Summarizer (Third AI):</span>
                <select 
                  value={settings.summarizerModelProvider}
                  onChange={(e) => onUpdateSettings({ ...settings, summarizerModelProvider: e.target.value as 'local' | 'gemini' })}
                  className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-white focus:outline-none focus:border-emerald-500"
                  id="select-summarizer-provider"
                >
                  <option value="gemini">Gemini AI (Built-in)</option>
                  <option value="local">Local AI Model</option>
                </select>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-500 leading-tight">
              {!geminiAvailable && (
                <span className="text-amber-500 font-mono">⚠️ Gemini API Key not detected in workspace. Falling back to local/mock services.</span>
              )}
            </div>
          </div>

          {/* Test connection Button */}
          <div className="space-y-1">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 rounded font-semibold text-xs active:scale-[0.98] transition disabled:opacity-50"
              id="btn-test-connection"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  Testing Local Connection...
                </>
              ) : (
                'Test Local Connection'
              )}
            </button>
            
            {testResult && (
              <div className={`p-2 rounded text-[11px] flex gap-1.5 items-start mt-2 border ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`} id="test-connection-result">
                {testResult.success ? <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <p className="leading-tight font-mono text-[10px]">{testResult.message}</p>
              </div>
            )}
          </div>

          {/* Summarization Rounds Setting */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Summarize Every N Rounds</span>
            <input 
              type="number" 
              min={1} 
              max={10}
              value={settings.summarizeEveryNRounds || 2}
              onChange={(e) => onUpdateSettings({ ...settings, summarizeEveryNRounds: parseInt(e.target.value) || 2 })}
              className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-center font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
              id="input-summarize-rounds"
            />
          </div>

          {/* Discussion Complexity Slider */}
          <div className="pt-2.5 border-t border-slate-800 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Discussion Complexity</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">Level {settings.discussionComplexity ?? 3}</span>
            </div>
            
            <input 
              type="range" 
              min={1} 
              max={5}
              value={settings.discussionComplexity ?? 3}
              onChange={(e) => onUpdateSettings({ ...settings, discussionComplexity: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-900 cursor-pointer h-1 rounded-lg appearance-none"
              id="input-discussion-complexity"
            />
            
            <div className="flex justify-between text-[8px] font-mono text-slate-500 leading-none">
              <span>Minimal</span>
              <span>Standard</span>
              <span>Exhaustive</span>
            </div>
            
            <p className="text-[10px] text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-900 leading-normal font-sans">
              {(() => {
                switch(settings.discussionComplexity ?? 3) {
                  case 1:
                    return "⚡ Minimal: Ultra-short, direct, & rapid replies. Ideal for low-resource 1B-3B parameters local models.";
                  case 2:
                    return "✏️ Concise: Brief, fast, and lightweight responses. Optimized for 3B-7B parameters local models.";
                  case 3:
                    return "⚖️ Standard: Balanced depth and detailed analysis. Recommended default for standard setups.";
                  case 4:
                    return "📚 Comprehensive: In-depth arguments and robust concept mapping. Suited for 8B-14B parameters or Gemini.";
                  case 5:
                    return "🎓 Exhaustive: High-density, multi-layered academic analysis. Best for large 30B+ local models or Gemini.";
                  default:
                    return "⚖️ Standard: Balanced depth and detailed analysis.";
                }
              })()}
            </p>
          </div>

          {/* Max Rounds Setting */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Max Discussion Rounds</span>
            <select 
              value={settings.maxRounds === undefined ? -1 : settings.maxRounds}
              onChange={(e) => onUpdateSettings({ ...settings, maxRounds: parseInt(e.target.value) })}
              className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              id="select-max-rounds"
            >
              <option value={-1}>Ad-infinitum (Infinite)</option>
              <option value={3}>3 Rounds</option>
              <option value={5}>5 Rounds</option>
              <option value={10}>10 Rounds</option>
              <option value={15}>15 Rounds</option>
              <option value={20}>20 Rounds</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Topics / Conversation Launcher Form */}
      <div className="p-4 border-b border-slate-800">
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Topic for Reflection</label>
            <textarea
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Free will is an illusion created by complex cognitive algorithms."
              rows={3}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition resize-none placeholder:text-slate-600 font-sans"
              id="textarea-topic-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={multiAgent}
                  onChange={(e) => setMultiAgent(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                  id="checkbox-multi-agent"
                />
                <span className="text-[11px] text-slate-300">Multi-Agent Perspectives</span>
              </label>
            </div>

            {multiAgent && (() => {
              const agentConfigs = settings.agentConfigs || [
                { active: true, faith: 'Christianity' },
                { active: true, faith: 'Islam' },
                { active: true, faith: 'Judaism' },
                { active: false, faith: 'Hinduism' },
                { active: false, faith: 'Buddhism' }
              ];
              const activeCount = agentConfigs.filter(c => c.active).length;

              return (
                <div className="space-y-2.5 pl-5 py-2.5 pr-2 bg-slate-950/60 border border-slate-900 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-900">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active Representatives</span>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">
                      ({activeCount} active)
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {agentConfigs.map((cfg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border transition ${
                          cfg.active 
                            ? 'bg-slate-900/60 border-slate-800' 
                            : 'bg-slate-950/20 border-slate-950 opacity-40 hover:opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none">
                          <input 
                            type="checkbox" 
                            checked={cfg.active}
                            onChange={(e) => {
                              const newConfigs = [...agentConfigs];
                              newConfigs[idx] = { ...newConfigs[idx], active: e.target.checked };
                              onUpdateSettings({ ...settings, agentConfigs: newConfigs });
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-400 font-mono font-bold">#{idx + 1}</span>
                        </label>
                        
                        <select
                          value={cfg.faith}
                          disabled={!cfg.active}
                          onChange={(e) => {
                            const newConfigs = [...agentConfigs];
                            newConfigs[idx] = { ...newConfigs[idx], faith: e.target.value };
                            onUpdateSettings({ ...settings, agentConfigs: newConfigs });
                          }}
                          className={`px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-white focus:outline-none focus:border-emerald-500 max-w-[130px] truncate font-sans ${
                            !cfg.active ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          {AVAILABLE_FAITHS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <button
            type="submit"
            disabled={!newTopic.trim()}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg active:scale-[0.98] transition shadow-lg shadow-emerald-950/20"
            id="btn-launch-thread"
          >
            <Plus className="w-4 h-4" />
            Launch Socratic Sieve
          </button>
        </form>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">PERSISTED SIEVES ({threads.length})</span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition" 
              title="Import Thread"
              id="btn-import-thread"
            >
              <FileUp className="w-3.5 h-3.5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportThread(file);
              }} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 flex flex-col items-center gap-2 border border-dashed border-slate-800 rounded-lg p-4">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <p>No active reflection sieves.</p>
          </div>
        ) : (
          threads.map((t) => (
            <div 
              key={t.id}
              onClick={() => onSelectThread(t.id)}
              className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                activeThreadId === t.id 
                  ? 'bg-slate-800 border-emerald-500/50 text-white shadow-md shadow-slate-950/20' 
                  : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
              }`}
              id={`thread-item-${t.id}`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-semibold text-xs truncate max-w-full font-sans">
                  {t.title}
                </h4>
                <div className="flex gap-1.5 mt-1 text-[9px] font-mono text-slate-500">
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{t.messages.length} lines</span>
                  {t.settings.isMultiAgent && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">Multi</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportThread(t);
                  }}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded"
                  title="Export Thread"
                  id={`btn-export-${t.id}`}
                >
                  <FileDown className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(t.id);
                  }}
                  className="text-slate-400 hover:text-rose-400 p-1 hover:bg-slate-700 rounded"
                  title="Delete Thread"
                  id={`btn-delete-${t.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
        LOCAL STORAGE ACCESS • OFFLINE SECURE
      </div>
    </aside>
  );
}
