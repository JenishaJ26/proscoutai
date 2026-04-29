import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  Sparkles, 
  Trash2,
  BrainCircuit,
  MessageSquare,
  Cpu,
  Database,
  X,
  Target
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Assessment } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  content: string;
  assessmentRef?: Assessment;
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Interface active. AI Scout v3.5 initialized. I am your AthletiQ neural link—ready to analyze your performance telemetry, provide specialized sports training advice, or guide you through the matrix's features. How can I optimize your career path today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showAssessmentList, setShowAssessmentList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const resp = await fetch('/api/assessments');
        if (resp.ok) setAssessments(await resp.json());
      } catch (err) {
        console.error("Chatbot assessment fetch error:", err);
      }
    };
    fetchAssessments();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    let contextualInput = input;
    if (selectedAssessment) {
      contextualInput = `[CONTEXTUAL TELEMETRY: Assessment for ${selectedAssessment.sport} on ${new Date(selectedAssessment.timestamp).toLocaleDateString()} with metrics: ${JSON.stringify(selectedAssessment.metrics)}. AI Insight: ${selectedAssessment.aiInsight}] ${input}`;
    }

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      assessmentRef: selectedAssessment || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const prevSelected = selectedAssessment;
    setSelectedAssessment(null);
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.role === 'user' && m.assessmentRef ? `[CONTEXTUAL TELEMETRY ATTACHED] ${m.content}` : m.content }] })),
          { role: 'user', parts: [{ text: contextualInput }] }
        ],
        config: {
          systemInstruction: `You are the Neural Scout Assistant, a high-fidelity intelligence layer within the AthletiQ AI Matrix. 
          Your mission is to provide expert sports analysis, performance advice, and technical support for this application.

          USER ORIENTATION:
          - Be professional, data-driven, and futuristic, yet highly user-friendly and encouraging.
          - Address the user as ${user?.displayName || 'Athlete'}. Your current role context is: ${user?.role}.

          SPORTS EXPERTISE:
          - Provide deep insights into training methodologies (HIIT, plyometrics, recovery protocols).
          - Offer advice on specific sports techniques and recruitment strategies.
          - Use data-intensive terminology when analyzing assessments.

          APPLICATION KNOWLEDGE (AthletiQ Matrix):
          - Dashboard: Athletes use the "Performance Pulse" to track Speed, Agility, Strength, Technique, and Stamina via Radar and Area charts.
          - Multi-Assessment Comparison: Users can select two logs on their dashboard to see side-by-side metric intersections.
          - AI Training Plans: You can generate personalized 7-day protocols on the Athlete Dashboard based on history.
          - Video Intelligence: Our "Neural Video Assessment" uses computer vision (Gemini 3) to extract metrics from MP4/MOV files or URLs.
          - Leaderboard: Shows global U19 circuit rankings, filterable by sport.
          - Hub: Real-time global sports news and circuit updates.

          PROTOCOL:
          - If the user references contextual telemetry (assessment data), perform a rigorous biomechanical analysis.
          - If the user asks about app features, guide them clearly on where to find them.
          - Always maintain the sleek, dark aesthetic of the "Neural Matrix" in your tone.`
        }
      });

      const aiMessage: Message = { role: 'model', content: response.text || "Neural link failure. Data lost in transit." };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Gemini Error:", err);
      setMessages(prev => [...prev, { role: 'model', content: "Neural packet loss detected. Re-initialize query." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-10rem)] flex flex-col bg-surface rounded-xl border border-border shadow-2xl overflow-hidden text-text-main">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-alt">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg border border-border text-accent flex items-center justify-center">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest leading-none">AI Assistant</h2>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> Neural Link Active
            </p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-text-dim hover:text-red-400 transition-colors"
          title="Clear Buffer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        {messages.map((m, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx(
              "flex gap-4 max-w-[85%]",
              m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
              m.role === 'model' ? "bg-surface-alt border-border text-accent" : "bg-accent/10 border-accent/20 text-accent"
            )}>
              {m.role === 'model' ? <Bot size={14} /> : <UserIcon size={14} />}
            </div>
            <div className={clsx(
              "p-4 rounded-xl text-sm font-medium leading-relaxed",
              m.role === 'model' ? "bg-surface-alt border border-border text-text-main" : "bg-accent text-bg font-bold"
            )}>
              {m.assessmentRef && (
                <div className="mb-3 p-2 bg-bg/20 rounded border border-bg/30 text-[9px] uppercase tracking-widest font-black flex items-center gap-2">
                   <Target size={10} />
                   Referencing: {m.assessmentRef.sport} Bio-metric Scan
                </div>
              )}
              <div className="markdown-body">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-lg bg-surface-alt border border-border flex items-center justify-center shrink-0 text-accent">
               <Cpu size={14} />
            </div>
            <div className="bg-surface-alt border border-border p-4 rounded-xl flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
               <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-6 border-t border-border bg-surface-alt relative">
        <AnimatePresence>
          {showAssessmentList && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-6 right-6 mb-4 bg-surface border border-border rounded-xl shadow-2xl p-4 z-30 max-h-64 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-text-dim">Available Telemetry Logs</h4>
                 <button onClick={() => setShowAssessmentList(false)} className="text-text-dim hover:text-white"><X size={14} /></button>
              </div>
              <div className="space-y-2">
                {assessments.map(a => (
                  <button 
                    key={a.id}
                    onClick={() => {
                      setSelectedAssessment(a);
                      setShowAssessmentList(false);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-surface-alt hover:bg-bg border border-border/50 hover:border-accent/40 transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-text-main group-hover:text-accent transition-colors">{a.sport} Session</p>
                      <p className="text-[9px] text-text-dim font-medium uppercase">{new Date(a.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-accent">{(Object.values(a.metrics).reduce((s,v) => s+v, 0)/5).toFixed(1)}</div>
                  </button>
                ))}
                {assessments.length === 0 && (
                   <p className="text-center py-4 text-[10px] uppercase font-black tracking-widest text-text-dim">No biometric logs found in matrix</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto mb-4 flex flex-wrap gap-2 overflow-x-auto scrollbar-hide pb-2">
           {[
             "How do I compare assessments?",
             "Analyze my latest stamina metrics",
             "Best HIIT protocol for agility?",
             "How does video assessment work?",
             "What is the Global Rank index?"
           ].map((query, i) => (
             <button
               key={i}
               onClick={() => setInput(query)}
               className="shrink-0 px-3 py-1.5 bg-surface border border-border rounded-full text-[9px] font-black uppercase tracking-widest text-text-dim hover:text-accent hover:border-accent transition-all animate-in fade-in slide-in-from-bottom-2"
               style={{ animationDelay: `${i * 100}ms` }}
             >
               {query}
             </button>
           ))}
        </div>

        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex gap-3">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <button 
                type="button" 
                onClick={() => setShowAssessmentList(!showAssessmentList)}
                className={clsx(
                  "p-1.5 rounded transition-all",
                  selectedAssessment ? "bg-accent text-bg" : "bg-bg text-text-dim hover:text-accent"
                )}
               >
                 <Database size={14} />
               </button>
            </div>
            <input 
              type="text" 
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedAssessment ? `Discussing ${selectedAssessment.sport} telemetry...` : "Initialize scouting query..."}
              className="w-full bg-bg border border-border rounded-lg py-4 pl-14 pr-16 outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium text-xs text-text-main placeholder:text-text-dim"
            />
            {selectedAssessment && (
               <button 
                type="button"
                onClick={() => setSelectedAssessment(null)}
                className="absolute right-14 top-1/2 -translate-y-1/2 text-text-dim hover:text-red-400"
               >
                 <X size={14} />
               </button>
            )}
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md bg-accent text-bg flex items-center justify-center hover:brightness-110 transition-all active:scale-95 disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
