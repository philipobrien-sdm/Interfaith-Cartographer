import React, { useState, useEffect, useRef } from 'react';
import { Agent, Claim, ClaimLifecycle, ConceptLifecycle, ObservationCategory, DisagreementTaxonomyType } from '../types';
import { 
  HelpCircle, ChevronRight, Activity, Shield, AlertTriangle, CheckCircle2, 
  User, Layers, Info, Filter, GitBranch, Share2, Compass, AlertCircle, Sparkles, Check, Database
} from 'lucide-react';

interface EpistemicTopologyMapProps {
  agents: Agent[];
  claims: Claim[];
  activeAgentId: string | null;
  isThinking: boolean;
  onSelectAgent: (agent: Agent) => void;
  socraticName: string;
}

export default function EpistemicTopologyMap({
  agents,
  claims,
  activeAgentId,
  isThinking,
  onSelectAgent,
  socraticName,
}: EpistemicTopologyMapProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cartography' | 'audit' | 'emergence'>('cartography');
  
  // Filtering & Focus States
  const [originFilter, setOriginFilter] = useState<'all' | 'user' | 'emergent' | 'operational_proxy' | 'normative_abstraction'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Direct' | 'Composite' | 'Latent' | 'Theoretical'>('all');
  const [focusRootAssumptions, setFocusRootAssumptions] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Default selected claim
  useEffect(() => {
    if (claims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(claims[0].id);
    }
  }, [claims, selectedClaimId]);

  const activeClaim = claims.find((c) => c.id === selectedClaimId) || (claims.length > 0 ? claims[0] : null);

  // Helper to detect if a concept is a Root Assumption
  // (i.e., others depend on it, but it has no dependencies of its own)
  const isRootAssumption = (claim: Claim) => {
    const hasDownstream = claims.some(c => c.dependencies?.includes(claim.id));
    const hasNoUpstream = !claim.dependencies || claim.dependencies.length === 0;
    return hasDownstream && hasNoUpstream;
  };

  // Status badges & coloring configs
  const getLifecycleConfig = (lifecycle?: ConceptLifecycle) => {
    const lc = lifecycle || 'Introduced';
    switch (lc) {
      case 'Established Construct':
        return {
          badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          bg: 'bg-emerald-950/20',
          text: 'text-emerald-300'
        };
      case 'Operationalised':
        return {
          badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          dot: 'bg-cyan-400',
          bg: 'bg-cyan-950/10',
          text: 'text-cyan-300'
        };
      case 'Operational Candidate':
        return {
          badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          dot: 'bg-sky-400',
          bg: 'bg-sky-950/10',
          text: 'text-sky-300'
        };
      case 'Tentative':
        return {
          badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          bg: 'bg-amber-950/10',
          text: 'text-amber-300'
        };
      case 'Introduced':
        return {
          badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          dot: 'bg-indigo-400',
          bg: 'bg-indigo-950/10',
          text: 'text-indigo-300'
        };
      case 'Collapsed':
      case 'Deprecated':
        return {
          badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400 line-through',
          dot: 'bg-rose-500',
          bg: 'bg-rose-950/20',
          text: 'text-rose-300/70'
        };
      default:
        return {
          badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          dot: 'bg-slate-400',
          bg: 'bg-slate-900/40',
          text: 'text-slate-300'
        };
    }
  };

  const getCategoryConfig = (category?: ObservationCategory) => {
    const cat = category || 'Latent Construct';
    switch (cat) {
      case 'Direct Observation':
        return {
          title: 'Direct Observation',
          border: 'border-teal-500/40',
          bg: 'bg-teal-950/20 hover:bg-teal-950/30',
          glow: 'shadow-[0_0_12px_rgba(20,184,166,0.05)]',
          badge: 'bg-teal-400/10 border-teal-400/20 text-teal-300',
          bullet: 'bg-teal-400'
        };
      case 'Composite Observable':
        return {
          title: 'Composite Observable',
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-950/20 hover:bg-cyan-950/30',
          glow: 'shadow-[0_0_12px_rgba(6,182,212,0.05)]',
          badge: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-300',
          bullet: 'bg-cyan-400'
        };
      case 'Latent Construct':
        return {
          title: 'Latent Construct',
          border: 'border-dashed border-indigo-400/40',
          bg: 'bg-slate-900/60 hover:bg-slate-900/80',
          glow: 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]',
          badge: 'bg-indigo-400/10 border-indigo-400/20 text-indigo-300',
          bullet: 'bg-indigo-400'
        };
      case 'Pure Theoretical Construct':
        return {
          title: 'Pure Theoretical Construct',
          border: 'border-dotted border-purple-500/50',
          bg: 'bg-purple-950/10 hover:bg-purple-950/20',
          glow: 'shadow-[0_0_16px_rgba(168,85,247,0.08)]',
          badge: 'bg-purple-400/10 border-purple-400/20 text-purple-300',
          bullet: 'bg-purple-400'
        };
      default:
        return {
          title: 'Latent Construct',
          border: 'border-slate-800',
          bg: 'bg-slate-900/40',
          glow: '',
          badge: 'bg-slate-400/10 text-slate-300',
          bullet: 'bg-slate-400'
        };
    }
  };

  const getDisagreementTypeBadge = (type?: DisagreementTaxonomyType) => {
    const t = type || 'measurement';
    const labels: Record<string, string> = {
      definition: 'Definition',
      measurement: 'Measurement',
      causal: 'Causal Linkage',
      value: 'Value Alignment',
      ontological: 'Ontological Basis',
      'meta-epistemic': 'Meta-Epistemic'
    };
    return labels[t] || t;
  };

  // Dependency network logic
  // Click a node to watch dependent claims illuminate
  const selectedDependencies = activeClaim?.dependencies || [];
  const selectedConsequences = claims.filter(c => c.dependencies?.includes(activeClaim?.id || '')).map(c => c.id);

  const isHighlightedNode = (id: string) => {
    if (!activeClaim) return false;
    if (activeClaim.id === id) return true;
    if (selectedDependencies.includes(id)) return true; // Precondition
    if (selectedConsequences.includes(id)) return true; // Consequence
    return false;
  };

  const getNodeRelationColor = (id: string) => {
    if (!activeClaim) return 'border-slate-800';
    if (activeClaim.id === id) return 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/30';
    if (selectedDependencies.includes(id)) return 'border-cyan-400 ring-1 ring-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'; // Glow Cyan
    if (selectedConsequences.includes(id)) return 'border-purple-400 ring-1 ring-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]'; // Glow Purple
    return 'opacity-40 border-slate-900 scale-95';
  };

  // Perform filtering
  const filteredClaims = claims.filter(claim => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesText = claim.statement.toLowerCase().includes(q) || 
                          claim.operationalisation.toLowerCase().includes(q) ||
                          claim.sourceAgentName.toLowerCase().includes(q);
      if (!matchesText) return false;
    }

    // Origin filter
    if (originFilter !== 'all' && claim.origin !== originFilter) return false;

    // Category filter
    if (categoryFilter !== 'all') {
      const categoryLabel = claim.category || 'Latent Construct';
      if (categoryFilter === 'Direct' && categoryLabel !== 'Direct Observation') return false;
      if (categoryFilter === 'Composite' && categoryLabel !== 'Composite Observable') return false;
      if (categoryFilter === 'Latent' && categoryLabel !== 'Latent Construct') return false;
      if (categoryFilter === 'Theoretical' && categoryLabel !== 'Pure Theoretical Construct') return false;
    }

    // Root Assumptions Focus filter
    if (focusRootAssumptions && !isRootAssumption(claim)) return false;

    return true;
  });

  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col gap-5 relative overflow-hidden select-none" ref={containerRef}>
      {/* Dynamic Cyber Backdrops */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Epistemic Atlas Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/60 pb-4 gap-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[9px] font-bold uppercase tracking-wider">
              Socratic Sieve v3
            </span>
            <h3 className="font-sans font-extrabold tracking-tight text-white text-base flex items-center gap-1.5">
              🧭 Epistemic Atlas & Cartographer
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">
            comparative theological mapping • doctrinal dependency networks • scriptural foundations
          </p>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex items-center bg-slate-900/80 p-1 border border-slate-800/80 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('cartography')}
            className={`px-3 py-1.5 rounded-md font-sans font-bold text-xs transition select-none flex items-center gap-1.5 ${
              activeTab === 'cartography' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Atlas DAG
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md font-sans font-bold text-xs transition select-none flex items-center gap-1.5 ${
              activeTab === 'audit' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Construct Audit
          </button>
          <button
            onClick={() => setActiveTab('emergence')}
            className={`px-3 py-1.5 rounded-md font-sans font-bold text-xs transition select-none flex items-center gap-1.5 ${
              activeTab === 'emergence' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Concept Lineage
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: CARTOGRAPHY DAG & INSPECTOR */}
      {activeTab === 'cartography' && (
        <div className="flex flex-col gap-5 z-10 animate-in fade-in duration-200">
          
          {/* Filter Controls Bar */}
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 sm:w-48 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              {/* Origin Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Origin:</span>
                <select
                  value={originFilter}
                  onChange={(e) => setOriginFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Origins</option>
                  <option value="user">User supplied</option>
                  <option value="emergent">Emergent</option>
                  <option value="operational_proxy">Operational Proxy</option>
                  <option value="normative_abstraction">Normative abstraction</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Group:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Direct">Direct Observation</option>
                  <option value="Composite">Composite Observable</option>
                  <option value="Latent">Latent Construct</option>
                  <option value="Theoretical">Pure Theoretical</option>
                </select>
              </div>
            </div>

            {/* Root Assumptions Focusing Toggle */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <button
                onClick={() => setFocusRootAssumptions(!focusRootAssumptions)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  focusRootAssumptions 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Isolate critical concepts upon which downstream claims completely depend"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Root Assumptions Only
              </button>
            </div>
          </div>

          {/* Core Layout: Nodes Grid on Left (7 cols), Epistemic Inspector on Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Grid: Interactive Nodes */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Conceptual Terrain Grid (DAG Topology)
                </h4>
                
                {activeClaim && (
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Preconditions ({selectedDependencies.length})
                    </span>
                    <span className="flex items-center gap-1 text-purple-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Consequences ({selectedConsequences.length})
                    </span>
                  </div>
                )}
              </div>

              {filteredClaims.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl text-center min-h-[300px]">
                  <Info className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400 font-sans">No concepts match the current filters.</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Try relaxing filters or search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredClaims.map((claim) => {
                    const isSelected = activeClaim?.id === claim.id;
                    const catConfig = getCategoryConfig(claim.category);
                    const isRoot = isRootAssumption(claim);
                    const stateColor = getNodeRelationColor(claim.id);
                    
                    return (
                      <div
                        key={claim.id}
                        id={`claim-card-${claim.id}`}
                        onClick={() => setSelectedClaimId(claim.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative ${catConfig.bg} ${catConfig.border} ${catConfig.glow} ${
                          isSelected 
                            ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg scale-[1.02]' 
                            : isHighlightedNode(claim.id) 
                              ? stateColor 
                              : 'border-slate-850 hover:border-slate-750 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Root assumption tag */}
                        {isRoot && (
                          <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[7px] font-bold uppercase tracking-wider shadow">
                            Root Assumption
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${catConfig.bullet}`} />
                            <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500">
                              {catConfig.title}
                            </span>
                          </div>
                          
                          <span className="text-[8px] font-mono text-slate-500">
                            Round {claim.generationRound || 1}
                          </span>
                        </div>

                        <p className="text-xs text-white leading-relaxed font-sans font-medium line-clamp-3">
                          {claim.statement}
                        </p>

                        <div className="mt-1 pt-2 border-t border-slate-900 flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span className="text-slate-500 max-w-[100px] truncate" title={claim.introducedBy}>
                            By: {claim.introducedBy || 'System'}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {claim.dependencies && claim.dependencies.length > 0 && (
                              <span className="text-cyan-400 bg-cyan-950/20 px-1 rounded border border-cyan-500/20 text-[8px]" title="Dependencies">
                                ⤓ {claim.dependencies.length}
                              </span>
                            )}
                            <span className="text-slate-400 uppercase text-[8px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                              {claim.lifecycle || 'Introduced'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Highlight Legend */}
              <div className="p-3 bg-slate-900/20 border border-slate-850 rounded-xl text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>💡 Click any node to illuminate its logical lineage in the DAG hierarchy.</span>
                <span className="text-slate-400">Total Nodes Extracted: {claims.length}</span>
              </div>
            </div>

            {/* Right Column: Epistemic Inspector v2 */}
            <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 min-h-[400px]">
              <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Epistemic Inspector v2
                </h4>
                {activeClaim && (
                  <span className="px-2 py-0.5 text-[8px] font-mono border border-indigo-500/20 rounded bg-indigo-500/5 text-indigo-300">
                    Active Inspection
                  </span>
                )}
              </div>

              {activeClaim ? (
                <div className="flex flex-col gap-4 overflow-y-auto pr-1 max-h-[460px]">
                  
                  {/* Provenance Card */}
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                    <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Concept Provenance</span>
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Origin</span>
                        <span className="text-white bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded capitalize">
                          {(activeClaim.origin || 'emergent').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Introduced By</span>
                        <span className="text-white block truncate" title={activeClaim.introducedBy}>
                          {activeClaim.introducedBy || 'Socrates'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Dialogue Round</span>
                        <span className="text-white">Round {activeClaim.generationRound || 1}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Status Lifecycle</span>
                        <span className="text-white text-[10px] font-bold font-mono">
                          {activeClaim.lifecycle || 'Introduced'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statement Detail */}
                  <div>
                    <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-wider block mb-1">Concept Layer (Statement)</span>
                    <p className="text-xs text-white leading-relaxed font-sans font-semibold bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                      {activeClaim.statement}
                    </p>
                  </div>

                  {/* Theological Details */}
                  {activeClaim.traditionIdentity && (
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                      <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">Tradition Identity</span>
                      <span className="text-xs text-slate-200 font-sans font-semibold">{activeClaim.traditionIdentity}</span>
                    </div>
                  )}

                  {activeClaim.scripturalReferences && activeClaim.scripturalReferences.length > 0 && (
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5">
                      <span className="text-[8px] font-mono text-amber-400 uppercase tracking-wider block font-bold">Scriptural Foundations / Citations</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeClaim.scripturalReferences.map((ref, idx) => (
                          <span key={idx} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeClaim.conceptEquivalents && activeClaim.conceptEquivalents.length > 0 && (
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5">
                      <span className="text-[8px] font-mono text-sky-400 uppercase tracking-wider block font-bold">Equivalent Concepts in Other Traditions</span>
                      <div className="space-y-1">
                        {activeClaim.conceptEquivalents.map((eq, idx) => (
                          <div key={idx} className="text-[10px] text-slate-300 font-sans flex justify-between bg-slate-900 px-2 py-1 rounded border border-slate-850">
                            <span className="font-semibold text-slate-400">{eq.tradition}:</span>
                            <span className="text-sky-300 font-mono">{eq.concept}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preconditions & Dependencies List */}
                  <div>
                    <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">Logical Preconditions (Depends On)</span>
                    {selectedDependencies.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                        No upstream requirements. This behaves as an epistemic axiom or starting node.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {selectedDependencies.map(depId => {
                          const depClaim = claims.find(c => c.id === depId);
                          return (
                            <div 
                              key={depId} 
                              onClick={() => setSelectedClaimId(depId)}
                              className="px-2.5 py-1.5 bg-cyan-950/10 hover:bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-sans cursor-pointer truncate flex items-center gap-1.5"
                            >
                              <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="font-semibold shrink-0">[{depClaim?.category?.substring(0,6) || 'Node'}]:</span>
                              <span className="truncate">{depClaim?.statement || depId}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Consequences List */}
                  <div>
                    <span className="text-[8px] font-mono text-purple-400 uppercase tracking-wider block mb-1">Consequences (Downstream Invalidations)</span>
                    {selectedConsequences.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                        No downstream consequences mapped yet.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {selectedConsequences.map(conseqId => {
                          const conseqClaim = claims.find(c => c.id === conseqId);
                          return (
                            <div 
                              key={conseqId} 
                              onClick={() => setSelectedClaimId(conseqId)}
                              className="px-2.5 py-1.5 bg-purple-950/10 hover:bg-purple-950/20 border border-purple-500/20 rounded-lg text-[10px] text-purple-300 font-sans cursor-pointer truncate flex items-center gap-1.5"
                            >
                              <ChevronRight className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="font-semibold shrink-0">[{conseqClaim?.category?.substring(0,6) || 'Node'}]:</span>
                              <span className="truncate">{conseqClaim?.statement || conseqId}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Disagreement Taxonomy */}
                  <div>
                    <span className="text-[8px] font-mono text-amber-400 uppercase tracking-wider block mb-1">Disagreement Classification</span>
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-sans text-slate-300 font-semibold">
                        {getDisagreementTypeBadge(activeClaim.disagreementType)}
                      </span>
                      <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        {activeClaim.disagreementType || 'measurement'}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Dimensional Stability Redesign (0.0 to 1.0) */}
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                    <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Five-Dimensional Epistemic Maturity</span>
                    
                    <div className="space-y-2.5 text-[10px] font-mono">
                      {/* 1. Definition Completeness */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1 leading-none">
                          <span>Definition Completeness</span>
                          <span className="text-white font-semibold">{( (activeClaim.definitionCompleteness ?? 0.5) * 100 ).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-indigo-500 h-full" style={{ width: `${(activeClaim.definitionCompleteness ?? 0.5) * 100}%` }} />
                        </div>
                      </div>

                      {/* 2. Operational Completeness */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1 leading-none">
                          <span>Operational Completeness</span>
                          <span className="text-white font-semibold">{( (activeClaim.operationalCompleteness ?? 0.4) * 100 ).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-cyan-500 h-full" style={{ width: `${(activeClaim.operationalCompleteness ?? 0.4) * 100}%` }} />
                        </div>
                      </div>

                      {/* 3. Observer Consensus */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1 leading-none">
                          <span>Observer Consensus</span>
                          <span className="text-white font-semibold">{( (activeClaim.observerConsensus ?? 0.3) * 100 ).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-emerald-500 h-full" style={{ width: `${(activeClaim.observerConsensus ?? 0.3) * 100}%` }} />
                        </div>
                      </div>

                      {/* 4. Dependency Robustness */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1 leading-none">
                          <span>Dependency Robustness</span>
                          <span className="text-white font-semibold">{( (activeClaim.dependencyRobustness ?? 0.6) * 100 ).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-pink-500 h-full" style={{ width: `${(activeClaim.dependencyRobustness ?? 0.6) * 100}%` }} />
                        </div>
                      </div>

                      {/* 5. Epistemic Maturity */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1 leading-none">
                          <span>Epistemic Maturity (Localization)</span>
                          <span className="text-white font-semibold">{( (activeClaim.epistemicMaturity ?? 0.5) * 100 ).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-amber-500 h-full" style={{ width: `${(activeClaim.epistemicMaturity ?? 0.5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Epistemic Inspector v2 (Requires Theory, Observable, Observer Agreement) */}
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-[11px] font-mono">
                    <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Observer Requirements Matrix</span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block mb-1">Observable?</span>
                        <span className={`font-extrabold ${activeClaim.observable === 'Yes' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {activeClaim.observable || 'No'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block mb-1">Theory Req?</span>
                        <span className="font-extrabold text-indigo-300">
                          {activeClaim.requiresTheory || 'Yes'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block mb-1">Observer Agreement</span>
                        <span className={`font-extrabold ${
                          activeClaim.observerAgreement === 'High' 
                            ? 'text-emerald-400' 
                            : activeClaim.observerAgreement === 'Medium' 
                              ? 'text-amber-400' 
                              : 'text-rose-400'
                        }`}>
                          {activeClaim.observerAgreement || 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observer Interpretations Matrix (Duality) */}
                  <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950 shadow-md">
                    <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-850 flex items-center justify-between">
                      <span className="text-[8px] font-mono text-indigo-300 uppercase tracking-widest font-bold">Irreducible Dialectical Friction (Dual Interpretations)</span>
                    </div>
                    
                    <div className="p-3.5 flex flex-col gap-3 text-[11px] leading-relaxed">
                      {(activeClaim.alternativeInterpretations && activeClaim.alternativeInterpretations.length > 0) ? (
                        activeClaim.alternativeInterpretations.map((alt, altIdx) => (
                          <div key={altIdx} className={altIdx > 0 ? "border-t border-slate-900 pt-2.5" : ""}>
                            <span className="text-[9px] font-mono text-emerald-400 block font-semibold mb-1">
                              {alt.observerName}:
                            </span>
                            <p className="text-slate-300 italic pl-2.5 border-l-2 border-slate-800 font-sans">
                              {alt.interpretation || "Awaiting dual behavioral interpretation..."}
                            </p>
                          </div>
                        ))
                      ) : (
                        <>
                          <div>
                            <span className="text-[9px] font-mono text-emerald-400 block font-semibold mb-1">Observer A Interpretation:</span>
                            <p className="text-slate-300 italic pl-2.5 border-l-2 border-emerald-500/20 font-sans">
                              {activeClaim.observerA || "Awaiting dual behavioral interpretations..."}
                            </p>
                          </div>
                          <div className="border-t border-slate-900 pt-2.5">
                            <span className="text-[9px] font-mono text-rose-400 block font-semibold mb-1">Observer B Interpretation:</span>
                            <p className="text-slate-300 italic pl-2.5 border-l-2 border-rose-500/20 font-sans">
                              {activeClaim.observerB || "Awaiting dual behavioral interpretations..."}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Normative Audit Block */}
                  <div>
                    <span className="text-[8px] font-mono text-rose-400 uppercase tracking-wider block mb-1">Implicit Normative Load (Auditor Audit)</span>
                    <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-850 flex gap-2">
                      <Shield className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-sans italic">
                        {activeClaim.normativeLoad || "No hidden prescriptive requirements isolated. Claim appears descriptively isolated."}
                      </p>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <Info className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">No concept selected for meta-analysis.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* RENDER TAB 2: CONSTRUCT AUDIT MATRIX */}
      {activeTab === 'audit' && (
        <div className="flex flex-col gap-4 z-10 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" /> Automated Construct Audit Matrix
              </h4>
              <p className="text-[10px] text-slate-500 font-mono">
                Prevents theoretical constructs from masquerading as measured physical variables
              </p>
            </div>
            <span className="text-[10px] font-mono text-indigo-400">Total Audit: {claims.length} Operational Models</span>
          </div>

          {claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl text-center min-h-[300px]">
              <Info className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-sans">No constructs extracted yet.</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400 text-[10px] uppercase">
                      <th className="p-3">Construct / Concept</th>
                      <th className="p-3">Category Group</th>
                      <th className="p-3">Observable?</th>
                      <th className="p-3">Observer Agreement</th>
                      <th className="p-3">Operational Status</th>
                      <th className="p-3 text-right">Maturity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-sans text-slate-200">
                    {claims.map((claim) => {
                      const catConfig = getCategoryConfig(claim.category);
                      const lifecycleConfig = getLifecycleConfig(claim.lifecycle);
                      return (
                        <tr 
                          key={claim.id} 
                          className="hover:bg-slate-900/80 cursor-pointer transition"
                          onClick={() => {
                            setSelectedClaimId(claim.id);
                            setActiveTab('cartography');
                          }}
                        >
                          <td className="p-3 max-w-[240px]">
                            <div className="font-semibold text-white truncate" title={claim.statement}>{claim.statement}</div>
                            <div className="text-[9px] font-mono text-slate-500 mt-0.5 truncate">Introduced by: {claim.introducedBy}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono ${catConfig.badge}`}>
                              {claim.category || 'Latent Construct'}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <span className={claim.observable === 'Yes' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                              {claim.observable || 'No'}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              claim.observerAgreement === 'High' 
                                ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/20' 
                                : claim.observerAgreement === 'Medium' 
                                  ? 'text-amber-400 bg-amber-500/5 border border-amber-500/20' 
                                  : 'text-rose-400 bg-rose-500/5 border border-rose-500/20'
                            }`}>
                              {claim.observerAgreement || 'Low'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono ${lifecycleConfig.badge}`}>
                              {claim.lifecycle || 'Introduced'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-indigo-400">
                            {((claim.epistemicMaturity ?? 0.5) * 100).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER TAB 3: CONCEPT LINEAGE & EMERGENCE TRACKER */}
      {activeTab === 'emergence' && (
        <div className="flex flex-col gap-4 z-10 animate-in fade-in duration-200">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> Concept Lineage & Emergence Genealogy
            </h4>
            <p className="text-[10px] text-slate-500 font-mono">
              Replay the evolution of discourse from Original Topic to Adopted and Collapsed concepts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Original concepts */}
            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
              <h5 className="font-mono text-[10px] uppercase text-indigo-400 border-b border-slate-800 pb-1.5 font-bold">
                1. Original Topic Concepts
              </h5>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {claims.filter(c => c.origin === 'user').length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">None registered.</p>
                ) : (
                  claims.filter(c => c.origin === 'user').map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedClaimId(c.id); setActiveTab('cartography'); }}
                      className="p-2.5 bg-slate-950 border border-indigo-500/20 hover:border-indigo-500 rounded-lg text-xs cursor-pointer transition text-white"
                    >
                      {c.statement}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Emergent concepts */}
            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
              <h5 className="font-mono text-[10px] uppercase text-amber-400 border-b border-slate-800 pb-1.5 font-bold">
                2. Emergent Dialogue Concepts
              </h5>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {claims.filter(c => c.origin === 'emergent').length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">None registered.</p>
                ) : (
                  claims.filter(c => c.origin === 'emergent').map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedClaimId(c.id); setActiveTab('cartography'); }}
                      className="p-2.5 bg-slate-950 border border-amber-500/20 hover:border-amber-500 rounded-lg text-xs cursor-pointer transition text-white"
                    >
                      {c.statement}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Adopted concepts */}
            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
              <h5 className="font-mono text-[10px] uppercase text-cyan-400 border-b border-slate-800 pb-1.5 font-bold">
                3. Adopted Operational Proxies
              </h5>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {claims.filter(c => c.origin === 'operational_proxy').length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">None registered.</p>
                ) : (
                  claims.filter(c => c.origin === 'operational_proxy').map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedClaimId(c.id); setActiveTab('cartography'); }}
                      className="p-2.5 bg-slate-950 border border-cyan-500/20 hover:border-cyan-500 rounded-lg text-xs cursor-pointer transition text-white"
                    >
                      {c.statement}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Discarded or Collapsed concepts */}
            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
              <h5 className="font-mono text-[10px] uppercase text-rose-400 border-b border-slate-800 pb-1.5 font-bold">
                4. Discarded / Collapsed
              </h5>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {claims.filter(c => c.lifecycle === 'Collapsed' || c.lifecycle === 'Deprecated').length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No collapsed concepts in genealogy history.</p>
                ) : (
                  claims.filter(c => c.lifecycle === 'Collapsed' || c.lifecycle === 'Deprecated').map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedClaimId(c.id); setActiveTab('cartography'); }}
                      className="p-2.5 bg-slate-950 border border-rose-500/20 hover:border-rose-500 rounded-lg text-xs cursor-pointer transition text-slate-400 line-through"
                    >
                      {c.statement}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Rail: Active Comparative Theological Perspectives */}
      <div className="border-t border-slate-800/80 pt-4 z-10 flex flex-col gap-2.5">
        <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          👤 Comparative Theological Perspectives
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {agents.map((agent) => {
            const isActive = activeAgentId === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block tracking-wider truncate max-w-[80px]">
                      {agent.perspectiveName || "Perspective"}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                  <h5 className="text-[11px] font-bold text-white truncate">{agent.name}</h5>
                  {agent.bias && (
                    <p className="text-[8px] text-slate-500 italic mt-0.5 line-clamp-1 truncate">
                      {agent.bias}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
