import React, { useState, useEffect, useMemo } from 'react';
import { 
  CandlestickChart, 
  Briefcase, 
  ReceiptText, 
  User, 
  Home, 
  Trophy, 
  Search, 
  Bell, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  LayoutDashboard,
  Wallet,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { NavItem, Trade, Plan, OptionData, Portfolio, Account } from './types';

// --- Constants ---
const OPTION_CHAIN_DATA: OptionData[] = [
  { strike: 22300, ce_oi: 45000, ce_oi_change: 1200, ce_ltp: 285.40, pe_ltp: 42.15, pe_oi_change: -450, pe_oi: 12000 },
  { strike: 22350, ce_oi: 32000, ce_oi_change: 800, ce_ltp: 242.10, pe_ltp: 58.30, pe_oi_change: -200, pe_oi: 15000 },
  { strike: 22400, ce_oi: 85000, ce_oi_change: 5400, ce_ltp: 198.50, pe_ltp: 76.45, pe_oi_change: 1200, pe_oi: 45000 },
  { strike: 22450, ce_oi: 125000, ce_oi_change: 12000, ce_ltp: 145.20, pe_ltp: 112.45, pe_oi_change: 4500, pe_oi: 85000 },
  { strike: 22500, ce_oi: 245000, ce_oi_change: 45000, ce_ltp: 98.30, pe_ltp: 165.20, pe_oi_change: 12000, pe_oi: 145000 },
  { strike: 22550, ce_oi: 185000, ce_oi_change: 22000, ce_ltp: 62.45, pe_ltp: 212.10, pe_oi_change: 8500, pe_oi: 98000 },
  { strike: 22600, ce_oi: 145000, ce_oi_change: 15000, ce_ltp: 38.20, pe_ltp: 265.40, pe_oi_change: 5400, pe_oi: 72000 },
];
const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 999,
    capital: 50000,
    profitTarget: 8,
    maxDD: 10,
    dailyDD: 5,
    tag: 'Entry Level'
  },
  {
    id: 'pro',
    name: 'Pro Trader',
    price: 2499,
    capital: 200000,
    profitTarget: 8,
    maxDD: 10,
    dailyDD: 5,
    tag: 'Most Popular',
    recommended: true
  },
  {
    id: 'master',
    name: 'Master Elite',
    price: 4999,
    capital: 500000,
    profitTarget: 8,
    maxDD: 10,
    dailyDD: 5,
    tag: 'Institutional'
  }
];

const RECENT_TRADES: Trade[] = [
  {
    id: '1',
    symbol: 'RELIANCE',
    type: 'BUY',
    optionType: 'CE',
    strike: 22400,
    price: 145.20,
    qty: 50,
    time: '24 Oct, 10:30 AM',
    status: 'Closed',
    pnl: 4500
  },
  {
    id: '2',
    symbol: 'HDFCBANK',
    type: 'SELL',
    optionType: 'PE',
    strike: 22500,
    price: 112.45,
    qty: 100,
    time: '23 Oct, 02:15 PM',
    status: 'Closed',
    pnl: -1200
  }
];

// --- Components ---

const Header = ({ activeTab, onBack, isSubView }: { activeTab: string, onBack?: () => void, isSubView?: boolean }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#160d08]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isSubView ? (
          <button onClick={onBack} className="p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <ArrowDown className="w-6 h-6 rotate-90" />
          </button>
        ) : activeTab === 'trade' ? (
          <Menu className="text-primary w-6 h-6" />
        ) : (
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <TrendingUp className="text-primary w-5 h-5" />
          </div>
        )}
        <h1 className="text-xl font-bold tracking-tight">{isSubView ? 'Option Chain' : 'IndiFunded'}</h1>
        {!isSubView && activeTab === 'trade' && (
          <span className="bg-slate-100 dark:bg-white/5 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500 flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            SIMULATED
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 relative">
          <Bell className="w-5 h-5" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-[#160d08]" />
        </button>
      </div>
    </header>
  );
};

const TradeView = ({ 
  onViewOptionChain, 
  price, 
  change, 
  onTrade 
}: { 
  onViewOptionChain: () => void, 
  price: number, 
  change: number,
  onTrade: (type: 'BUY' | 'SELL', strike: number) => void
}) => {
  const [strike, setStrike] = useState(22450);

  return (
    <div className="flex flex-col gap-4 p-4 pb-48">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {['Nifty 50', 'Bank Nifty', 'Fin Nifty', 'Midcap Nifty'].map((idx, i) => (
          <button 
            key={idx}
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
              i === 0 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
            }`}
          >
            {idx}
          </button>
        ))}
      </div>

      <div className="flex border-b border-slate-200 dark:border-white/5">
        {['1m', '5m', '15m', '1h', '1D'].map((tf, i) => (
          <button 
            key={tf}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              i === 0 ? 'text-primary border-b-2 border-primary' : 'text-slate-400'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-bold tracking-tighter">{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <span className={`font-bold flex items-center text-sm ${change >= 0 ? 'text-trading-up' : 'text-trading-down'}`}>
            {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(change).toFixed(2)} ({((change / price) * 100).toFixed(2)}%)
          </span>
        </div>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">As of 15:30 IST</p>
      </div>

      {/* Mock Chart */}
      <div className="relative w-full h-64 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10">
          {[...Array(24)].map((_, i) => <div key={i} className="border-r border-b border-slate-400" />)}
        </div>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path 
            d="M0,160 Q50,140 80,150 T150,100 T220,120 T300,60 T400,80" 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="3" 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2 }}
          />
          <path d="M0,160 Q50,140 80,150 T150,100 T220,120 T300,60 T400,80 V200 H0 Z" fill="url(#chartFill)" />
          <circle cx="300" cy="60" fill="#22c55e" r="4" />
          <line x1="300" y1="0" x2="300" y2="200" stroke="#22c55e" strokeWidth="1" strokeDasharray="4" />
        </svg>
        <div className="absolute right-2 top-1/4 bg-trading-up text-white text-[10px] px-1.5 py-0.5 rounded font-bold">22,480.00</div>
      </div>

      <button 
        onClick={onViewOptionChain}
        className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10"
      >
        <div className="flex items-center gap-3">
          <ReceiptText className="text-primary w-5 h-5" />
          <span className="font-bold">View Option Chain</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[10px] uppercase font-bold">28 Mar Expiry</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">PCR Ratio</p>
          <p className="text-lg font-bold">0.92</p>
          <p className="text-[10px] text-trading-down font-bold">Bearish</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">India VIX</p>
          <p className="text-lg font-bold">14.22</p>
          <p className="text-[10px] text-trading-up font-bold">+2.4%</p>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 bg-white dark:bg-[#160d08] border-t border-slate-200 dark:border-white/10 p-4 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
            <span>Strike Price</span>
            <span className="text-primary">22,450 CE</span>
          </div>
          <div className="relative w-full h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center px-2">
            <div className="flex-1 flex justify-around text-[10px] font-bold opacity-30">
              <span>22300</span>
              <span>22400</span>
              <span className="opacity-0">22450</span>
              <span>22500</span>
              <span>22600</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-24 h-10 bg-primary text-white rounded-full shadow-lg">
              <span className="text-sm font-bold">{strike}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onTrade('BUY', strike)}
            className="flex-1 bg-trading-up hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-emerald-900/20 transition-transform active:scale-95"
          >
            <span className="text-lg">BUY</span>
            <span className="text-[10px] opacity-80">LTP: ₹{(price * 0.006).toFixed(2)}</span>
          </button>
          <button 
            onClick={() => onTrade('SELL', strike)}
            className="flex-1 bg-trading-down hover:bg-red-600 text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-red-900/20 transition-transform active:scale-95"
          >
            <span className="text-lg">SELL</span>
            <span className="text-[10px] opacity-80">LTP: ₹{(price * 0.005).toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const OptionChainView = () => {
  const maxOI = Math.max(...OPTION_CHAIN_DATA.map(d => Math.max(d.ce_oi, d.pe_oi)));

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Spot Price</span>
          <span className="text-lg font-bold">22,453.80</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase">PCR</span>
          <span className="text-lg font-bold">0.92</span>
        </div>
      </div>

      {/* OI Chart visualization */}
      <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
        <h3 className="text-sm font-bold mb-4">OI Distribution</h3>
        <div className="space-y-3">
          {OPTION_CHAIN_DATA.map(data => (
            <div key={data.strike} className="flex items-center gap-2">
              <div className="flex-1 flex justify-end">
                <div 
                  className="h-3 bg-red-500/30 rounded-l-sm" 
                  style={{ width: `${(data.pe_oi / maxOI) * 100}%` }}
                />
              </div>
              <span className="w-12 text-center text-[10px] font-bold text-slate-400">{data.strike}</span>
              <div className="flex-1">
                <div 
                  className="h-3 bg-emerald-500/30 rounded-r-sm" 
                  style={{ width: `${(data.ce_oi / maxOI) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-bold uppercase">
          <span className="text-red-500">PUT OI</span>
          <span className="text-emerald-500">CALL OI</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/5 text-slate-400 uppercase font-bold">
              <th className="p-2 text-left border-b border-slate-200 dark:border-white/10">OI</th>
              <th className="p-2 text-left border-b border-slate-200 dark:border-white/10">LTP</th>
              <th className="p-2 text-center border-b border-slate-200 dark:border-white/10 bg-slate-200/50 dark:bg-white/10">Strike</th>
              <th className="p-2 text-right border-b border-slate-200 dark:border-white/10">LTP</th>
              <th className="p-2 text-right border-b border-slate-200 dark:border-white/10">OI</th>
            </tr>
          </thead>
          <tbody>
            {OPTION_CHAIN_DATA.map(data => (
              <tr key={data.strike} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="p-2 text-slate-500">{(data.ce_oi / 1000).toFixed(1)}k</td>
                <td className="p-2 font-bold text-emerald-500">{data.ce_ltp.toFixed(2)}</td>
                <td className="p-2 text-center font-black bg-slate-50 dark:bg-white/5">{data.strike}</td>
                <td className="p-2 text-right font-bold text-red-500">{data.pe_ltp.toFixed(2)}</td>
                <td className="p-2 text-right text-slate-500">{(data.pe_oi / 1000).toFixed(1)}k</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PortfolioView = ({ portfolio, onClosePosition }: { portfolio: Portfolio | null, onClosePosition: (id: string) => void }) => {
  if (!portfolio) return <div className="p-8 text-center text-slate-400 font-bold">Loading Portfolio...</div>;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <div className="rounded-3xl bg-slate-50 dark:bg-white/5 p-6 border border-slate-200 dark:border-white/10 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Equity</p>
        <div className="flex items-baseline gap-3 mb-6">
          <p className="text-4xl font-bold">₹{portfolio.equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className={`text-sm font-bold ${portfolio.unrealizedPnl >= 0 ? 'text-trading-up' : 'text-trading-down'}`}>
            {portfolio.unrealizedPnl >= 0 ? '+' : ''}{((portfolio.unrealizedPnl / portfolio.balance) * 100).toFixed(2)}%
          </p>
        </div>
        <div className="flex gap-4 border-t border-slate-200 dark:border-white/10 pt-6">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Available Balance</p>
            <p className="text-sm font-bold mt-1">₹{portfolio.balance.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-px bg-slate-200 dark:bg-white/10" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Unrealized P&L</p>
            <p className={`text-sm font-bold mt-1 ${portfolio.unrealizedPnl >= 0 ? 'text-trading-up' : 'text-trading-down'}`}>
              {portfolio.unrealizedPnl >= 0 ? '+' : ''}₹{portfolio.unrealizedPnl.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Open Positions ({portfolio.positions.length})</h3>
        <div className="flex flex-col gap-3">
          {portfolio.positions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-slate-400 font-bold">
              No open positions
            </div>
          ) : (
            portfolio.positions.map(trade => (
              <div key={trade.id} className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-[10px] font-black ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {trade.type}
                    </div>
                    <span className="font-bold text-sm">{trade.symbol} {trade.strike} {trade.optionType}</span>
                  </div>
                  <button 
                    onClick={() => onClosePosition(trade.id)}
                    className="text-[10px] font-bold text-primary uppercase hover:underline"
                  >
                    Close
                  </button>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">
                    Avg: ₹{trade.price.toFixed(2)} • Qty: {trade.qty}
                  </div>
                  <div className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-trading-up' : 'text-trading-down'}`}>
                    {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <p className="text-base font-bold">Performance</p>
          <div className="flex gap-3 text-[10px] font-bold uppercase">
            {['1D', '1W', '1M', '3M', '1Y'].map((tf, i) => (
              <span key={tf} className={i === 2 ? 'text-primary' : 'text-slate-400'}>{tf}</span>
            ))}
          </div>
        </div>
        <div className="h-40 relative">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,80 Q25,60 50,70 T100,20" fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path d="M0,80 Q25,60 50,70 T100,20 L100,100 L0,100 Z" fill="url(#grad)" opacity="0.1" />
            <defs>
              <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase">
          <span>10 Oct</span>
          <span>20 Oct</span>
          <span>30 Oct</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Win Rate', value: '65%' },
            { label: 'Profit Factor', value: '1.8' },
            { label: 'Avg. Win', value: '+₹2,500', color: 'text-trading-up' },
            { label: 'Avg. Loss', value: '-₹1,200', color: 'text-trading-down' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
              <p className={`text-lg font-bold mt-1 ${stat.color || ''}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Recent Trades</h3>
        <div className="flex flex-col gap-3">
          {RECENT_TRADES.map(trade => (
            <div key={trade.id} className="flex items-center justify-between rounded-2xl bg-white dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  trade.pnl >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-red-50 dark:bg-red-500/10 text-red-600'
                }`}>
                  {trade.symbol[0]}
                </div>
                <div>
                  <p className="text-sm font-bold">{trade.symbol}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{trade.time} • Qty: {trade.qty}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-trading-up' : 'text-trading-down'}`}>
                  {trade.pnl >= 0 ? '+' : ''}₹{Math.abs(trade.pnl).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{trade.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChallengesView = () => {
  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <div className="space-y-6">
        {PLANS.map(plan => (
          <div 
            key={plan.id} 
            className={`relative p-6 rounded-3xl border-2 transition-all ${
              plan.recommended 
                ? 'bg-white dark:bg-white/5 border-primary shadow-xl shadow-primary/5' 
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
            }`}
          >
            {plan.tag && (
              <div className="absolute -top-3 right-6 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {plan.tag}
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-3xl font-black text-primary">₹{plan.price.toLocaleString('en-IN')}</p>
              </div>
              {plan.recommended && (
                <span className="px-3 py-1 bg-accent-neon/10 text-accent-neon text-[10px] font-black rounded-full uppercase tracking-wider">
                  Recommended
                </span>
              )}
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase">Virtual Capital</span>
                <span>₹{plan.capital.toLocaleString('en-IN')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-200 dark:border-white/10">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Profit</p>
                  <p className="font-bold text-accent-neon">{plan.profitTarget}%</p>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-white/10">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Max DD</p>
                  <p className="font-bold text-trading-down">{plan.maxDD}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Daily DD</p>
                  <p className="font-bold text-red-400">{plan.dailyDD}%</p>
                </div>
              </div>
            </div>
            <button className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
              plan.recommended 
                ? 'bg-accent-neon text-black shadow-lg shadow-accent-neon/20' 
                : 'bg-primary text-white'
            }`}>
              Select {plan.name.split(' ')[0]} {plan.recommended ? <Trophy className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ReceiptText className="text-accent-neon w-5 h-5" />
          Rules FAQ
        </h2>
        <div className="space-y-2">
          {[
            { q: 'What is the Profit Target?', a: 'To successfully complete a challenge, you need to reach an 8% profit target on your initial virtual capital.' },
            { q: 'How is Daily Drawdown calculated?', a: 'Daily drawdown is calculated based on the previous day\'s closing equity or balance, whichever is higher.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-sm list-none">
                <span className="group-open:text-primary transition-colors">{faq.q}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileView = () => {
  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
          <User className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Gourav Kushwah</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Pro Trader • ID: #8842</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Wallet Balance</p>
          <p className="text-lg font-bold">₹12,450.00</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Payouts</p>
          <p className="text-lg font-bold">₹45,000.00</p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: Wallet, label: 'Withdraw Funds' },
          { icon: Trophy, label: 'My Certificates' },
          { icon: ReceiptText, label: 'Transaction History' },
          { icon: User, label: 'Account Settings' },
        ].map(item => (
          <button key={item.label} className="w-full flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-4">
              <item.icon className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('trade');
  const [showOptionChain, setShowOptionChain] = useState(false);
  const [price, setPrice] = useState(22453.80);
  const [change, setChange] = useState(102.45);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    const socket = io();

    socket.on('marketUpdate', (data) => {
      if (data.symbol === 'NIFTY 50') {
        setPrice(data.price);
        setChange(data.change);
      }
    });

    socket.on('portfolioUpdate', (data) => {
      setPortfolio(data);
    });

    // Initial fetch
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => setPortfolio(data));

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTrade = async (type: 'BUY' | 'SELL', strike: number) => {
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'NIFTY 50',
          type,
          optionType: 'CE', // Simplified for demo
          strike,
          qty: 50,
          price: price
        })
      });
      const result = await response.json();
      if (result.success) {
        // Portfolio will update via socket
      }
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  const handleClosePosition = async (tradeId: string) => {
    try {
      await fetch('/api/close-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId })
      });
    } catch (error) {
      console.error('Close position failed:', error);
    }
  };

  const navItems: NavItem[] = [
    { id: 'trade', label: 'Trade', icon: CandlestickChart },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white dark:bg-[#160d08] shadow-2xl relative">
      <Header 
        activeTab={activeTab} 
        isSubView={activeTab === 'trade' && showOptionChain}
        onBack={() => setShowOptionChain(false)}
      />
      
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (showOptionChain ? '-oc' : '')}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'trade' && (
              showOptionChain ? (
                <OptionChainView />
              ) : (
                <TradeView 
                  onViewOptionChain={() => setShowOptionChain(true)} 
                  price={price}
                  change={change}
                  onTrade={handleTrade}
                />
              )
            )}
            {activeTab === 'challenges' && <ChallengesView />}
            {activeTab === 'portfolio' && <PortfolioView portfolio={portfolio} onClosePosition={handleClosePosition} />}
            {activeTab === 'profile' && <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white/90 dark:bg-[#160d08]/90 backdrop-blur-lg border-t border-slate-200 dark:border-white/10 px-4 pb-6 pt-3 z-50">
        <div className="flex justify-around items-center">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === item.id ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
