import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Brain, AlertCircle, CheckCircle, MessageSquare, BookOpen, X, Download, Upload, Trash2, ChevronRight, Flame, Send, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const glass = "backdrop-blur-xl bg-white/5 border border-white/10";
const glassHover = "hover:bg-white/10 hover:border-white/20";

// ── AI BUDDY ENGINE ──────────────────────────────────────────────
const EMOTIONAL_KEYWORDS = {
  anger: ['annoyed','angry','furious','frustrated','pissed','mad','rage'],
  fear: ['scared','afraid','nervous','anxious','worried','fearful','unsure'],
  fomo: ['missing out','everyone','fomo','too late','late','chase','chasing'],
  overconfident: ['easy','guaranteed','cant lose','sure thing','obvious','definitely','100%'],
  revenge: ['get it back','recover','make it back','lost earlier','revenge','recoup'],
  greed: ['more','bigger','double','increase size','load up','all in'],
};

const PATTERN_RESPONSES = {
  anger: (n) => `You sound frustrated. You've entered ${n > 0 ? n : 'several'} losing trades while annoyed before. Anger clouds execution — what's your rule for trading when emotionally activated?`,
  fear: (n) => `That hesitation you're feeling? It's information. But ${n > 0 ? `${n} of your past trades` : 'past trades'} show fear-based exits cost you more than the losses themselves. What does your system actually say here?`,
  fomo: () => `Classic FOMO signal. The market will always have another setup. What specific criteria on your checklist does this trade actually meet right now?`,
  overconfident: (n) => `High conviction is great — but ${n > 2 ? `your last ${n} "sure thing" trades didn't all work out.` : `overconfidence is one of the most documented trader blind spots.`} What's your worst-case scenario if this goes against you?`,
  revenge: (n) => `Revenge trading is one of the fastest ways to blow an account. You've done it ${n > 0 ? n + ' times before' : 'before'}. Walk away from the screen for 10 minutes — do you still want this trade?`,
  greed: () => `Size creep is real. Are you considering increasing size because the setup is genuinely A+, or because you feel like you "deserve" a win right now?`,
};

const GENERIC_RESPONSES = [
  (symbol, lossStreak) => lossStreak >= 3
    ? `You're on a ${lossStreak}-trade loss streak. Before entering ${symbol || 'this trade'}, honest question: are you trading your system or trading your P&L?`
    : `What does your checklist say about ${symbol || 'this setup'}? Walk me through the confirmation you're waiting for.`,
  () => `On a scale of 1-10, how calm are you right now? If it's below a 7, your rules say what?`,
  (symbol) => `If this ${symbol || 'trade'} hits your stop immediately, how will you feel? If the answer is "devastated," your size might be too big.`,
  () => `What would you tell a trading buddy who came to you with this exact setup and this exact emotional state?`,
  () => `Has anything happened today — outside of trading — that might be coloring how you're reading this chart?`,
];

function detectEmotion(message) {
  const lower = message.toLowerCase();
  for (const [emotion, words] of Object.entries(EMOTIONAL_KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return emotion;
  }
  return null;
}

function generateAIResponse(message, trades) {
  const emotion = detectEmotion(message);
  const losses = trades.filter(t => t.outcome === 'loss');
  const recentLossStreak = (() => {
    let streak = 0;
    for (const t of [...trades].reverse()) {
      if (t.outcome === 'loss') streak++;
      else break;
    }
    return streak;
  })();
  const symbolMatch = message.toUpperCase().match(/\b([A-Z]{2,6})\b/);
  const symbol = symbolMatch ? symbolMatch[1] : null;

  if (emotion && PATTERN_RESPONSES[emotion]) {
    const relevantCount = {
      anger: losses.filter(t => t.responses?.emotion?.toLowerCase().includes('annoy') || t.responses?.emotion?.toLowerCase().includes('angry')).length,
      revenge: trades.filter(t => t.responses?.revenge === 'yes').length,
      overconfident: trades.filter(t => t.responses?.confidence >= 8 && t.outcome === 'loss').length,
    }[emotion] || 0;
    return PATTERN_RESPONSES[emotion](relevantCount);
  }
  const randomResponse = GENERIC_RESPONSES[Math.floor(Math.random() * GENERIC_RESPONSES.length)];
  return randomResponse(symbol, recentLossStreak);
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [trades, setTrades] = useState([]);
  const [currentTrade, setCurrentTrade] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [responses, setResponses] = useState({});
  const [insights, setInsights] = useState([]);
  const [view, setView] = useState('buddy');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [stats, setStats] = useState({ totalTrades: 0, winRate: 0, avgProfit: 0, totalPnL: 0 });
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hey. I'm your trading buddy — not a yes-man. Tell me what's on your mind before you pull the trigger, or talk through a trade you just closed. I'll call you out when I need to." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('postTradeTherapy');
    if (saved) try { setTrades(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      analyzePatterns();
      calculateStats();
      localStorage.setItem('postTradeTherapy', JSON.stringify(trades));
    }
  }, [trades]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const questions = {
    win: [
      { id: 'confidence', q: 'How confident were you entering this trade?', type: 'scale' },
      { id: 'plan', q: 'Did you follow your trading plan exactly?', type: 'yesno' },
      { id: 'emotion', q: 'What was your dominant emotion during the trade?', type: 'text' },
      { id: 'size', q: 'Was your position size larger than usual?', type: 'yesno' },
      { id: 'impulse', q: 'How long did you wait before entering? (minutes)', type: 'number' }
    ],
    loss: [
      { id: 'revenge', q: 'Were you trying to recover losses from a previous trade?', type: 'yesno' },
      { id: 'stoploss', q: 'Did you move your stop loss during the trade?', type: 'yesno' },
      { id: 'emotion', q: 'What was your dominant emotion during the trade?', type: 'text' },
      { id: 'plan', q: 'Did you follow your trading plan exactly?', type: 'yesno' },
      { id: 'fomo', q: 'Did you enter because you feared missing out?', type: 'yesno' }
    ]
  };

  const calculateStats = () => {
    const total = trades.length;
    const wins = trades.filter(t => t.outcome === 'win').length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    setStats({
      totalTrades: total,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : 0,
      avgProfit: total > 0 ? (totalPnL / total).toFixed(2) : 0,
      totalPnL: totalPnL.toFixed(2)
    });
  };

  const analyzePatterns = () => {
    const patterns = [];
    const ct = trades.filter(t => t.responses);
    const check = (filter, type, title, desc) => {
      const n = ct.filter(filter).length;
      if (n >= 2) patterns.push({ type, title, desc: desc(n), count: n });
    };
    check(t => t.outcome === 'loss' && t.responses.revenge === 'yes', 'warning', 'Revenge Trading', n => `${n} trades show revenge behavior. Step away after losses.`);
    check(t => t.outcome === 'loss' && t.responses.fomo === 'yes', 'warning', 'FOMO Entries', n => `${n} losing trades driven by FOMO. Wait for your setup.`);
    check(t => t.outcome === 'loss' && t.responses.stoploss === 'yes', 'warning', 'Stop Loss Issues', n => `You've moved stops on ${n} losing trades. Honor your plan.`);
    check(t => t.outcome === 'win' && parseInt(t.responses.confidence) >= 8, 'info', 'Overconfidence Risk', n => `${n} high-confidence trades. Watch for bias.`);
    check(t => t.responses.plan === 'no', 'warning', 'Plan Deviations', n => `${n} trades deviated from your plan.`);
    check(t => t.responses.impulse && parseInt(t.responses.impulse) < 5, 'warning', 'Impulsive Entries', n => `${n} trades entered in under 5 min. Slow down.`);
    setInsights(patterns);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    setTimeout(() => {
      const aiReply = generateAIResponse(userMsg, trades);
      setIsTyping(false);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
    }, 900 + Math.random() * 600);
  };

  const addTrade = () => {
    setCurrentTrade({ id: Date.now(), symbol: '', outcome: 'win', profit: 0, timestamp: new Date().toISOString(), responses: null, notes: '', postTradeThoughts: '' });
    setShowQuestions(false);
    setResponses({});
  };

  const saveTrade = () => {
    if (!currentTrade.symbol) return;
    setTrades(prev => [...prev, { ...currentTrade, responses }]);
    setCurrentTrade(null);
    setShowQuestions(false);
    setResponses({});
    setView('journal');
  };

  const deleteTrade = (id) => {
    if (window.confirm('Delete this trade?')) {
      setTrades(prev => prev.filter(t => t.id !== id));
      setSelectedTrade(null);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `trades-${new Date().toISOString().split('T')[0]}.json`; a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target.result); if (Array.isArray(d)) setTrades(d); } catch {} };
    reader.readAsText(file);
  };

  const winLossData = [
    { name: 'Wins', value: trades.filter(t => t.outcome === 'win').length },
    { name: 'Losses', value: trades.filter(t => t.outcome === 'loss').length },
  ].filter(d => d.value > 0);

  const symbolCounts = trades.reduce((acc, t) => { if (t.symbol) acc[t.symbol] = (acc[t.symbol] || 0) + 1; return acc; }, {});
  const symbolData = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  const CHART_COLORS = ['#a78bfa', '#34d399', '#f87171', '#60a5fa', '#fbbf24', '#e879f9'];
  const WIN_LOSS_COLORS = ['#34d399', '#f87171'];

  const renderQuestion = (q) => {
    if (q.type === 'scale') return (
      <div className="flex flex-wrap gap-2 mt-3">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => setResponses({...responses, [q.id]: n})}
            className={`w-11 h-11 rounded-xl text-sm font-bold transition-all duration-200 ${responses[q.id] === n ? 'bg-white text-black scale-110' : `${glass} text-white/60 hover:bg-white/15`}`}>
            {n}
          </button>
        ))}
      </div>
    );
    if (q.type === 'yesno') return (
      <div className="flex gap-3 mt-3">
        {['yes', 'no'].map(o => (
          <button key={o} onClick={() => setResponses({...responses, [q.id]: o})}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${responses[q.id] === o ? 'bg-white text-black' : `${glass} text-white/60 hover:bg-white/15`}`}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>
    );
    if (q.type === 'number') return (
      <input type="number" value={responses[q.id] || ''} onChange={e => setResponses({...responses, [q.id]: e.target.value})}
        className={`mt-3 w-full px-4 py-3 rounded-xl ${glass} text-white placeholder-white/20 outline-none transition-all`} placeholder="0" />
    );
    return (
      <input type="text" value={responses[q.id] || ''} onChange={e => setResponses({...responses, [q.id]: e.target.value})}
        className={`mt-3 w-full px-4 py-3 rounded-xl ${glass} text-white placeholder-white/20 outline-none transition-all`} placeholder="Type your answer..." />
    );
  };

  const navItems = [
    { id: 'buddy', icon: MessageSquare, label: 'Buddy' },
    { id: 'journal', icon: BookOpen, label: 'Journal' },
    { id: 'charts', icon: BarChart2, label: 'Charts' },
    { id: 'patterns', icon: Flame, label: 'Patterns', badge: insights.length },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{
      background: 'radial-gradient(ellipse at 20% 20%, #0f0520 0%, #050510 45%, #00080f 100%)',
      fontFamily: "'DM Sans', -apple-system, sans-serif"
    }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{background:'radial-gradient(circle,#7c3aed,transparent 70%)',filter:'blur(70px)'}} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{background:'radial-gradient(circle,#0ea5e9,transparent 70%)',filter:'blur(70px)'}} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{background:'radial-gradient(circle,#ec4899,transparent 70%)',filter:'blur(50px)',transform:'translate(-50%,-50%)'}} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold tracking-widest uppercase text-white/30"
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <Brain className="w-3 h-3" /> Trading Psychology
          </div>
          <h1 className="text-5xl font-black mb-2 tracking-tight"
            style={{background:'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.45) 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Therapy
          </h1>
          <p className="text-white/25 text-sm tracking-wide">know your patterns. own your edge.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label:'Trades', value: stats.totalTrades, color:'text-white' },
            { label:'Win Rate', value:`${stats.winRate}%`, color:'text-emerald-400' },
            { label:'Avg P&L', value:`${stats.avgProfit}%`, color: parseFloat(stats.avgProfit)>=0?'text-emerald-400':'text-rose-400' },
            { label:'Total', value:`${parseFloat(stats.totalPnL)>0?'+':''}${stats.totalPnL}%`, color: parseFloat(stats.totalPnL)>=0?'text-emerald-400':'text-rose-400' },
          ].map((s, i) => (
            <div key={i} className={`${glass} rounded-2xl p-3 text-center`}>
              <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
              <div className="text-white/25 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Nav */}
        <div className={`${glass} rounded-2xl p-1 flex gap-1 mb-6`}>
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => { setView(id); setCurrentTrade(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${view===id?'bg-white text-black':'text-white/35 hover:text-white/60'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {badge > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${view===id?'bg-black/15 text-black':'bg-rose-500 text-white'}`}>{badge}</span>}
            </button>
          ))}
        </div>

        {/* ── AI BUDDY VIEW ── */}
        {view === 'buddy' && (
          <div className="flex flex-col" style={{height:'calc(100vh - 340px)', minHeight:'400px'}}>
            <div className={`${glass} rounded-3xl flex-1 flex flex-col overflow-hidden`}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0"
                        style={{background:'linear-gradient(135deg,#7c3aed,#0ea5e9)'}}>
                        <Brain className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role==='user'
                        ? 'bg-white text-black rounded-br-sm font-medium'
                        : 'bg-white/8 text-white/85 border border-white/10 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{background:'linear-gradient(135deg,#7c3aed,#0ea5e9)'}}>
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white/8 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                          style={{animation:`bounce 1s infinite ${i*0.15}s`}} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-white/8">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Tell me about this trade or how you're feeling..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 outline-none text-sm focus:border-white/20 transition-all"
                  />
                  <button onClick={sendMessage} disabled={!chatInput.trim()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                    style={{background:'linear-gradient(135deg,#7c3aed,#0ea5e9)'}}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/15 text-xs text-center mt-2">Responses use your trade history to personalise feedback</p>
              </div>
            </div>
          </div>
        )}

        {/* ── JOURNAL VIEW ── */}
        {view === 'journal' && !currentTrade && (
          <div className="space-y-3">
            <button onClick={addTrade}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
              style={{background:'linear-gradient(135deg,#7c3aed,#0ea5e9)',boxShadow:'0 0 40px rgba(124,58,237,0.25)'}}>
              + Log New Trade
            </button>
            {trades.length === 0 ? (
              <div className={`${glass} rounded-3xl p-12 text-center`}>
                <div className="text-5xl mb-3">📊</div>
                <p className="text-white/30 text-sm">Your trade history will appear here</p>
              </div>
            ) : (
              <>
                {trades.slice().reverse().map(trade => (
                  <button key={trade.id} onClick={() => setSelectedTrade(trade)}
                    className={`w-full ${glass} ${glassHover} rounded-2xl p-4 flex items-center justify-between transition-all active:scale-98`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trade.outcome==='win'?'bg-emerald-500/15':'bg-rose-500/15'}`}>
                        {trade.outcome==='win'?<TrendingUp className="w-5 h-5 text-emerald-400"/>:<TrendingDown className="w-5 h-5 text-rose-400"/>}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm">{trade.symbol}</div>
                        <div className="text-white/25 text-xs">{new Date(trade.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black ${trade.outcome==='win'?'text-emerald-400':'text-rose-400'}`}>
                        {trade.profit>0?'+':''}{trade.profit}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/15"/>
                    </div>
                  </button>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={exportData} className={`flex-1 ${glass} ${glassHover} rounded-xl py-2.5 text-xs font-semibold text-white/30 flex items-center justify-center gap-2 transition-all`}>
                    <Download className="w-3.5 h-3.5"/> Export
                  </button>
                  <label className={`flex-1 ${glass} ${glassHover} rounded-xl py-2.5 text-xs font-semibold text-white/30 flex items-center justify-center gap-2 cursor-pointer transition-all`}>
                    <Upload className="w-3.5 h-3.5"/> Import
                    <input type="file" accept=".json" onChange={importData} className="hidden"/>
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* Log Trade Form */}
        {view === 'journal' && currentTrade && !showQuestions && (
          <div className={`${glass} rounded-3xl p-6 space-y-5`}>
            <h2 className="text-xl font-black">New Trade</h2>
            <div>
              <label className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 block">Symbol</label>
              <input type="text" value={currentTrade.symbol}
                onChange={e => setCurrentTrade({...currentTrade,symbol:e.target.value.toUpperCase()})}
                className={`w-full px-4 py-3.5 rounded-xl ${glass} text-white text-xl font-black placeholder-white/15 outline-none transition-all`}
                placeholder="EURUSD"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 block">Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                {['win','loss'].map(o => (
                  <button key={o} onClick={() => setCurrentTrade({...currentTrade,outcome:o})}
                    className={`py-3.5 rounded-xl font-bold transition-all ${currentTrade.outcome===o?(o==='win'?'bg-emerald-500 text-white':'bg-rose-500 text-white'):`${glass} text-white/40 hover:text-white/70`}`}>
                    {o==='win'?'📈 Win':'📉 Loss'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 block">P&L %</label>
              <input type="number" step="0.01" value={currentTrade.profit}
                onChange={e => setCurrentTrade({...currentTrade,profit:parseFloat(e.target.value)||0})}
                className={`w-full px-4 py-3.5 rounded-xl ${glass} text-white text-xl font-black placeholder-white/15 outline-none transition-all`}
                placeholder="2.5"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 block">Pre-Trade Notes <span className="normal-case font-normal text-white/15">(optional)</span></label>
              <textarea value={currentTrade.notes} onChange={e => setCurrentTrade({...currentTrade,notes:e.target.value})}
                className={`w-full px-4 py-3.5 rounded-xl ${glass} text-white placeholder-white/15 outline-none resize-none leading-relaxed text-sm`}
                rows={3} placeholder="Your setup, reasoning, confluences..."/>
            </div>
            <button onClick={() => setShowQuestions(true)} disabled={!currentTrade.symbol}
              className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-30"
              style={{background:'linear-gradient(135deg,#7c3aed,#0ea5e9)'}}>
              Start Therapy Session →
            </button>
          </div>
        )}

        {/* Therapy Questions */}
        {view === 'journal' && currentTrade && showQuestions && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black">Therapy Session</h2>
              <span className={`text-xs px-3 py-1.5 rounded-full ${glass} text-white/30`}>
                {Object.keys(responses).length}/{questions[currentTrade.outcome].length}
              </span>
            </div>
            {questions[currentTrade.outcome].map((q, i) => (
              <div key={q.id} className={`${glass} rounded-2xl p-5`}>
                <div className="text-xs text-white/25 font-semibold uppercase tracking-widest mb-1">Q{i+1}</div>
                <div className="font-semibold text-white/85 mb-1">{q.q}</div>
                {renderQuestion(q)}
              </div>
            ))}
            <div className={`${glass} rounded-2xl p-5`}>
              <label className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 block">Reflection <span className="normal-case font-normal text-white/15">(optional)</span></label>
              <textarea value={currentTrade.postTradeThoughts} onChange={e => setCurrentTrade({...currentTrade,postTradeThoughts:e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/15 outline-none resize-none text-sm leading-relaxed"
                rows={3} placeholder="What did you learn? What would you change?"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowQuestions(false)} className={`${glass} ${glassHover} py-4 rounded-2xl font-bold`}>← Back</button>
              <button onClick={saveTrade} disabled={Object.keys(responses).length < questions[currentTrade.outcome].length}
                className="py-4 rounded-2xl font-bold active:scale-95 disabled:opacity-30"
                style={{background:'linear-gradient(135deg,#10b981,#0ea5e9)'}}>
                Complete ✓
              </button>
            </div>
          </div>
        )}

        {/* ── CHARTS VIEW ── */}
        {view === 'charts' && (
          <div className="space-y-4">
            {trades.length < 2 ? (
              <div className={`${glass} rounded-3xl p-12 text-center`}>
                <div className="text-5xl mb-3">📈</div>
                <p className="text-white/30 text-sm">Log at least 2 trades to see charts</p>
              </div>
            ) : (
              <>
                <div className={`${glass} rounded-3xl p-6`}>
                  <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Win / Loss Split</div>
                  <div className="text-2xl font-black mb-4">
                    <span className="text-emerald-400">{trades.filter(t=>t.outcome==='win').length}W</span>
                    <span className="text-white/20 mx-2">·</span>
                    <span className="text-rose-400">{trades.filter(t=>t.outcome==='loss').length}L</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={winLossData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                        paddingAngle={4} dataKey="value" labelLine={false} label={renderCustomLabel}>
                        {winLossData.map((_, i) => <Cell key={i} fill={WIN_LOSS_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{background:'rgba(15,5,32,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'#fff',fontSize:'13px'}}/>
                      <Legend formatter={(v) => <span style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {symbolData.length > 1 && (
                  <div className={`${glass} rounded-3xl p-6`}>
                    <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Most Traded Assets</div>
                    <div className="text-2xl font-black mb-4">{symbolData[0]?.name} <span className="text-white/25 text-base font-normal">leads</span></div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={symbolData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          paddingAngle={4} dataKey="value" labelLine={false} label={renderCustomLabel}>
                          {symbolData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{background:'rgba(15,5,32,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'#fff',fontSize:'13px'}}/>
                        <Legend formatter={(v) => <span style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>{v}</span>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {(() => {
                  const emotions = trades.filter(t=>t.responses?.emotion).reduce((acc,t) => {
                    const e = t.responses.emotion.toLowerCase().trim();
                    acc[e] = (acc[e]||0)+1; return acc;
                  }, {});
                  const emotionData = Object.entries(emotions).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name,value}));
                  if (emotionData.length < 2) return null;
                  return (
                    <div className={`${glass} rounded-3xl p-6`}>
                      <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Emotional States</div>
                      <div className="text-2xl font-black mb-4 capitalize">{emotionData[0]?.name} <span className="text-white/25 text-base font-normal">most common</span></div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={emotionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                            paddingAngle={4} dataKey="value" labelLine={false} label={renderCustomLabel}>
                            {emotionData.map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip contentStyle={{background:'rgba(15,5,32,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'#fff',fontSize:'13px'}}/>
                          <Legend formatter={(v)=><span style={{color:'rgba(255,255,255,0.5)',fontSize:'12px',textTransform:'capitalize'}}>{v}</span>}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── PATTERNS VIEW ── */}
        {view === 'patterns' && (
          <div className="space-y-3">
            {insights.length === 0 ? (
              <div className={`${glass} rounded-3xl p-12 text-center`}>
                <div className="text-5xl mb-3">🧠</div>
                <p className="text-white/30 text-sm">Complete more trades to reveal your patterns</p>
              </div>
            ) : insights.map((insight, i) => (
              <div key={i} className={`${glass} rounded-2xl p-5 border-l-2 ${insight.type==='warning'?'border-rose-500':'border-sky-400'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.type==='warning'?'bg-rose-500/15':'bg-sky-400/15'}`}>
                    {insight.type==='warning'?<AlertCircle className="w-4 h-4 text-rose-400"/>:<CheckCircle className="w-4 h-4 text-sky-400"/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{insight.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${glass} text-white/25`}>{insight.count} trades</span>
                    </div>
                    <p className="text-white/45 text-sm leading-relaxed">{insight.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── TRADE DETAIL MODAL ── */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.85)',backdropFilter:'blur(24px)'}}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(40px)'}}>
            <div className="p-5 flex items-center justify-between border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTrade.outcome==='win'?'bg-emerald-500/15':'bg-rose-500/15'}`}>
                  {selectedTrade.outcome==='win'?<TrendingUp className="w-5 h-5 text-emerald-400"/>:<TrendingDown className="w-5 h-5 text-rose-400"/>}
                </div>
                <div>
                  <div className="font-black">{selectedTrade.symbol}</div>
                  <div className="text-white/25 text-xs">{new Date(selectedTrade.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => deleteTrade(selectedTrade.id)} className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center transition-all">
                  <Trash2 className="w-4 h-4 text-rose-400"/>
                </button>
                <button onClick={() => setSelectedTrade(null)} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-white/50"/>
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className={`text-4xl font-black text-center py-2 ${selectedTrade.outcome==='win'?'text-emerald-400':'text-rose-400'}`}>
                {selectedTrade.profit>0?'+':''}{selectedTrade.profit}%
              </div>
              {selectedTrade.notes && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-2">Setup Notes</div>
                  <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">{selectedTrade.notes}</p>
                </div>
              )}
              {selectedTrade.responses && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Psychology</div>
                  <div className="space-y-2">
                    {Object.entries(selectedTrade.responses).map(([k,v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-white/25 capitalize">{k}</span>
                        <span className="text-white/75 font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedTrade.postTradeThoughts && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-2">Reflection</div>
                  <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">{selectedTrade.postTradeThoughts}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
