import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import path from "path";
import rateLimit from "express-rate-limit";

import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import path from "path";
import rateLimit from "express-rate-limit";

const app = express();

// Add body parser
app.use(express.json());

// Trust proxy for rate limiting behind reverse proxies (like Cloud Run/Vercel)
app.set('trust proxy', 1);

// Apply basic rate limiting for DDOS protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false } // Disable warning if there are multiple proxies
});

// Apply the rate limiting middleware to API calls only
app.use('/api', limiter);

// Initialize Turso client (lazy init to prevent crashes if env missing)
let dbClient: ReturnType<typeof createClient> | null = null;
const getDb = () => {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing Turso configuration in environment variables");
  }
  if (!dbClient) {
    dbClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    dbClient.execute("ALTER TABLE tryouts ADD COLUMN name TEXT").catch(() => {});
    dbClient.execute("ALTER TABLE wrong_questions ADD COLUMN tryout_id TEXT").catch(() => {});
  }
  return dbClient;
};

// API to initialize DB tables (Call this once via simple GET)
app.get("/api/init-db", async (req, res) => {
  try {
    const db = getDb();
    
    if (req.query.reset === 'true') {
       await db.execute("DROP TABLE IF EXISTS tryouts");
       await db.execute("DROP TABLE IF EXISTS wrong_questions");
       await db.execute("DROP TABLE IF EXISTS registration_codes");
       await db.execute("DROP TABLE IF EXISTS users");
    }

    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )
    `);
    // Tryouts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tryouts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        reading INTEGER NOT NULL,
        listening INTEGER NOT NULL,
        name TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    try { await db.execute("ALTER TABLE tryouts ADD COLUMN name TEXT"); } catch(e) {}

    // Wrong questions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wrong_questions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        category TEXT NOT NULL,
        question TEXT NOT NULL,
        notes TEXT NOT NULL,
        tryout_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    try { await db.execute("ALTER TABLE wrong_questions ADD COLUMN tryout_id TEXT"); } catch(e) {}

    // Registration Codes
    await db.execute(`
      CREATE TABLE IF NOT EXISTS registration_codes (
        code TEXT PRIMARY KEY,
        created_by TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        used_by TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    // Seed default admin account
    try {
      await db.execute({
        sql: "INSERT INTO users (id, username, password, role) VALUES ('admin', 'aurel', 'aurel12', 'admin')",
        args: []
      });
    } catch(e) {} // Ignore if already exists

    res.json({ message: "Database initialized successfully!" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to initialize DB" });
  }
});

// ========== AUTH ROUTES ==========
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();
    const result = await db.execute({
      sql: "SELECT id, password, role FROM users WHERE username = ?",
      args: [username]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User tidak ditemukan" });
    }

    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: "Password salah" });
    }

    res.json({ userId: user.id, username, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { username, password, code } = req.body;
    if (!username || !password || !code) return res.status(400).json({ error: "Username, password, dan kode pendaftaran wajib diisi" });
    
    const db = getDb();
    
    // Verify code
    const codeCheck = await db.execute({
      sql: "SELECT * FROM registration_codes WHERE code = ? AND used = 0",
      args: [code]
    });

    if (codeCheck.rows.length === 0) {
       return res.status(400).json({ error: "Kode pendaftaran tidak valid atau sudah digunakan" });
    }

    const id = Math.random().toString(36).substring(2, 9);
    
    await db.execute({
      sql: "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, 'user')",
      args: [id, username, password]
    });

    await db.execute({
      sql: "UPDATE registration_codes SET used = 1, used_by = ? WHERE code = ?",
      args: [id, code]
    });

    res.json({ userId: id, username, role: 'user' });
  } catch (error: any) {
    res.status(500).json({ error: "Username mungkin sudah dipakai " + String(error) });
  }
});

// ========== ADMIN ROUTES ==========
app.get("/api/admin/codes", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const db = getDb();
    
    const userCheck = await db.execute({
      sql: "SELECT role FROM users WHERE id = ?",
      args: [userId]
    });
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await db.execute("SELECT registration_codes.*, users.username as used_by_username FROM registration_codes LEFT JOIN users ON registration_codes.used_by = users.id ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/codes", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const db = getDb();
    
    const userCheck = await db.execute({
      sql: "SELECT role FROM users WHERE id = ?",
      args: [userId]
    });
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const code = "EPS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await db.execute({
      sql: "INSERT INTO registration_codes (code, created_by, used, created_at) VALUES (?, ?, 0, ?)",
      args: [code, userId, Date.now()]
    });

    res.json({ code });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/user/password", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = getDb();
    
    const userCheck = await db.execute({
      sql: "SELECT id FROM users WHERE id = ?",
      args: [userId]
    });
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await db.execute({
      sql: "UPDATE users SET password = ? WHERE id = ?",
      args: [newPassword, userId]
    });

    res.json({ message: "Password updated successfully" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ========== TRYOUT ROUTES ==========
app.get("/api/tryouts", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    const result = await db.execute({
      sql: "SELECT * FROM tryouts WHERE user_id = ? ORDER BY timestamp DESC",
      args: [userId]
    });
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tryouts", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { reading, listening, name } = req.body;
    const db = getDb();
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();

    await db.execute({
      sql: "INSERT INTO tryouts (id, user_id, timestamp, reading, listening, name) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id, userId, timestamp, reading, listening, name || null]
    });

    res.json({ id, timestamp, reading, listening, name });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/tryouts/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    await db.execute({
      sql: "DELETE FROM tryouts WHERE id = ? AND user_id = ?",
      args: [req.params.id, userId]
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ========== WRONG QUESTIONS ROUTES ==========
app.get("/api/questions", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    const result = await db.execute({
      sql: "SELECT * FROM wrong_questions WHERE user_id = ? ORDER BY timestamp DESC",
      args: [userId]
    });
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/questions", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { category, question, notes, tryout_id } = req.body;
    const db = getDb();
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();

    await db.execute({
      sql: "INSERT INTO wrong_questions (id, user_id, timestamp, category, question, notes, tryout_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, userId, timestamp, category, question, notes, tryout_id || null]
    });

    res.json({ id, timestamp, category, question, notes, tryout_id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/questions/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const db = getDb();
    await db.execute({
      sql: "DELETE FROM wrong_questions WHERE id = ? AND user_id = ?",
      args: [req.params.id, userId]
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  const PORT = 3000;
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Start server if not running in a serverless environment like Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
