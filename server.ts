import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import YahooFinance from 'yahoo-finance2';
import { dhanService } from './dhanService.js';

const yf = new YahooFinance();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Database Setup ---
const db = new Database("trading.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    balance REAL,
    initial_balance REAL
  );
  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    type TEXT,
    option_type TEXT,
    strike INTEGER,
    price REAL,
    qty INTEGER,
    time TEXT,
    status TEXT,
    pnl REAL
  );
`);

// Initialize account if not exists
const initAccount = db.prepare("INSERT OR IGNORE INTO account (id, balance, initial_balance) VALUES (?, ?, ?)");
initAccount.run("user_1", 1000000, 1000000);

async function startServer() {
  const app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // --- Trading Engine State ---
let niftyPrice = 22453.80;
let niftyChange = 102.45;

const getAccount = () => db.prepare("SELECT * FROM account WHERE id = ?").get("user_1") as any;
const getOpenPositions = () => db.prepare("SELECT * FROM trades WHERE status = 'Open'").all() as any[];

const calculatePortfolio = () => {
  const account = getAccount();
  const openPositions = getOpenPositions();
  let unrealizedPnl = 0;

  openPositions.forEach(pos => {
    const currentPrice = niftyPrice; 
    const priceDiff = pos.type === 'BUY' ? (currentPrice - pos.price) : (pos.price - currentPrice);
    unrealizedPnl += priceDiff * pos.qty;
  });

  const equity = account.balance + unrealizedPnl;
  return {
    equity,
    balance: account.balance,
    unrealizedPnl,
    positions: openPositions
  };
};

// Real Market Data Fetcher
const fetchMarketData = async () => {
  let fetched = false;

  // Try Dhan API first if configured
  if (dhanService.isConfigured()) {
    const dhanQuote = await dhanService.getNiftyQuote();
    if (dhanQuote) {
      niftyPrice = dhanQuote.price;
      niftyChange = dhanQuote.change;
      console.log(`[Market Feed] Dhan API - NIFTY 50: ${niftyPrice} (${niftyChange})`);
      fetched = true;
    }
  }

  // Fallback to Yahoo Finance
  if (!fetched) {
    try {
      const result = await yf.quote('^NSEI') as any;
      if (result && result.regularMarketPrice) {
        niftyPrice = result.regularMarketPrice;
        niftyChange = result.regularMarketChange || 0;
        console.log(`[Market Feed] Yahoo Finance - NIFTY 50: ${niftyPrice} (${niftyChange})`);
        fetched = true;
      }
    } catch (error) {
      console.error('[Market Feed] Yahoo Finance Error:', (error as Error).message);
    }
  }

  // Final Fallback: Slight random movement
  if (!fetched) {
    const delta = (Math.random() - 0.5) * 2;
    niftyPrice += delta;
    niftyChange += delta;
  }

  const portfolio = calculatePortfolio();

  io.emit("marketUpdate", {
    symbol: "NIFTY 50",
    price: niftyPrice,
    change: niftyChange,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false })
  });

  io.emit("portfolioUpdate", portfolio);
};

// Fetch real data every 5 seconds (to avoid rate limits)
setInterval(fetchMarketData, 5000);

  // --- API Routes ---
  app.get("/api/portfolio", (req, res) => {
    res.json(calculatePortfolio());
  });

  app.post("/api/trade", (req, res) => {
    const { symbol, type, optionType, strike, qty, price: tradePrice } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const time = new Date().toLocaleString('en-IN');

    try {
      const insertTrade = db.prepare(`
        INSERT INTO trades (id, symbol, type, option_type, strike, price, qty, time, status, pnl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertTrade.run(id, symbol, type, optionType, strike, tradePrice, qty, time, 'Open', 0);
      
      // Optionally place order on Dhan if configured
      if (dhanService.isConfigured()) {
        dhanService.placeOrder({ symbol, type, qty, price: tradePrice, optionType, strike });
      }

      res.json({ success: true, tradeId: id });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/close-position", (req, res) => {
    const { tradeId } = req.body;
    const trade = db.prepare("SELECT * FROM trades WHERE id = ?").get(tradeId) as any;

    if (!trade || trade.status !== 'Open') {
      return res.status(400).json({ success: false, error: "Position not found or already closed" });
    }

    const currentPrice = niftyPrice;
    const priceDiff = trade.type === 'BUY' ? (currentPrice - trade.price) : (trade.price - currentPrice);
    const pnl = priceDiff * trade.qty;

    db.transaction(() => {
      db.prepare("UPDATE trades SET status = 'Closed', pnl = ? WHERE id = ?").run(pnl, tradeId);
      db.prepare("UPDATE account SET balance = balance + ? WHERE id = ?").run(pnl, "user_1");
    })();

    res.json({ success: true, pnl });
  });

  // Vite Middleware for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
