import React, { useState, useEffect, useRef } from 'react';
import { Thread, Message, Agent } from '../types';
import { 
  Play, Pause, ChevronRight, HelpCircle, Sparkles, 
  Trash2, Sliders, RefreshCw, Layers, Check, MessageSquare, AlertCircle, Edit3,
  FileDown, BookOpen, Clock, X, Copy, CheckSquare, GraduationCap
} from 'lucide-react';

interface SocraticDialoguePanelProps {
  thread: Thread | null;
  onInitiateInquiry: () => void;
  onTriggerNextTurn: () => void;
  onPauseSession: () => void;
  onTogglePlay: () => void;
  onResetSession: () => void;
  onUpdateThreadPrompts: (socraticPrompt: string, respondentPrompt: string) => void;
  isProcessing: boolean;
  activeAgentId: string | null;
  isPaused: boolean;
  onGenerateFieldReport: () => Promise<void>;
  isGeneratingFieldReport: boolean;
  onGeneratePhdProposal: () => Promise<void>;
  isGeneratingPhdProposal: boolean;
}

// Simple component to format text paragraphs and bold matches, compatible with React 19
function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  
  // Split by double newline to get paragraphs
  const paragraphs = text.split('\n\n');
  
  return (
    <div className="space-y-3 font-sans text-slate-300 text-xs sm:text-sm leading-relaxed">
      {paragraphs.map((p, pIdx) => {
        // Handle bullet points
        if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
          const items = p.split(/\n[-*]\s+/);
          return (
            <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
              {items.map((item, itemIdx) => {
                const cleanedItem = item.replace(/^[-*]\s+/, '').trim();
                if (!cleanedItem) return null;
                return <li key={itemIdx}>{formatBoldText(cleanedItem)}</li>;
              })}
            </ul>
          );
        }
        
        // Handle numbered items
        if (/^\d+\.\s+/.test(p.trim())) {
          const items = p.split(/\n\d+\.\s+/);
          return (
            <ol key={pIdx} className="list-decimal pl-5 space-y-1.5 my-2">
              {items.map((item, itemIdx) => {
                const cleanedItem = item.replace(/^\d+\.\s+/, '').trim();
                if (!cleanedItem) return null;
                return <li key={itemIdx}>{formatBoldText(cleanedItem)}</li>;
              })}
            </ol>
          );
        }

        // Standard paragraph
        return (
          <p key={pIdx}>
            {p.split('\n').map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {formatBoldText(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// Helper to format text with **bold** matches
function formatBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function SocraticDialoguePanel({
  thread,
  onInitiateInquiry,
  onTriggerNextTurn,
  onPauseSession,
  onTogglePlay,
  onResetSession,
  onUpdateThreadPrompts,
  isProcessing,
  activeAgentId,
  isPaused,
  onGenerateFieldReport,
  isGeneratingFieldReport,
  onGeneratePhdProposal,
  isGeneratingPhdProposal,
}: SocraticDialoguePanelProps) {
  const [showPromptsConfig, setShowPromptsConfig] = useState(false);
  const [socraticPrompt, setSocraticPrompt] = useState('');
  const [respondentPrompt, setRespondentPrompt] = useState('');
  const [showSummary, setShowSummary] = useState(true);
  
  // Modals / Overlays States
  const [showSummaryHistory, setShowSummaryHistory] = useState(false);
  const [selectedSummaryIdx, setSelectedSummaryIdx] = useState<number>(-1);
  const [showScribeModal, setShowScribeModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showPhdModal, setShowPhdModal] = useState(false);
  const [copiedPhd, setCopiedPhd] = useState(false);

  const handleCopyPhdToClipboard = () => {
    if (!thread || !thread.phdProposal) return;
    navigator.clipboard.writeText(thread.phdProposal);
    setCopiedPhd(true);
    setTimeout(() => setCopiedPhd(false), 2000);
  };

  const formatMarkdownToHTML = (md: string): string => {
    if (!md) return '';
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\-\s+(.*$)/gim, '<li>$1</li>')
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('<li>')) {
          return line;
        }
        return line ? `<p>${line}</p>` : '';
      })
      .join('\n');
  };

  const handleExportPhdToHTML = () => {
    if (!thread || !thread.phdProposal) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interfaith Synthesis Report: ${thread.topic}</title>
    <style>
        body {
            background-color: #0b0f19;
            color: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.7;
            padding: 40px 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .header {
            border-bottom: 2px solid #8b5cf6;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }
        .institution {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #a78bfa;
            font-weight: 700;
            margin: 0 0 8px 0;
        }
        h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 800;
            margin: 0;
            line-height: 1.3;
        }
        h2 {
            color: #c084fc;
            font-size: 18px;
            font-weight: 700;
            margin-top: 32px;
            margin-bottom: 16px;
            border-bottom: 1px solid #374151;
            padding-bottom: 8px;
        }
        h3 {
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 12px;
        }
        p, li {
            color: #d1d5db;
            font-size: 14px;
        }
        ul, ol {
            padding-left: 20px;
            margin-bottom: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .footer {
            margin-top: 48px;
            border-top: 1px solid #1f2937;
            padding-top: 16px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        code {
            background-color: #1f2937;
            color: #c084fc;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 85%;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <p class="institution">Interfaith Epistemic Cartography • Interfaith Socratic Cartographer v1</p>
            <h1>Debate Synthesis & Evaluation</h1>
        </div>
        <div class="content">
            ${formatMarkdownToHTML(thread.phdProposal)}
        </div>
        <div class="footer">
            Generated via Synthesis & Evaluation Agent • Interfaith Socratic Cartography Engine
        </div>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = downloadUrl;
    downloadAnchor.download = `Synthesis_Report_${thread.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize prompts when thread loads
  useEffect(() => {
    if (thread) {
      setSocraticPrompt(thread.settings.socraticPrompt);
      setRespondentPrompt(thread.settings.respondentPrompt);
    }
  }, [thread?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [thread?.messages?.length, activeAgentId, isProcessing]);

  if (!thread) {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-sans font-bold text-white text-lg tracking-tight">Interfaith Epistemic Cartography</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Welcome to the Interfaith Socratic Cartographer. Select an existing comparative thread from the sidebar or input a complex theological/moral topic to start mapping faith traditions.
            </p>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl text-left text-[11px] font-mono text-slate-500 space-y-2 leading-relaxed">
            <p>💡 <span className="text-slate-300">Socratic Questioner</span> will challenge assumptions without personal investment.</p>
            <p>💡 <span className="text-slate-300">Multi-Agent Mode</span> auto-generates custom perspectives to analyze the topic comprehensively.</p>
            <p>💡 <span className="text-slate-300">Recursive Summarization</span> triggers when the dialogue context is reached to keep dialogue coherent.</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePromptsSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateThreadPrompts(socraticPrompt, respondentPrompt);
    setShowPromptsConfig(false);
  };

  const getAgentAvatar = (senderId: string) => {
    const agent = thread.agents.find((a) => a.id === senderId);
    if (agent) {
      return (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${agent.avatarColor || 'bg-blue-600'}`}>
          {agent.name.charAt(0)}
        </div>
      );
    }
    
    // Fallback/Default
    if (senderId === 'user') {
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-950 bg-white text-xs">
          U
        </div>
      );
    }
    
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white bg-slate-600 text-xs">
        ?
      </div>
    );
  };

  const getAgentLabel = (message: Message) => {
    const agent = thread.agents.find((a) => a.id === message.senderId);
    if (agent) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-xs font-sans">{agent.name}</span>
          {agent.perspectiveName && (
            <span className="text-[10px] text-slate-400 font-mono">[{agent.perspectiveName}]</span>
          )}
        </div>
      );
    }
    return <span className="font-bold text-white text-xs font-sans">{message.senderName}</span>;
  };

  // HTML Export Handler
  const handleExportToHTML = () => {
    const title = thread.topic;
    
    // Determine which transcript messages to use (prefer unpruned fullMessages if available)
    const transcriptMessages = thread.fullMessages && thread.fullMessages.length > 0 
      ? thread.fullMessages 
      : thread.messages;

    const messagesHtml = transcriptMessages.map((m) => {
      const isSocratic = m.senderId === 'socratic';
      const isSystem = m.role === 'system';
      
      if (isSystem) {
        return `
          <div style="display: flex; justify-content: center; margin: 24px 0;">
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 16px; border-radius: 9999px; font-size: 11px; font-family: monospace; color: #10b981;">
              ✦ ${m.content}
            </div>
          </div>
        `;
      }

      const agent = thread.agents.find(a => a.id === m.senderId);
      const agentName = agent ? agent.name : m.senderName;
      const perspective = agent?.perspectiveName ? ` [${agent.perspectiveName}]` : '';
      
      return `
        <div style="margin-bottom: 24px; padding-left: ${isSocratic ? '0' : '24px'}; max-width: 800px; margin-left: auto; margin-right: auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: #ffffff; font-size: 13px; font-family: system-ui, sans-serif;">${agentName}</strong>
              <span style="font-size: 11px; font-family: monospace; color: #94a3b8;">${perspective}</span>
            </div>
            <span style="font-size: 10px; font-family: monospace; color: #64748b;">${new Date(m.timestamp).toLocaleTimeString()}</span>
          </div>
          <div style="background: ${isSocratic ? '#090d16' : '#111827'}; border: 1px solid ${isSocratic ? 'rgba(16, 185, 129, 0.2)' : '#1f2937'}; padding: 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; color: #d1d5db;">
            ${m.content.replace(/\n/g, '<br />')}
          </div>
        </div>
      `;
    }).join('');

    const displayReportText = thread.epistemicStateReport || thread.summaryOfEarlierDialogue || '';
    const summaryHtml = displayReportText ? `
      <div style="background: #090d16; border: 1px solid #1e293b; padding: 24px; border-radius: 16px; margin-bottom: 40px; max-width: 800px; margin-left: auto; margin-right: auto;">
        <h3 style="color: #10b981; font-family: system-ui, sans-serif; font-size: 16px; margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          ✦ Interfaith State Report (ISR)
        </h3>
        <div style="color: #cbd5e1; font-size: 13px; line-height: 1.6; font-family: system-ui, sans-serif;">
          ${displayReportText.replace(/\n/g, '<br />')}
        </div>
      </div>
    ` : '';

    // Render claims background reasoning/analytics (Epistemic Claims Topology)
    const claims = thread.claims || [];
    const claimsHtml = claims.length > 0 ? `
      <div style="background: #020617; border: 1px solid #1e293b; padding: 24px; border-radius: 16px; margin-bottom: 40px; max-width: 800px; margin-left: auto; margin-right: auto;">
        <h3 style="color: #10b981; font-family: system-ui, sans-serif; font-size: 16px; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          ✦ Theological Claims Topology Map
        </h3>
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${claims.map((c, i) => `
            <div style="background: #0b0f19; border: 1px solid #1f2937; padding: 16px; border-radius: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1f2937; padding-bottom: 8px;">
                <span style="font-size: 11px; font-family: monospace; color: #10b981;">Claim #${i + 1} - ${c.status.toUpperCase()}</span>
                <span style="font-size: 11px; font-family: monospace; color: #94a3b8;">Source: ${c.sourceAgentName} (Round ${c.generationRound || 1})</span>
              </div>
              <div style="margin-bottom: 10px;">
                <strong style="font-size: 13px; color: #f3f4f6; display: block; margin-bottom: 4px;">Statement (Conceptual Layer):</strong>
                <span style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">${c.statement}</span>
              </div>
              <div style="margin-bottom: 10px; padding-left: 12px; border-left: 2px dashed #1e293b;">
                <strong style="font-size: 12px; color: #94a3b8; display: block; margin-bottom: 2px;">Doctrinal & Scriptural Foundations:</strong>
                <span style="font-size: 12px; color: #94a3b8; line-height: 1.4;">${c.operationalisation || 'None provided'}</span>
              </div>
              ${c.disagreement ? `
                <div style="margin-bottom: 10px; padding-left: 12px; border-left: 2px dashed #ef4444;">
                  <strong style="font-size: 12px; color: #ef4444; display: block; margin-bottom: 2px;">Observer Disagreement:</strong>
                  <span style="font-size: 12px; color: #94a3b8; line-height: 1.4;">${c.disagreement}</span>
                </div>
              ` : ''}
              ${c.normativeLoad ? `
                <div style="margin-bottom: 10px; padding-left: 12px; border-left: 2px dashed #f59e0b;">
                  <strong style="font-size: 12px; color: #f59e0b; display: block; margin-bottom: 2px;">Normative/Value Load:</strong>
                  <span style="font-size: 12px; color: #94a3b8; line-height: 1.4;">${c.normativeLoad}</span>
                </div>
              ` : ''}
              <div style="display: flex; gap: 16px; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #1e293b; font-size: 11px; font-family: monospace; color: #64748b;">
                <span>Stability Score: ${(c.stabilityScore ?? 0.5).toFixed(2)}</span>
                <span>Disagreement Density: ${(c.disagreementDensity ?? 0.0).toFixed(2)}</span>
                <span>Observable: ${c.observable || 'N/A'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Render agents evolution profiles
    const agents = thread.agents || [];
    const agentsHtml = agents.length > 0 ? `
      <div style="background: #020617; border: 1px solid #1e293b; padding: 24px; border-radius: 16px; margin-bottom: 40px; max-width: 800px; margin-left: auto; margin-right: auto;">
        <h3 style="color: #10b981; font-family: system-ui, sans-serif; font-size: 16px; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          ✦ Faith Representative Profiles & Stances
        </h3>
        <div style="display: flex; flex-direction: column; gap: 24px;">
          ${agents.map((a) => `
            <div style="background: #0b0f19; border: 1px solid #1f2937; padding: 16px; border-radius: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #1f2937; padding-bottom: 8px;">
                <span style="font-size: 14px; font-weight: bold; color: #ffffff;">${a.name}</span>
                <span style="font-size: 11px; font-family: monospace; color: #10b981;">${a.perspectiveName || a.role}</span>
              </div>
              <div style="display: flex; gap: 24px; margin-bottom: 12px; font-size: 12px; font-family: monospace;">
                <div><span style="color: #64748b;">Initial Stance:</span> <strong style="color: #3b82f6;">${(a.initialPosition || 'undecided').toUpperCase()}</strong></div>
                <div><span style="color: #64748b;">Current Stance:</span> <strong style="color: #10b981;">${(a.currentPosition || 'undecided').toUpperCase()}</strong></div>
              </div>
              <div style="margin-bottom: 12px;">
                <strong style="font-size: 12px; color: #94a3b8; display: block; margin-bottom: 4px;">Key Salient Points Proposed:</strong>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                  ${(a.salientPoints || []).map(p => `<li style="margin-bottom: 4px;">${p}</li>`).join('')}
                </ul>
              </div>
              ${a.positionHistory && a.positionHistory.length > 0 ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #1e293b;">
                  <strong style="font-size: 11px; color: #64748b; font-family: monospace; display: block; margin-bottom: 6px;">Stance Evolution Logs:</strong>
                  <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px; font-family: system-ui, sans-serif;">
                    ${a.positionHistory.map(h => `
                      <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; border-left: 2px solid #10b981;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-family: monospace; color: #94a3b8;">
                          <span>Shifted to: <strong>${h.position.toUpperCase()}</strong></span>
                          <span>${new Date(h.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div style="color: #cbd5e1;">${h.explanation}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Socratic Sieve - ${title}</title>
  <style>
    body {
      background-color: #030712;
      color: #f3f4f6;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 12px;
      font-family: monospace;
      color: #10b981;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 24px;
    }
    hr {
      border: 0;
      border-top: 1px solid #1f2937;
      margin: 40px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; margin-bottom: 48px;">
      <div class="subtitle">Socratic Sieve Full Debate Export</div>
      <h1>${title}</h1>
      <p style="color: #94a3b8; font-size: 13px; font-family: monospace; margin-top: 12px;">Exported on: ${new Date().toLocaleString()}</p>
    </div>
    
    ${summaryHtml}

    ${claimsHtml}

    ${agentsHtml}
    
    <hr />

    <div style="margin-top: 40px;">
      <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 24px; max-width: 800px; margin-left: auto; margin-right: auto;">Complete Dialogue Transcript</h2>
      ${messagesHtml}
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sieve-debate-${thread.id}-${Date.now()}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  // Copy field report text to clipboard
  const handleCopyFieldReportToClipboard = () => {
    const reportText = thread.fieldReport || thread.blogPost || '';
    if (reportText) {
      navigator.clipboard.writeText(reportText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const activeStateReport = thread ? (thread.epistemicStateReport || thread.summaryOfEarlierDialogue || '') : '';

  const currentDisplayedSummary = selectedSummaryIdx === -1 
    ? activeStateReport 
    : (thread && thread.summaryHistory && thread.summaryHistory[selectedSummaryIdx]?.text) || '';

  const displayMessages = thread 
    ? (thread.fullMessages && thread.fullMessages.length > 0 ? thread.fullMessages : thread.messages) 
    : [];

  return (
    <div className="flex-1 bg-slate-900 flex flex-col h-full overflow-hidden select-none relative">
      
      {/* Dialogue Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-950 gap-3 z-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider">
              Topic Sieve
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Limit: {thread.messages.filter(m => !m.isSummary).length} / {thread.settings.maxContextMessages} turns before Summarizer
            </span>
            {thread.settings.maxRounds && thread.settings.maxRounds > 0 && (
              <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                Round: {thread.currentRound} / {thread.settings.maxRounds} Limit
              </span>
            )}
          </div>
          <h2 className="font-bold text-white text-sm truncate font-sans mt-1" title={thread.topic}>
            {thread.topic}
          </h2>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Export HTML Button */}
          <button
            onClick={handleExportToHTML}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 rounded-lg font-semibold text-xs transition"
            title="Export full transcript as custom-styled HTML document"
            id="btn-export-html"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export HTML
          </button>

          {/* Epistemic Field Report Button */}
          <button
            onClick={() => {
              setShowScribeModal(true);
              if (!(thread.fieldReport || thread.blogPost)) {
                onGenerateFieldReport();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-900/40 rounded-lg font-semibold text-xs transition"
            title="Scribe the complete Dialectical Field Report containing unresolved variables, competing observer dualities, and value assumptions"
            id="btn-scribe-field-report"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Epistemic Field Report
          </button>

          {/* Debate Synthesis & Evaluation Button */}
          <button
            onClick={() => {
              setShowPhdModal(true);
              if (!thread.phdProposal) {
                onGeneratePhdProposal();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-950/40 border border-violet-500/30 text-violet-300 hover:text-white hover:bg-violet-900/40 rounded-lg font-semibold text-xs transition"
            title="Synthesis & Evaluation: Summarise debate, map convergence/divergence, evaluate claims, ask future questions"
            id="btn-phd-proposal"
          >
            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
            Synthesis & Evaluation
          </button>

          <button
            onClick={() => setShowPromptsConfig(!showPromptsConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg font-semibold text-xs transition select-none ${
              showPromptsConfig 
                ? 'bg-slate-850 border-emerald-500 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
            id="btn-toggle-prompts"
          >
            <Sliders className="w-3.5 h-3.5" />
            Prompts
          </button>
          
          <button
            onClick={onResetSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg font-semibold text-xs active:scale-[0.98] transition"
            title="Reset Conversation"
            id="btn-reset-conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Prompts Customizer Panel */}
      {showPromptsConfig && (
        <form onSubmit={handlePromptsSave} className="p-4 bg-slate-950 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in slide-in-from-top duration-200 z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Socratic Prompt Base</label>
            <textarea
              value={socraticPrompt}
              onChange={(e) => setSocraticPrompt(e.target.value)}
              rows={4}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
              id="textarea-edit-socratic"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Respondent Prompt Base</label>
            <textarea
              value={respondentPrompt}
              onChange={(e) => setRespondentPrompt(e.target.value)}
              rows={4}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
              id="textarea-edit-respondent"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-1">
            <button 
              type="button" 
              onClick={() => setShowPromptsConfig(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded"
              id="btn-save-prompts"
            >
              <Check className="w-3.5 h-3.5" /> Save Templates
            </button>
          </div>
        </form>
      )}

      {/* Message History Transcript Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-900/40 scroll-smooth"
      >
        {displayMessages.length > 0 && (
          <div className="mx-auto max-w-4xl bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 mb-6 shadow-sm flex items-start gap-3 animate-in fade-in duration-300">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Active Inquiry Topic</span>
              <h3 className="text-xs sm:text-sm font-semibold text-white font-sans tracking-tight leading-snug">{thread.topic}</h3>
            </div>
          </div>
        )}

        {displayMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-sm space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl w-12 h-12 flex items-center justify-center text-emerald-400 mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm font-sans">Awaiting Inquiry Launch</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  The room is populated with agents representing different perspectives. Start the Socratic investigation to drive forward reflection.
                </p>
              </div>
              <button
                onClick={onInitiateInquiry}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg active:scale-[0.98] transition shadow-lg shadow-emerald-950/30"
                id="btn-initiate-dialogue"
              >
                Initiate Socratic Inquiry
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          displayMessages.map((message) => {
            const isSocratic = message.senderId === 'socratic';
            const isSystemMarker = message.role === 'system';
            
            if (isSystemMarker) {
              return (
                <div key={message.id} className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-emerald-500/20 rounded-full text-[11px] text-emerald-400 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{message.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={message.id}
                className={`flex gap-3 max-w-4xl animate-in fade-in slide-in-from-bottom duration-300 ${
                  isSocratic ? 'mx-auto w-full' : 'ml-4 sm:ml-8'
                }`}
                id={`message-bubble-${message.id}`}
              >
                <div className="shrink-0">
                  {getAgentAvatar(message.senderId)}
                </div>
                
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    {getAgentLabel(message)}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border leading-relaxed text-sm ${
                    isSocratic 
                      ? 'bg-slate-950/60 border-emerald-500/20 text-white shadow-md' 
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  }`}>
                    <FormattedText text={message.content} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Thinking Indicator Animation */}
        {isProcessing && activeAgentId && (
          <div className="flex gap-3 max-w-4xl ml-4 sm:ml-8 animate-pulse">
            <div className="shrink-0">
              {getAgentAvatar(activeAgentId)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                <span className="font-bold text-white text-xs font-sans">
                  {thread.agents.find(a => a.id === activeAgentId)?.name || 'Agent'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono ml-2 font-semibold animate-pulse text-emerald-400">Thinking...</span>
              </div>
              <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-500 font-mono select-none">Retrieving philosophical perspective...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Toolbar Panel */}
      {displayMessages.length > 0 && (
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 select-none z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-md transition active:scale-[0.98] ${
                isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20' 
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/20'
              }`}
              id="btn-toggle-play"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Sieve
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  Pause Sieve
                </>
              )}
            </button>

            <button
              onClick={onTriggerNextTurn}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg font-bold text-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition"
              id="btn-step-turn"
            >
              <ChevronRight className="w-4 h-4" />
              Step Turn
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Status updates */}
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              {isProcessing ? (
                <span className="flex items-center gap-1.5 text-emerald-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Active LLM Cycle Running
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  {isPaused ? 'Dialogue Paused' : 'Awaiting Next Trigger'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popover overlay for Historical Distilled Summaries */}
      {showSummaryHistory && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[80vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Clock className="w-5 h-5" />
                <h3 className="font-bold text-sm font-sans text-white">Historical Summary Timeline</h3>
              </div>
              <button 
                onClick={() => setShowSummaryHistory(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Select Distilled Version</label>
                <select
                  value={selectedSummaryIdx}
                  onChange={(e) => setSelectedSummaryIdx(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  id="select-historical-summary-item"
                >
                  <option value={-1}>Latest Distilled Summary (Active Transcript)</option>
                  {(thread.summaryHistory || []).map((hist, idx) => (
                    <option key={idx} value={idx}>
                      Milestone Distillation {idx + 1} - {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl max-h-96 overflow-y-auto">
                {currentDisplayedSummary ? (
                  <FormattedText text={currentDisplayedSummary} />
                ) : (
                  <p className="text-xs text-slate-500 italic font-sans py-4 text-center">
                    No summary is generated for this state yet. Complete more turns to trigger summarization.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSummaryHistory(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Epistemic Field Report Modal overlay */}
      {showScribeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm font-sans text-white">Epistemic Field Scribe</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Dialectical Topology Analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setShowScribeModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {isGeneratingFieldReport ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                  <div className="text-center">
                    <p className="text-xs text-slate-200 font-semibold font-sans">Compiling Epistemic Field Report...</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Reviewing unresolved variables, competing observer models, and normative load assumptions.</p>
                  </div>
                </div>
              ) : (thread.fieldReport || thread.blogPost) ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-indigo-950/20 border border-indigo-950 px-4 py-2.5 rounded-lg text-xs text-indigo-300">
                    <span className="font-sans">📄 Field report compiled. Strictly non-reducible with zero narrative consensus.</span>
                    <button
                      onClick={handleCopyFieldReportToClipboard}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-900/40 hover:bg-indigo-900/60 text-white rounded font-mono text-[10px] transition"
                    >
                      {copiedText ? <CheckSquare className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedText ? 'Copied' : 'Copy Report'}
                    </button>
                  </div>

                  <div className="p-6 bg-slate-950 border border-slate-850 rounded-xl max-h-[50vh] overflow-y-auto prose prose-invert font-sans leading-relaxed selection:bg-indigo-500/30">
                    <FormattedText text={thread.fieldReport || thread.blogPost || ''} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <BookOpen className="w-12 h-12 text-slate-700 mx-auto" />
                  <div className="max-w-xs mx-auto">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Scribe has not compiled the dialectical field topology. Initiate generation to produce the EFR.
                    </p>
                  </div>
                  <button
                    onClick={onGenerateFieldReport}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Draft Field Report Now
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-between gap-2">
              <button
                onClick={onGenerateFieldReport}
                disabled={isGeneratingFieldReport}
                className="px-3.5 py-1.5 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 text-xs font-semibold rounded-lg transition disabled:opacity-50"
              >
                Regenerate Report
              </button>

              <button
                onClick={() => setShowScribeModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Close Scribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PhD Thesis Proposal Modal overlay */}
      {showPhdModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-violet-400">
                <GraduationCap className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="font-bold text-sm font-sans text-white">Interfaith Synthesis & Evaluation Expert</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Debate Summarization, Convergence/Divergence Mapping & Claims Evaluation</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPhdModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {isGeneratingPhdProposal ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-violet-400" />
                  <div className="text-center">
                    <p className="text-xs text-slate-200 font-semibold font-sans">Synthesizing & Evaluating Debate...</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Extracting key claims, mapping shared agreements, identifying differences, and compiling future questions.</p>
                  </div>
                </div>
              ) : thread.phdProposal ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-violet-950/20 border border-violet-950/50 px-4 py-2.5 rounded-lg text-xs text-violet-300">
                    <span className="font-sans flex items-center gap-1.5">🎓 Interfaith Synthesis & Evaluation Report completed. Ready for export.</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyPhdToClipboard}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-[10px] transition"
                      >
                        {copiedPhd ? <CheckSquare className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedPhd ? 'Copied' : 'Copy markdown'}
                      </button>
                      <button
                        onClick={handleExportPhdToHTML}
                        className="flex items-center gap-1 px-2.5 py-1 bg-violet-800 hover:bg-violet-700 text-white rounded font-mono text-[10px] transition"
                      >
                        <FileDown className="w-3 h-3" />
                        Export HTML
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-950 border border-slate-850 rounded-xl max-h-[50vh] overflow-y-auto prose prose-invert font-sans leading-relaxed selection:bg-violet-500/30">
                    <FormattedText text={thread.phdProposal} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <GraduationCap className="w-12 h-12 text-slate-700 mx-auto" />
                  <div className="max-w-xs mx-auto">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      The synthesis expert has not yet analyzed the active Socratic claim topology and dialogue of this thread.
                    </p>
                  </div>
                  <button
                    onClick={onGeneratePhdProposal}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Synthesize & Evaluate Debate Now
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-between gap-2">
              <button
                onClick={onGeneratePhdProposal}
                disabled={isGeneratingPhdProposal}
                className="px-3.5 py-1.5 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 text-xs font-semibold rounded-lg transition disabled:opacity-50"
              >
                Regenerate Synthesis
              </button>

              <button
                onClick={() => setShowPhdModal(false)}
                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Close Synthesis
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
