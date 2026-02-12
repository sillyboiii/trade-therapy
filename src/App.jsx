import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Brain, AlertCircle, CheckCircle, BarChart3, MessageSquare, BookOpen, X, Download, Upload, Trash2 } from 'lucide-react';

export default function App() {
  const [trades, setTrades] = useState([]);
  const [currentTrade, setCurrentTrade] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [responses, setResponses] = useState({});
  const [insights, setInsights] = useState([]);
  const [view, setView] = useState('journal');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [stats, setStats] = useState({ totalTrades: 0, winRate: 0, avgProfit: 0, totalPnL: 0 });

  const questions = {
    win: [
      { id: 'confidence', q: 'On a scale of 1-10, how confident were you entering this trade?', type: 'scale' },
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

  useEffect(() => {
    loadTrades();
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      analyzePatterns();
      calculateStats();
      saveTrades();
    }
  }, [trades]);

  const loadTrades = () => {
    const saved = localStorage.getItem('postTradeTherapy');
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading trades:', e);
      }
    }
  };

  const saveTrades = () => {
    localStorage.setItem('postTradeTherapy', JSON.stringify(trades));
  };

  const calculateStats = () => {
    const total = trades.length;
    const wins = trades.filter(t => t.outcome === 'win').length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const avgProfit = total > 0 ? totalPnL / total : 0;
    
    setStats({
      totalTrades: total,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : 0,
      avgProfit: avgProfit.toFixed(2),
      totalPnL: totalPnL.toFixed(2)
    });
  };

  const analyzePatterns = () => {
    const patterns = [];
    const completedTrades = trades.filter(t => t.responses);

    const revengeTrades = completedTrades.filter(t => 
      t.outcome === 'loss' && t.responses.revenge === 'yes'
    );
    if (revengeTrades.length >= 2) {
      patterns.push({
        type: 'warning',
        title: 'Revenge Trading Pattern',
        desc: `${revengeTrades.length} trades show revenge trading behavior. Take a break after losses.`,
        trades: revengeTrades.length
      });
    }

    const fomoTrades = completedTrades.filter(t => 
      t.outcome === 'loss' && t.responses.fomo === 'yes'
    );
    if (fomoTrades.length >= 2) {
      patterns.push({
        type: 'warning',
        title: 'FOMO Pattern Detected',
        desc: `${fomoTrades.length} losing trades entered due to FOMO. Wait for your setup.`,
        trades: fomoTrades.length
      });
    }

    const stopMovers = completedTrades.filter(t => 
      t.outcome === 'loss' && t.responses.stoploss === 'yes'
    );
    if (stopMovers.length >= 2) {
      patterns.push({
        type: 'warning',
        title: 'Stop Loss Discipline Issue',
        desc: `You've moved stops on ${stopMovers.length} losing trades. Honor your risk management.`,
        trades: stopMovers.length
      });
    }

    const overconfident = completedTrades.filter(t => 
      t.outcome === 'win' && parseInt(t.responses.confidence) >= 8
    );
    if (overconfident.length >= 3) {
      patterns.push({
        type: 'info',
        title: 'High Confidence Streak',
        desc: `${overconfident.length} trades with 8+ confidence. Watch for overconfidence bias.`,
        trades: overconfident.length
      });
    }

    const planBreakers = completedTrades.filter(t => 
      t.responses.plan === 'no'
    );
    if (planBreakers.length >= 3) {
      patterns.push({
        type: 'warning',
        title: 'Plan Discipline Breakdown',
        desc: `${planBreakers.length} trades deviated from your plan. Review your rules.`,
        trades: planBreakers.length
      });
    }

    const impulsiveTrades = completedTrades.filter(t => 
      t.responses.impulse && parseInt(t.responses.impulse) < 5
    );
    if (impulsiveTrades.length >= 3) {
      patterns.push({
        type: 'warning',
        title: 'Impulsive Entry Pattern',
        desc: `${impulsiveTrades.length} trades entered within 5 minutes. Slow down and confirm your setup.`,
        trades: impulsiveTrades.length
      });
    }

    setInsights(patterns);
  };

  const addTrade = () => {
    const newTrade = {
      id: Date.now(),
      symbol: '',
      outcome: 'win',
      profit: 0,
      timestamp: new Date().toISOString(),
      responses: null,
      notes: '',
      postTradeThoughts: ''
    };
    setCurrentTrade(newTrade);
    setShowQuestions(false);
    setResponses({});
  };

  const saveTrade = () => {
    if (!currentTrade.symbol) return;
    
    const updatedTrade = { ...currentTrade, responses };
    setTrades([...trades, updatedTrade]);
    setCurrentTrade(null);
    setShowQuestions(false);
    setResponses({});
  };

  const deleteTrade = (tradeId) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      setTrades(trades.filter(t => t.id !== tradeId));
      setSelectedTrade(null);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(trades, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trading-journal-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            setTrades(imported);
            alert('Data imported successfully!');
          }
        } catch (err) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const renderQuestion = (q) => {
    if (q.type === 'scale') {
      return (
        <div className="flex flex-wrap gap-2 mt-3">
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <button
              key={num}
              onClick={() => setResponses({...responses, [q.id]: num})}
              className={`w-12 h-12 rounded-lg text-lg font-semibold transition-all ${
                responses[q.id] === num 
                  ? 'bg-purple-500 text-white scale-110 shadow-lg' 
                  : 'bg-slate-700 hover:bg-slate-600 active:scale-95'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      );
    }
    
    if (q.type === 'yesno') {
      return (
        <div className="flex gap-3 mt-3">
          {['yes', 'no'].map(option => (
            <button
              key={option}
              onClick={() => setResponses({...responses, [q.id]: option})}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                responses[q.id] === option
                  ? 'bg-purple-500 text-white scale-105 shadow-lg'
                  : 'bg-slate-700 hover:bg-slate-600 active:scale-95'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      );
    }
    
    if (q.type === 'number') {
      return (
        <input
          type="number"
          value={responses[q.id] || ''}
          onChange={(e) => setResponses({...responses, [q.id]: e.target.value})}
          className="mt-3 px-4 py-3 bg-slate-700 rounded-lg border-2 border-slate-600 focus:border-purple-500 outline-none w-full text-lg"
          placeholder="0"
        />
      );
    }
    
    return (
      <input
        type="text"
        value={responses[q.id] || ''}
        onChange={(e) => setResponses({...responses, [q.id]: e.target.value})}
        className="mt-3 px-4 py-3 bg-slate-700 rounded-lg border-2 border-slate-600 focus:border-purple-500 outline-none w-full text-lg"
        placeholder="Type your answer..."
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Brain className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Post-Trade Therapy
            </h1>
          </div>
          <p className="text-purple-300 text-lg">Your psychology-first trading journal</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-gray-400 mb-1">Total Trades</div>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-gray-400 mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-gray-400 mb-1">Avg P&L</div>
            <div className={`text-2xl font-bold ${parseFloat(stats.avgProfit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.avgProfit}%
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-gray-400 mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${parseFloat(stats.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalPnL > 0 ? '+' : ''}{stats.totalPnL}%
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setView('journal')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              view === 'journal' 
                ? 'bg-purple-600 shadow-lg scale-105' 
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Journal</span>
          </button>
          <button
            onClick={() => setView('patterns')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              view === 'patterns' 
                ? 'bg-purple-600 shadow-lg scale-105' 
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Patterns</span>
            {insights.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {insights.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('entries')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              view === 'entries' 
                ? 'bg-purple-600 shadow-lg scale-105' 
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Entries</span>
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
              title="Export data"
            >
              <Download className="w-5 h-5" />
            </button>
            <label className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-all">
              <Upload className="w-5 h-5" />
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Journal Entries View */}
        {view === 'entries' && (
          <div className="space-y-4">
            {trades.filter(t => t.notes || t.postTradeThoughts).length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                <BookOpen className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-xl text-gray-400 mb-2">No journal entries yet</p>
                <p className="text-gray-500">Add notes to your trades to build your trading story</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trades.filter(t => t.notes || t.postTradeThoughts).map(trade => (
                  <div
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className="bg-slate-800 rounded-lg p-5 cursor-pointer hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {trade.outcome === 'win' ? (
                          <TrendingUp className="w-6 h-6 text-green-400" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-red-400" />
                        )}
                        <div>
                          <div className="font-bold text-lg">{trade.symbol}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(trade.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${
                        trade.outcome === 'win' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.profit > 0 ? '+' : ''}{trade.profit}%
                      </div>
                    </div>
                    
                    {trade.notes && (
                      <div className="bg-slate-700 rounded p-3 mb-2">
                        <div className="text-xs text-purple-400 mb-1 font-medium">Setup Notes</div>
                        <p className="text-sm text-gray-300 line-clamp-2">{trade.notes}</p>
                      </div>
                    )}
                    
                    {trade.postTradeThoughts && (
                      <div className="bg-slate-700 rounded p-3">
                        <div className="text-xs text-blue-400 mb-1 font-medium">Reflection</div>
                        <p className="text-sm text-gray-300 line-clamp-2">{trade.postTradeThoughts}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Full Entry Modal */}
        {selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-3xl rounded-xl max-h-[90vh] overflow-y-auto border border-slate-700">
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedTrade.outcome === 'win' ? (
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <div className="font-bold text-2xl">{selectedTrade.symbol}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(selectedTrade.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteTrade(selectedTrade.id)}
                    className="p-2 hover:bg-red-900 rounded-lg transition-colors"
                    title="Delete trade"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                  <button
                    onClick={() => setSelectedTrade(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className={`text-4xl font-bold text-center py-4 ${
                  selectedTrade.outcome === 'win' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedTrade.profit > 0 ? '+' : ''}{selectedTrade.profit}%
                </div>

                {selectedTrade.notes && (
                  <div>
                    <div className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide">Pre-Trade Setup</div>
                    <div className="bg-slate-700 rounded-lg p-5 whitespace-pre-wrap text-gray-200 leading-relaxed">
                      {selectedTrade.notes}
                    </div>
                  </div>
                )}

                {selectedTrade.responses && (
                  <div>
                    <div className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wide">Psychology Session</div>
                    <div className="bg-slate-700 rounded-lg p-5 space-y-3">
                      {Object.entries(selectedTrade.responses).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-slate-600 pb-2 last:border-0 last:pb-0">
                          <span className="text-gray-400 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-white font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTrade.postTradeThoughts && (
                  <div>
                    <div className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">Post-Trade Reflection</div>
                    <div className="bg-slate-700 rounded-lg p-5 whitespace-pre-wrap text-gray-200 leading-relaxed">
                      {selectedTrade.postTradeThoughts}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patterns View */}
        {view === 'patterns' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                <Brain className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-xl text-gray-400 mb-2">No patterns detected yet</p>
                <p className="text-gray-500">Complete a few trades to see psychological insights</p>
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-800 rounded-lg p-6 border-l-4 ${
                    insight.type === 'warning' 
                      ? 'border-red-500' 
                      : 'border-blue-500'
                  } hover:scale-102 transition-all border border-slate-700`}
                >
                  <div className="flex items-start gap-4">
                    {insight.type === 'warning' ? (
                      <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">{insight.title}</h3>
                        <span className="text-sm bg-slate-700 px-3 py-1 rounded-full">
                          {insight.trades} trades
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{insight.desc}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Journal View */}
        {view === 'journal' && (
          <>
            {!currentTrade ? (
              <div>
                <button
                  onClick={addTrade}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-98 py-5 rounded-xl font-bold text-xl mb-8 transition-all shadow-2xl"
                >
                  + Log New Trade
                </button>

                {/* Trade History */}
                {trades.length === 0 ? (
                  <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                    <MessageSquare className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
                    <p className="text-xl text-gray-400 mb-2">No trades logged yet</p>
                    <p className="text-gray-500">Start your trading psychology journey</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trades.slice().reverse().map(trade => (
                      <div
                        key={trade.id}
                        onClick={() => setSelectedTrade(trade)}
                        className="bg-slate-800 rounded-lg p-5 flex items-center justify-between hover:bg-slate-700 cursor-pointer active:scale-98 transition-all border border-slate-700"
                      >
                        <div className="flex items-center gap-4">
                          {trade.outcome === 'win' ? (
                            <div className="bg-green-900 p-3 rounded-lg">
                              <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                          ) : (
                            <div className="bg-red-900 p-3 rounded-lg">
                              <TrendingDown className="w-6 h-6 text-red-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-lg">{trade.symbol}</div>
                            <div className="text-sm text-gray-400">
                              {new Date(trade.timestamp).toLocaleDateString()} • {new Date(trade.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${
                          trade.outcome === 'win' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.profit > 0 ? '+' : ''}{trade.profit}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-700">
                {!showQuestions ? (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold mb-6">Trade Details</h2>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-400">Symbol / Pair</label>
                      <input
                        type="text"
                        value={currentTrade.symbol}
                        onChange={(e) => setCurrentTrade({...currentTrade, symbol: e.target.value.toUpperCase()})}
                        className="w-full px-5 py-4 bg-slate-700 rounded-lg border-2 border-slate-600 focus:border-purple-500 outline-none text-xl font-bold"
                        placeholder="e.g., EURUSD, AAPL, BTC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-400">Outcome</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setCurrentTrade({...currentTrade, outcome: 'win'})}
                          className={`py-4 rounded-lg font-bold text-lg transition-all ${
                            currentTrade.outcome === 'win'
                              ? 'bg-green-600 scale-105 shadow-xl'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          Win 📈
                        </button>
                        <button
                          onClick={() => setCurrentTrade({...currentTrade, outcome: 'loss'})}
                          className={`py-4 rounded-lg font-bold text-lg transition-all ${
                            currentTrade.outcome === 'loss'
                              ? 'bg-red-600 scale-105 shadow-xl'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          Loss 📉
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-400">Profit / Loss %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentTrade.profit}
                        onChange={(e) => setCurrentTrade({...currentTrade, profit: parseFloat(e.target.value)})}
                        className="w-full px-5 py-4 bg-slate-700 rounded-lg border-2 border-slate-600 focus:border-purple-500 outline-none text-xl font-bold"
                        placeholder="e.g., 2.5 or -1.3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-400">
                        Pre-Trade Notes <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={currentTrade.notes}
                        onChange={(e) => setCurrentTrade({...currentTrade, notes: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-700 rounded-lg border-2 border-slate-600 focus:border-purple-500 outline-none resize-none text-base leading-relaxed"
                        rows="5"
                        placeholder="What was your setup? Why did you enter? What was your plan? What confluences did you see?"
                      />
                    </div>

                    <button
                      onClick={() => setShowQuestions(true)}
                      disabled={!currentTrade.symbol}
                      className="w-full bg-purple-600 hover:bg-purple-700 active:scale-98 py-5 rounded-xl font-bold text-lg mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                    >
                      Continue to Therapy Session →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold">Therapy Session</h2>
                      <div className="text-sm text-gray-400 bg-slate-700 px-4 py-2 rounded-full">
                        {Object.keys(responses).length}/{questions[currentTrade.outcome].length} answered
                      </div>
                    </div>
                    
                    {questions[currentTrade.outcome].map((q, idx) => (
                      <div key={q.id} className="bg-slate-700 rounded-lg p-5 border-2 border-slate-600">
                        <div className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wide">
                          Question {idx + 1} of {questions[currentTrade.outcome].length}
                        </div>
                        <div className="text-lg md:text-xl font-semibold mb-1">{q.q}</div>
                        {renderQuestion(q)}
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-400">
                        Post-Trade Reflection <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={currentTrade.postTradeThoughts}
                        onChange={(e) => setCurrentTrade({...currentTrade, postTradeThoughts: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-700 rounded-lg border-2 border-slate-600 focus:border-purple-500 outline-none resize-none text-base leading-relaxed"
                        rows="5"
                        placeholder="What did you learn? What would you do differently next time? How do you feel about this trade? What patterns are you noticing?"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <button
                        onClick={() => setShowQuestions(false)}
                        className="bg-slate-700 hover:bg-slate-600 active:scale-95 py-4 rounded-xl font-bold transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={saveTrade}
                        disabled={Object.keys(responses).length < questions[currentTrade.outcome].length}
                        className="bg-green-600 hover:bg-green-700 active:scale-95 py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
                      >
                        Complete Session ✓
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
