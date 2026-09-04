import React, { useState } from 'react';
import { 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Database, 
  Send, 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AIExplanationProps {
  recommendationId?: number;
  initialQuestion?: string;
}

export default function AIExplanation({ recommendationId, initialQuestion }: AIExplanationProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [question, setQuestion] = useState(initialQuestion || (recommendationId ? "Why was this vessel recommended for this cargo shipment?" : "What are the port draft restrictions at Visakhapatnam?"));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const presetQuestions = [
    "Why was this vessel recommended for this cargo shipment?",
    "What port constraints affected this recommendation?",
    "What freight forecast was used?",
    "Which vessel specs were evaluated for feasibility?"
  ];

  const handleRunRAGQuery = async (queryToRun?: string) => {
    const q = queryToRun || question;
    if (!q || !q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          recommendation_id: recommendationId || null
        })
      }).catch(() => fetch('http://127.0.0.1:8000/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          recommendation_id: recommendationId || null
        })
      }));

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setError('Failed to fetch AI explanation. Please check backend service.');
      }
    } catch (e: any) {
      console.error(e);
      setError('Connection error while reaching RAG service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card-black-translucent p-5 rounded-2xl border space-y-4 shadow-xl ${
      isLight ? 'border-slate-300 bg-white/90' : 'border-slate-800 bg-slate-950/80'
    }`}>
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sky-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`text-sm font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Grounded AI Explanation Assistant
            </h3>
            <p className="text-[10px] font-mono text-slate-400">
              Evidence Retrieval & Anti-Hallucination Verified
            </p>
          </div>
        </div>

        {result && (
          <div className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border ${
            result.grounded 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {result.grounded ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>GROUNDED ({Math.round((result.confidence || 0) * 100)}%)</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>INSUFFICIENT EVIDENCE</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Preset Question Pills */}
      {recommendationId && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            SUGGESTED EXPLANATION QUERIES:
          </span>
          <div className="flex flex-wrap gap-2">
            {presetQuestions.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(pq);
                  handleRunRAGQuery(pq);
                }}
                className={`text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-blue-50 border-slate-300 text-slate-700 hover:text-blue-800' 
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-sky-300'
                }`}
              >
                {pq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question Input Form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRunRAGQuery()}
          placeholder="Ask why a vessel was selected, port limits, or charter policies..."
          className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none font-sans font-medium transition ${
            isLight 
              ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' 
              : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-sky-400'
          }`}
        />
        <button
          onClick={() => handleRunRAGQuery()}
          disabled={loading}
          className="btn-navy-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">Explain</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* RAG Explanation Results Container */}
      {result && (
        <div className="space-y-4 pt-2 animate-fade-in-up">
          
          {/* Explanation Text */}
          <div className={`p-4 rounded-xl border font-sans text-xs leading-relaxed ${
            result.grounded 
              ? (isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-200')
              : (isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-800/60 text-amber-200')
          }`}>
            <div className="flex items-center gap-2 font-mono font-bold text-[11px] mb-2 text-sky-400">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>SYSTEM DECISION EXPLANATION:</span>
            </div>
            <p className="whitespace-pre-line font-medium">
              {result.answer}
            </p>
          </div>

          {/* Retrieved Evidence Breakdown */}
          {result.grounded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Structured Facts */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <div className="flex items-center gap-2 font-mono font-bold text-[10px] text-blue-400 uppercase tracking-wider mb-2">
                  <Database className="h-3.5 w-3.5" />
                  <span>STRUCTURED FACTS ({result.evidence?.structured?.length || 0})</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {result.evidence?.structured?.slice(0, 3).map((sf: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-slate-950/40 border border-slate-800/60 font-mono text-[10px]">
                      <span className="font-bold text-slate-300 block">{sf.category || sf.source_type}</span>
                      <span className="text-slate-400">
                        {sf.vessel_name ? `Vessel: ${sf.vessel_name} (Draft: ${sf.draft_m}m)` : ''}
                        {sf.port_name ? `Port: ${sf.port_name} (Max Draft: ${sf.max_draft_m}m)` : ''}
                        {sf.recommendation_score ? `Score: ${sf.recommendation_score}/100 | Cost: $${sf.estimated_cost_usd?.toLocaleString()}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Sources */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <div className="flex items-center gap-2 font-mono font-bold text-[10px] text-emerald-400 uppercase tracking-wider mb-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span>AUTHENTIC SOURCES ({result.sources?.length || 0})</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {result.sources?.slice(0, 3).map((src: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-slate-950/40 border border-slate-800/60 font-mono text-[10px]">
                      <span className="font-bold text-slate-300 block">{src.title}</span>
                      <span className="text-slate-400">
                        {src.section ? `Section: ${src.section}` : ''} {src.page ? `• Page ${src.page}` : ''} ({src.source})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
