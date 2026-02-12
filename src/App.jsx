import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Brain, AlertCircle, CheckCircle, BarChart3, MessageSquare, BookOpen, X, Download, Upload, Trash2, ChevronRight, Flame } from 'lucide-react';

const glass = "backdrop-blur-xl bg-white/5 border border-white/10";
const glassHover = "hover:bg-white/10 hover:border-white/20";
const glassActive = "bg-white/10 border-white/20";

export default function App() {
  const [trades, setTrades] = useState([]);
  const [currentTrade, setCurrentTrade] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [responses, setResponses] = useState({});
  const [insights, setInsights] = useState([]);
  const [view, setView] = useState('journal');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [stats, setStats] = useState({ totalTrades: 0, winRate: 0, avgProfit: 0, totalPnL: 0 });
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    loadTrades();
    setTimeout(() => setAnimateIn(true), 50);
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      analyzePatterns();
      calculateStats();
      localStorage.setItem('postTradeTherapy', JSON.stringify(trades));
    }
  }, [trades]);

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

  const loadTrades = () => {
    const saved = localStorage.getItem('postTradeTherapy');
    if (saved) {
      try { setTrades(JSON.parse(saved)); } catch (e) {}
    }
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
    check(t => t.outcome === 'win' && parseInt(t.responses.confidence) >= 8, 'info', 'Overconfidence Risk', n => `${n} trades at 8+ confidence. Watch for overconfidence bias.`);
    check(t => t.responses.plan === 'no', 'warning', 'Plan Deviations', n => `${n} trades deviated from your plan. Rules exist for a reason.`);
    check(t => t.responses.impulse && parseInt(t.responses.impulse) < 5, 'warning', 'Impulsive Entries', n => `${n} trades entered within 5 minutes. Slow down.`);
    setInsights(patterns);
  };

  const addTrade = () => {
    setCurrentTrade({ id: Date.now(), symbol: '', outcome: 'win', profit: 0, timestamp: new Date().toISOString(), responses: null, notes: '', postTradeThoughts: '' });
    setShowQuestions(false);
    setResponses({});
  };

  const saveTrade = () => {
    if (!currentTrade.symbol) return;
    setTrades([...trades, { ...currentTrade, responses }]);
    setCurrentTrade(null);
    setShowQuestions(false);
    setResponses({});
  };

  const deleteTrade = (id) => {
    if (window.confirm('Delete this trade?')) {
      setTrades(trades.filter(t => t.id !== id));
      setSelectedTrade(null);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) { setTrades(data); alert('Imported!'); }
      } catch { alert('Invalid file'); }
    };
    reader.readAsText(file);
  };

  const renderQuestion = (q) => {
    if (q.type === 'scale') return (
      <div className="flex flex-wrap gap-2 mt-3">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => setResponses({...responses, [q.id]: n})}
            className={`w-11 h-11 rounded-xl text-sm font-bold transition-all duration-200 ${responses[q.id] === n ? 'bg-white text-black scale-110' : `${glass} text-white/70 hover:bg-white/15`}`}>
            {n}
          </button>
        ))}
      </div>
    );
    if (q.type === 'yesno') return (
      <div className="flex gap-3 mt-3">
        {['yes','no'].map(o => (
          <button key={o} onClick={() => setResponses({...responses, [q.id]: o})}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${responses[q.id] === o ? 'bg-white text-black' : `${glass} text-white/70 hover:bg-white/15`}`}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>
    );
    if (q.type === 'number') return (
      <input type="number" value={responses[q.id] || ''} onChange={e => setResponses({...responses, [q.id]: e.target.value})}
        className={`mt-3 w-full px-4 py-3 rounded-xl ${glass} text-white placeholder-white/30 outline-none focus:border-white/30 transition-all`}
        placeholder="0" />
    );
    return (
      <input type="text" value={responses[q.id] || ''} onChange={e => setResponses({...responses, [q.id]: e.target.value})}
        className={`mt-3 w-full px-4 py-3 rounded-xl ${glass} text-white placeholder-white/30 outline-none focus:border-white/30 transition-all`}
        placeholder="Type your answer..." />
    );
  };

  const navItems = [
    { id: 'journal', icon: MessageSquare, label: 'Journal' },
    { id: 'patterns', icon: Flame, label: 'Patterns', badge: insights.length },
    { id: 'entries', icon: BookOpen, label: 'Entries' },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{
      background: 'radial-gradient(ellipse at 20% 20%, #1a0533 0%, #050510 40%, #000d1a 100%)',
      fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif"
    }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{background: 'radial-gradient(circle, #7c3aed, transparent 70%)', filter: 'blur(60px)'}} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{background: 'radial-gradient(circle, #0ea5e9, transparent 70%)', filter: 'blur(60px)'}} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{background: 'radial-gradient(circle, #ec4899, transparent 70%)', filter: 'blur(40px)'}} />
      </div>

      <div className={`relative max-w-2xl mx-auto px-4 py-8 pb-28 transition-all duration-700 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold tracking-widest uppercase text-white/40"
            style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)'}}>
            <Brain className="w-3 h-3" /> Trading Psychology
          </div>
          <h1 className="text-5xl font-black mb-2 tracking-tight"
            style={{background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            Therapy
          </h1>
          <p className="text-white/30 text-sm tracking-wide">know your patterns. own your edge.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Trades', value: stats.totalTrades, color: 'text-white' },
            { label: 'Win Rate', value: `${stats.winRate}%`, color: 'text-emerald-400' },
            { label: 'Avg P&L', value: `${stats.avgProfit}%`, color: parseFloat(stats.avgProfit) >= 0 ? 'text-emerald-400' : 'text-rose-400' },
            { label: 'Total', value: `${parseFloat(stats.totalPnL) > 0 ? '+' : ''}${stats.totalPnL}%`, color: parseFloat(stats.totalPnL) >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          ].map((s, i) => (
            <div key={i} className={`${glass} rounded-2xl p-3 text-center`}>
              <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
              <div className="text-white/30 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation pill */}
        <div className={`${glass} rounded-2xl p-1 flex gap-1 mb-6`}>
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setView(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${view === id ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {badge > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${view === id ? 'bg-black/20 text-black' : 'bg-rose-500/80 text-white'}`}>{badge}</span>}
            </button>
          ))}
        </div>

        {/* ── JOURNAL VIEW ── */}
        {view === 'journal' && !currentTrade && (
          <div className="space-y-3">
            <button onClick={addTrade}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95"
              style={{background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', boxShadow: '0 0 40px rgba(124,58,237,0.3)'}}>
              + Log New Trade
            </button>

            {trades.length === 0 ? (
              <div className={`${glass} rounded-3xl p-12 text-center`}>
                <div className="text-5xl mb-4">📊</div>
                <p className="text-white/40 text-sm">Your trade history will appear here</p>
              </div>
            ) : (
              trades.slice().reverse().map(trade => (
                <button key={trade.id} onClick={() => setSelectedTrade(trade)}
                  className={`w-full ${glass} ${glassHover} rounded-2xl p-4 flex items-center justify-between transition-all duration-200 active:scale-98`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trade.outcome === 'win' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                      {trade.outcome === 'win'
                        ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                        : <TrendingDown className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{trade.symbol}</div>
                      <div className="text-white/30 text-xs">{new Date(trade.timestamp).toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-black ${trade.outcome === 'win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.profit > 0 ? '+' : ''}{trade.profit}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </div>
                </button>
              ))
            )}

            {/* Export/Import */}
            {trades.length > 0 && (
              <div className="flex gap-2 pt-2">
                <button onClick={exportData} className={`flex-1 ${glass} ${glassHover} rounded-xl py-2.5 text-xs font-semibold text-white/40 flex items-center justify-center gap-2 transition-all`}>
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
                <label className={`flex-1 ${glass} ${glassHover} rounded-xl py-2.5 text-xs font-semibold text-white/40 flex items-center justify-center gap-2 transition-all cursor-pointer`}>
                  <Upload className="w-3.5 h-3.5" /> Import
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            )}
          </div>
        )}

        {/* ── LOG TRADE FORM ── */}
        {view === 'journal' && currentTrade && !showQuestions && (
          <div className={`${glass} rounded-3xl p-6 space-y-5`}>
            <h2 className="text-xl font-black">New Trade</h2>

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Symbol</label>
              <input type="text" value={currentTrade.symbol}
                onChange={e => setCurrentTrade({...currentTrade, symbol: e.target.value.toUpperCase()})}
                className={`w-full px-4 py-3.5 rounded-xl ${glass} text-white text-xl font-black placeholder-white/20 outline-none focus:border-white/20 transition-all`}
                placeholder="EURUSD" />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                {['win','loss'].map(o => (
                  <button key={o} onClick={() => setCurrentTrade({...currentTrade, outcome: o})}
                    className={`py-3.5 rounded-xl font-bold transition-all duration-200 ${currentTrade.outcome === o
                      ? o === 'win' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      : `${glass} text-white/40 hover:text-white/70`}`}>
                    {o === 'win' ? '📈 Win' : '📉 Loss'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">P&L %</label>
              <input type="number" step="0.01" value={currentTrade.profit}
                onChange={e => setCurrentTrade({...currentTrade, profit: parseFloat(e.target.value) || 0})}
                className={`w-full px-4 py-3.5 rounded-xl ${glass} text-white text-xl font-black placeholder-white/20 outline-none focus:border-white/20 transition-all`}
                placeholder="2.5" />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Pre-Trade Notes <span className="normal-case font-normal text-white/20">(optional)</span></label>
              <textarea value={currentTrade.notes} onChange={e => setCurrentTrade({...currentTrade, notes: e.target.value})}
                className={`w-full px-4 py-3.5 rounded-xl ${glass} text-white placeholder-white/20 outline-none resize-none leading-relaxed text-sm transition-all`}
                rows={4} placeholder="Your setup, reasoning, confluences..." />
            </div>

            <button onClick={() => setShowQuestions(true)} disabled={!currentTrade.symbol}
              className="w-full py-4 rounded-2xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-30"
              style={{background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)'}}>
              Start Therapy Session →
            </button>
          </div>
        )}

        {/* ── THERAPY QUESTIONS ── */}
        {view === 'journal' && currentTrade && showQuestions && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black">Therapy Session</h2>
              <span className={`text-xs px-3 py-1.5 rounded-full ${glass} text-white/40`}>
                {Object.keys(responses).length}/{questions[currentTrade.outcome].length}
              </span>
            </div>

            {questions[currentTrade.outcome].map((q, i) => (
              <div key={q.id} className={`${glass} rounded-2xl p-5`}>
                <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1">Q{i+1}</div>
                <div className="font-semibold text-white/90 mb-1">{q.q}</div>
                {renderQuestion(q)}
              </div>
            ))}

            <div className={`${glass} rounded-2xl p-5`}>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Post-Trade Reflection <span className="normal-case font-normal text-white/20">(optional)</span></label>
              <textarea value={currentTrade.postTradeThoughts} onChange={e => setCurrentTrade({...currentTrade, postTradeThoughts: e.target.value})}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none resize-none leading-relaxed text-sm`}
                rows={4} placeholder="What did you learn? What would you do differently?" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowQuestions(false)} className={`${glass} ${glassHover} py-4 rounded-2xl font-bold transition-all`}>
                ← Back
              </button>
              <button onClick={saveTrade} disabled={Object.keys(responses).length < questions[currentTrade.outcome].length}
                className="py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-30"
                style={{background: 'linear-gradient(135deg, #10b981, #0ea5e9)'}}>
                Complete ✓
              </button>
            </div>
          </div>
        )}

        {/* ── PATTERNS VIEW ── */}
        {view === 'patterns' && (
          <div className="space-y-3">
            {insights.length === 0 ? (
              <div className={`${glass} rounded-3xl p-12 text-center`}>
                <div className="text-5xl mb-4">🧠</div>
                <p className="text-white/40 text-sm">Complete more trades to reveal your patterns</p>
              </div>
            ) : insights.map((insight, i) => (
              <div key={i} className={`${glass} rounded-2xl p-5 border-l-2 ${insight.type === 'warning' ? 'border-rose-500' : 'border-sky-400'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.type === 'warning' ? 'bg-rose-500/20' : 'bg-sky-400/20'}`}>
                    {insight.type === 'warning'
                      ? <AlertCircle className="w-4 h-4 text-rose-400" />
                      : <CheckCircle className="w-4 h-4 text-sky-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{insight.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${glass} text-white/30`}>{insight.count} trades</span>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed">{insight.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ENTRIES VIEW ── */}
        {view === 'entries' && (
          <div className="space-y-3">
            {trades.filter(t => t.notes || t.postTradeThoughts).length === 0 ? (
              <div className={`${glass} rounded-3xl p-12 text-center`}>
                <div className="text-5xl mb-4">📓</div>
                <p className="text-white/40 text-sm">Add notes to your trades to see them here</p>
              </div>
            ) : (
              trades.filter(t => t.notes || t.postTradeThoughts).slice().reverse().map(trade => (
                <button key={trade.id} onClick={() => setSelectedTrade(trade)}
                  className={`w-full text-left ${glass} ${glassHover} rounded-2xl p-5 transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{trade.symbol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${trade.outcome === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {trade.profit > 0 ? '+' : ''}{trade.profit}%
                      </span>
                    </div>
                    <span className="text-white/20 text-xs">{new Date(trade.timestamp).toLocaleDateString()}</span>
                  </div>
                  {trade.notes && <p className="text-white/40 text-xs line-clamp-2 leading-relaxed">{trade.notes}</p>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── TRADE DETAIL MODAL ── */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)'}}>
          <div className={`w-full max-w-lg rounded-3xl overflow-hidden`}
            style={{background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(40px)'}}>

            {/* Modal header */}
            <div className="p-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTrade.outcome === 'win' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  {selectedTrade.outcome === 'win'
                    ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                    : <TrendingDown className="w-5 h-5 text-rose-400" />}
                </div>
                <div>
                  <div className="font-black">{selectedTrade.symbol}</div>
                  <div className="text-white/30 text-xs">{new Date(selectedTrade.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => deleteTrade(selectedTrade.id)} className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center transition-all">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </button>
                <button onClick={() => setSelectedTrade(null)} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className={`text-4xl font-black text-center py-3 ${selectedTrade.outcome === 'win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedTrade.profit > 0 ? '+' : ''}{selectedTrade.profit}%
              </div>

              {selectedTrade.notes && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Setup Notes</div>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{selectedTrade.notes}</p>
                </div>
              )}

              {selectedTrade.responses && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Psychology</div>
                  <div className="space-y-2">
                    {Object.entries(selectedTrade.responses).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-white/30 capitalize">{k}</span>
                        <span className="text-white/80 font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTrade.postTradeThoughts && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Reflection</div>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{selectedTrade.postTradeThoughts}</p>
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
      `}</style>
    </div>
  );
}
