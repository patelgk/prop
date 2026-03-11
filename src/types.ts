import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  id: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  optionType: 'CE' | 'PE';
  strike: number;
  price: number;
  qty: number;
  time: string;
  status: 'Open' | 'Closed';
  pnl: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  capital: number;
  profitTarget: number;
  maxDD: number;
  dailyDD: number;
  tag?: string;
  recommended?: boolean;
}

export interface OptionData {
  strike: number;
  ce_oi: number;
  ce_oi_change: number;
  ce_ltp: number;
  pe_ltp: number;
  pe_oi_change: number;
  pe_oi: number;
}

export interface Portfolio {
  equity: number;
  balance: number;
  unrealizedPnl: number;
  realizedPnl: number;
  positions: Trade[];
}

export interface Account {
  id: string;
  balance: number;
  initialBalance: number;
  equity: number;
}
