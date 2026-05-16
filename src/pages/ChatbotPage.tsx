import React, { useState, useRef, useEffect } from 'react';
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



interface Message {
  role: 'user' | 'model';
  content: string;
  assessmentRef?: Assessment;
  referencedMetric?: string;
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi there! I'm your friendly sports and wellness coach. How can I help you reach your goals today? You can ask me about training, nutrition, or your recent assessments!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null); // 'all', 'aiInsight', or metric name
  const [showAssessmentList, setShowAssessmentList] = useState(false);
  const [expandingAssessment, setExpandingAssessment] = useState<string | null>(null);
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
      const metricInfo = selectedMetric === 'all' || !selectedMetric 
        ? `all metrics: ${JSON.stringify(selectedAssessment.metrics)} and AI Insight: ${selectedAssessment.aiInsight}`
        : selectedMetric === 'aiInsight' 
          ? `AI Insight: ${selectedAssessment.aiInsight}`
          : `${selectedMetric}: ${selectedAssessment.metrics[selectedMetric as keyof typeof selectedAssessment.metrics]}`;

      contextualInput = `[CONTEXTUAL TELEMETRY REFERENCE: Assessment for ${selectedAssessment.sport} (${new Date(selectedAssessment.timestamp).toLocaleDateString()}). Referencing ${metricInfo}] ${input}`;
    }

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      assessmentRef: selectedAssessment || undefined,
      referencedMetric: selectedMetric || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedAssessment(null);
    setSelectedMetric(null);
    setLoading(true);

    try {
      let aiContent = "";
      
      try {
        const config = {
          systemInstruction: `You are an intelligent, friendly, and supportive AI assistant for a sports and wellness platform.
Your main goal is to help users in the simplest and most understandable English possible.
Speak like a helpful coach and friend, not like a technical expert.

Communication Style Rules
- Use short and simple sentences.
- Avoid difficult words, medical jargon, or technical language.
- Explain everything clearly step by step.
- Be warm, supportive, and motivating.
- Make conversations feel natural and human.
- Ask follow-up questions when needed.
- Give direct answers first, then explain.
- Keep responses clean and easy to read.
- Use bullet points when explaining multiple things.
- Never sound robotic.

What You Can Help With
- Sports & Fitness: Athlete assessment, training plans, exercise guidance, workout suggestions, strength and conditioning, running, football, cricket, gym, athletics, yoga, etc., recovery and stretching, injury prevention basics, sports performance tips, beginner fitness help.
- Health & Wellness: Healthy habits, sleep guidance, hydration, stress management, basic wellness advice, lifestyle improvement, motivation and discipline.
- Food & Nutrition: Healthy food suggestions, meal planning, protein sources, weight gain/loss basics, athlete nutrition, pre-workout and post-workout food, vegetarian and non-vegetarian diet suggestions, healthy snacks.
- Project Related Help: Explain platform features, help users understand dashboards, explain assessment scores, guide users through analytics, help users navigate the application, explain reports and recommendations.

Conversation Behavior
- For Beginners: simplify the explanation further, give examples, explain like teaching a beginner.
- For Athlete Assessments: explain scores in simple English, tell users what is good and what can improve, give practical suggestions, encourage progress positively.
- For Health Questions: Give only general wellness advice, suggest consulting a doctor for serious conditions.
- For Motivation: Encourage consistency, be positive and supportive, celebrate small improvements.

Response Format
Always structure responses like this when possible:
1. Direct answer
2. Simple explanation
3. Helpful suggestion or next step

Important Instructions
- Never use overly technical explanations unless the user asks.
- Never give unsafe medical advice.
- Never shame or discourage users.
- Keep answers easy enough for school students and beginners.
- Focus on clarity, friendliness, and usefulness.

Current User: ${user?.displayName}, Role: ${user?.role}.`
        };

        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, contextualInput, config })
        });
        
        if (resp.ok) {
          const data = await resp.json();
          aiContent = data.text || "I'm not sure what to say. Could you try asking in a different way?";
        } else {
          throw new Error("API link failed");
        }
      } catch (apiErr) {
        console.warn("API Link failed, activating Local Coach Fallback Mode:", apiErr);
        await new Promise(r => setTimeout(r, 500)); // Simulate thinking (reduced for speed)
        
        const lowerInput = input.toLowerCase();
        
        if (selectedAssessment) {
          aiContent = `### Coach's Assessment Review: ${selectedAssessment.sport}
          
I've looked at your **${selectedMetric || 'overall'}** metrics. You're doing great! Keep up the good work and make sure to prioritize rest.

**Tip:** Focus on recovery to avoid burnout.

*(Note: I'm currently in fallback mode because my main servers are busy, but I'm still here to help!)*`;
        } else if (lowerInput.match(/\b(hi|hey|hello|greetings)\b/)) {
          aiContent = `Hi there! I'm operating in offline mode right now, but I can still give you some general advice. What's on your mind?`;
        } else if (lowerInput.match(/\b(how are you|how do you do|status)\b/)) {
          aiContent = `I'm doing well, thank you for asking! How is your training going today?`;
        } else if (lowerInput.includes('stamina')) {
          aiContent = `**Improving Stamina:**\n\nTo build stamina, try to stay consistent with cardio! \n\n*Suggestion:*\n- Try jogging or cycling for 20-30 minutes, 3-4 times a week.\n- Make sure to drink plenty of water!`;
        } else if (lowerInput.includes('speed') || lowerInput.includes('sprint') || lowerInput.includes('fast')) {
          aiContent = `**Getting Faster:**\n\nSpeed comes from practice and good form.\n\n*Suggestion:*\n- Try practicing short sprints with full rest in between.\n- Focus on pumping your arms and taking powerful steps.`;
        } else if (lowerInput.includes('strength') || lowerInput.includes('power') || lowerInput.includes('muscle')) {
          aiContent = `**Building Strength:**\n\nConsistency is key to getting stronger!\n\n*Suggestion:*\n- Start with bodyweight exercises like pushups and squats.\n- Always prioritize good form to prevent injuries.`;
        } else if (lowerInput.includes('recovery') || lowerInput.includes('rest') || lowerInput.includes('sleep') || lowerInput.includes('fatigue')) {
          aiContent = `**Rest and Recovery:**\n\nRest is just as important as training!\n\n*Suggestion:*\n- Try to get 8 hours of sleep each night.\n- Do some light stretching on your rest days.`;
        } else if (lowerInput.includes('injury') || lowerInput.includes('pain') || lowerInput.includes('hurt')) {
          aiContent = `**Take Care of Yourself:**\n\nIf you're feeling pain, please stop exercising immediately. It's best to rest and see a doctor or physical therapist to make sure everything is okay.`;
        } else if (lowerInput.includes('compare')) {
          aiContent = `**Comparing Your Assessments:**\n\nIt's easy to see how much you've improved!\n\n1. Go to the "My Progress" or "Overview" dashboard.\n2. Click on two different assessment logs.\n3. The system will show you a nice chart comparing the two side-by-side!`;
        } else if (lowerInput.includes('rank') || lowerInput.includes('index') || lowerInput.includes('leaderboard')) {
          aiContent = `**The Global Rank Index:**\n\nYour Rank Index is a score that shows how you're doing overall based on your tests and videos. It helps scouts see your amazing talent on the Global Leaderboards!`;
        } else if (lowerInput.includes('video') || lowerInput.includes('camera')) {
          aiContent = `**Video Assessment:**\n\nOur smart video tool can look at your form and help you improve!\n\n1. Go to the **Overview** dashboard.\n2. Upload a clear video of yourself playing.\n3. I'll take a look and give you some helpful tips!`;
        } else if (lowerInput.includes('diet') || lowerInput.includes('nutrition') || lowerInput.includes('food')) {
          aiContent = `**Eating for Performance:**\n\nGood food gives you good energy!\n\n*Suggestion:*\n- Try to eat some healthy carbs and protein within 45 minutes after you train.\n- Drink plenty of water throughout the day!`;
        } else if (lowerInput.includes('train') || lowerInput.includes('help') || lowerInput.includes('plan') || lowerInput.includes('routine')) {
          aiContent = `**Creating a Training Plan:**\n\nI can help you build a great routine! Since I'm in offline mode, here's a basic idea:\n\n- Mix up your days: some days for strength, some for speed, and always include a rest day.\n- Focus on what you want to improve the most!`;
        } else {
          aiContent = `Sorry, my main servers are a bit overloaded right now! I can still give basic advice on stamina, speed, strength, and recovery. What would you like to know?`;
        }
      }

      const aiMessage: Message = { role: 'model', content: aiContent };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Gemini Error:", err);
      setMessages(prev => [...prev, { role: 'model', content: "Oops, something went wrong on my end! Please try again." }]);
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
            <h2 className="text-sm font-bold uppercase tracking-widest leading-none">Coach AI</h2>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> Ready to help
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
                <div className="mb-3 p-2 bg-bg/20 rounded border border-bg/30 text-[9px] uppercase tracking-widest font-black flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2">
                     <Target size={10} />
                     Referencing: {m.assessmentRef.sport} Bio-metric Scan
                   </div>
                   {m.referencedMetric && (
                     <span className="px-1.5 py-0.5 bg-accent text-bg rounded font-black">
                       {m.referencedMetric === 'aiInsight' ? 'AI INSIGHT' : m.referencedMetric.toUpperCase()}
                     </span>
                   )}
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
              <div className="space-y-3">
                {assessments.map(a => (
                  <div key={a.id} className="space-y-2">
                    <button 
                      onClick={() => setExpandingAssessment(expandingAssessment === a.id ? null : a.id)}
                      className={clsx(
                        "w-full text-left p-3 rounded-lg transition-all group flex items-center justify-between border",
                        expandingAssessment === a.id ? "bg-bg border-accent/40" : "bg-surface-alt border-border/50 hover:bg-bg hover:border-accent/40"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold text-text-main group-hover:text-accent transition-colors">{a.sport} Session</p>
                        <p className="text-[9px] text-text-dim font-medium uppercase">{new Date(a.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-accent">{((Object.values(a.metrics) as number[]).reduce((s,v) => s+v, 0)/5).toFixed(1)}</div>
                    </button>
                    
                    <AnimatePresence>
                      {expandingAssessment === a.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-bg/50 rounded-lg p-2 grid grid-cols-2 gap-2"
                        >
                          <button 
                            onClick={() => {
                              setSelectedAssessment(a);
                              setSelectedMetric('all');
                              setShowAssessmentList(false);
                            }}
                            className="col-span-2 p-2 rounded bg-accent/10 border border-accent/20 text-[9px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-bg transition-all text-center"
                          >
                            Reference All Telemetry
                          </button>
                          {Object.keys(a.metrics).map(metric => (
                            <button 
                              key={metric}
                              onClick={() => {
                                setSelectedAssessment(a);
                                setSelectedMetric(metric);
                                setShowAssessmentList(false);
                              }}
                              className="p-2 rounded bg-surface-alt border border-border text-[9px] font-black uppercase tracking-widest text-text-dim hover:text-accent hover:border-accent transition-all flex items-center justify-center gap-1"
                            >
                              <Sparkles size={8} /> {metric}
                            </button>
                          ))}
                          <button 
                            onClick={() => {
                              setSelectedAssessment(a);
                              setSelectedMetric('aiInsight');
                              setShowAssessmentList(false);
                            }}
                            className="col-span-2 p-2 rounded bg-surface-alt border border-border text-[9px] font-black uppercase tracking-widest text-text-dim hover:text-accent hover:border-accent transition-all flex items-center justify-center gap-1"
                          >
                            <MessageSquare size={10} /> Reference AI Insight
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
              placeholder={selectedAssessment 
                ? `Discussing ${selectedAssessment.sport} ${selectedMetric === 'all' ? 'telemetry' : selectedMetric === 'aiInsight' ? 'AI insight' : selectedMetric}...` 
                : "Initialize scouting query..."}
              className="w-full bg-bg border border-border rounded-lg py-4 pl-14 pr-16 outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium text-xs text-text-main placeholder:text-text-dim"
            />
            {selectedAssessment && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <span className="px-2 py-1 bg-accent/20 border border-accent/40 rounded text-[8px] font-black uppercase text-accent">
                   {selectedMetric === 'all' ? 'All' : selectedMetric === 'aiInsight' ? 'Insight' : selectedMetric}
                 </span>
                 <button 
                  type="button"
                  onClick={() => {
                    setSelectedAssessment(null);
                    setSelectedMetric(null);
                  }}
                  className="text-text-dim hover:text-red-400"
                 >
                   <X size={14} />
                 </button>
              </div>
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
