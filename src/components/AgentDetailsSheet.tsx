import React, { useState } from 'react';
import { Agent, AgentPosition } from '../types';
import { X, Check, Edit2, Save, Sparkles, BookOpen, Clock, Lightbulb, Shield, HelpCircle, FileText } from 'lucide-react';

interface AgentDetailsSheetProps {
  agent: Agent;
  onClose: () => void;
  onUpdateAgentProperties: (
    agentId: string, 
    updates: { 
      name?: string; 
      perspectiveName?: string; 
      characterPrompt?: string; 
      personalityType?: string; 
      bias?: string; 
    }
  ) => void;
}

export default function AgentDetailsSheet({
  agent,
  onClose,
  onUpdateAgentProperties,
}: AgentDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(agent.name);
  const [perspectiveName, setPerspectiveName] = useState(agent.perspectiveName || '');
  const [personalityType, setPersonalityType] = useState(agent.personalityType || '');
  const [bias, setBias] = useState(agent.bias || '');
  const [characterPrompt, setCharacterPrompt] = useState(agent.characterPrompt);

  const handleSave = () => {
    onUpdateAgentProperties(agent.id, {
      name,
      perspectiveName: agent.role !== 'refuter' ? perspectiveName : undefined,
      personalityType: agent.role !== 'refuter' ? personalityType : undefined,
      bias: agent.role !== 'refuter' ? bias : undefined,
      characterPrompt
    });
    setIsEditing(false);
  };

  const getPositionColor = (pos: AgentPosition) => {
    switch (pos) {
      case 'agree': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'disagree': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'neutral': return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col select-none text-slate-200">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${agent.avatarColor || 'bg-emerald-500'}`}>
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm font-sans">{name}</h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {agent.role === 'refuter' ? 'Socratic Refuter' : (perspectiveName || 'Dialogue Respondent')}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          id="btn-close-agent-details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Profile Mode Toggle */}
        <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Agent Configuration</span>
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded transition"
              id="btn-save-agent-properties"
            >
              <Save className="w-3.5 h-3.5" /> Save Persona
            </button>
          ) : (
            <button 
              onClick={() => {
                setName(agent.name);
                setPerspectiveName(agent.perspectiveName || '');
                setPersonalityType(agent.personalityType || '');
                setBias(agent.bias || '');
                setCharacterPrompt(agent.characterPrompt);
                setIsEditing(true);
              }}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 py-1 rounded transition"
              id="btn-edit-agent-properties"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Persona
            </button>
          )}
        </div>

        {/* Edit fields if editing, otherwise view profile */}
        {isEditing ? (
          <div className="space-y-4 bg-slate-950/20 p-4 border border-slate-850 rounded-xl">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Identity Details</h4>
            
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase">Agent Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {agent.role !== 'refuter' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Perspective Name</label>
                  <input 
                    type="text" 
                    value={perspectiveName}
                    onChange={(e) => setPerspectiveName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Personality Type / Trait</label>
                  <input 
                    type="text" 
                    value={personalityType}
                    placeholder="e.g. Analytical, Skeptic, Pragmatic"
                    onChange={(e) => setPersonalityType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Core Cognitive Bias</label>
                  <input 
                    type="text" 
                    value={bias}
                    placeholder="e.g. Values efficiency over human factors"
                    onChange={(e) => setBias(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase">System Prompt Instruction</label>
              <textarea 
                value={characterPrompt}
                rows={6}
                onChange={(e) => setCharacterPrompt(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono resize-none leading-relaxed"
              />
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Personality Card Profile */}
            {agent.role !== 'refuter' && (
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  Cognitive Profile
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">Personality Type</span>
                    <span className="text-white font-medium">{personalityType || 'Analytical'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">Role Stance</span>
                    <span className="text-white font-medium font-mono uppercase text-[10px]">{agent.currentPosition}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Preconception / Bias</span>
                  <p className="text-slate-300 italic text-xs">
                    {bias ? `"${bias}"` : '"None assigned. Driven by standard dialogics."'}
                  </p>
                </div>
              </div>
            )}

            {/* Positions Summary (Initial vs Current) */}
            {agent.role !== 'refuter' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Initial Position</span>
                  <span className={`inline-block px-2 py-0.5 mt-1 border rounded-full text-xs font-mono capitalize ${getPositionColor(agent.initialPosition)}`}>
                    {agent.initialPosition}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Current Position</span>
                  <span className={`inline-block px-2 py-0.5 mt-1 border rounded-full text-xs font-mono capitalize ${getPositionColor(agent.currentPosition)}`}>
                    {agent.currentPosition}
                  </span>
                </div>
              </div>
            )}

            {/* Character System Prompt */}
            <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
              <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Character System Prompt
              </h4>
              <div className="p-2.5 bg-slate-900/60 border border-slate-850/80 rounded font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {characterPrompt}
              </div>
            </div>
          </div>
        )}

        {/* Salient Points */}
        {agent.role !== 'refuter' && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              Salient Points Captured ({agent.salientPoints.length})
            </h4>
            {agent.salientPoints.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-950/20 border border-slate-850/60 border-dashed rounded-lg">
                No major insights recorded yet. Let the socratic inquiry begin.
              </p>
            ) : (
              <div className="space-y-2">
                {agent.salientPoints.map((point, index) => (
                  <div key={index} className="flex gap-2 p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-xs leading-relaxed">
                    <span className="text-emerald-400 font-mono shrink-0">#{index+1}</span>
                    <p className="text-slate-300 font-sans">"{point}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cognitive Position Shifts Timeline */}
        {agent.role !== 'refuter' && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Stance Evolution History
            </h4>
            {agent.positionHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-950/20 border border-slate-850/60 border-dashed rounded-lg">
                Evolution metrics populate after dialogue turns complete.
              </p>
            ) : (
              <div className="relative pl-4 border-l border-slate-800 space-y-4">
                {agent.positionHistory.map((hist, index) => (
                  <div key={index} className="relative">
                    {/* Visual dot on timeline */}
                    <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      hist.position === 'agree' ? 'bg-emerald-500' : hist.position === 'disagree' ? 'bg-rose-500' : 'bg-slate-400'
                    }`} />
                    
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${getPositionColor(hist.position)}`}>
                          {hist.position}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1.5 text-slate-300 leading-relaxed font-sans">
                        {hist.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
