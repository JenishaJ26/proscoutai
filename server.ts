import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'proscout-neural-key-2026';
const DB_PATH = path.join(process.cwd(), 'data');
const UPLOADS_PATH = path.join(DB_PATH, 'uploads');
const USERS_FILE = path.join(DB_PATH, 'users.json');
const ASSESSMENTS_FILE = path.join(DB_PATH, 'assessments.json');

// Initialize DB paths and files
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
if (!fs.existsSync(UPLOADS_PATH)) fs.mkdirSync(UPLOADS_PATH);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(ASSESSMENTS_FILE)) fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify([], null, 2));

// Helper Functions for Local DB
const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const saveUsers = (users: any[]) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const loadAssessments = () => JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, 'utf8'));
const saveAssessments = (assessments: any[]) => fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  app.use('/uploads', express.static(UPLOADS_PATH));

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth token missing' });

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  // --- Auth API ---

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, displayName, role } = req.body;

    try {
      const users = loadUsers();
      if (users.find((u: any) => u.email === email)) {
        return res.status(400).json({ error: 'Identity already initialized in matrix' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdminAccount = email.toLowerCase() === 'jenisha261205@gmail.com';
      const finalRole = isAdminAccount ? 'admin' : role;

      const newUser = {
        uid: Date.now().toString(),
        email,
        password: hashedPassword,
        displayName,
        role: finalRole,
        createdAt: Date.now()
      };

      users.push(newUser);
      saveUsers(users);

      const { password: _, ...userWithoutPassword } = newUser;
      const token = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '7d' });
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      console.error("Registration error FULL DETAILS:", err);
      res.status(500).json({ error: "Could not sync with neural registry", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const users = loadUsers();
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        return res.status(401).json({ error: 'Invalid access sequence' });
      }

      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid access sequence' });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '7d' });
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      console.error("Login error FULL DETAILS:", err);
      res.status(500).json({ error: "Auth matrix connection unstable", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', { sameSite: 'lax' });
    res.json({ success: true });
  });

  app.post('/api/upload', authenticateToken, upload.single('video'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
    const { displayName, bio, preferredSport } = req.body;
    
    try {
      const users = loadUsers();
      const userIndex = users.findIndex((u: any) => u.uid === req.user.uid);

      if (userIndex === -1) return res.status(404).json({ error: 'User not found in matrix' });

      const currentData = users[userIndex];
      const updatedData = {
        ...currentData,
        displayName: displayName || currentData.displayName,
        bio: bio !== undefined ? bio : currentData.bio,
        preferredSport: preferredSport !== undefined ? preferredSport : currentData.preferredSport,
        sport: preferredSport || currentData.sport
      };

      users[userIndex] = updatedData;
      saveUsers(users);

      const { password: _, ...userWithoutPassword } = updatedData;
      const token = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '7d' });
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
      
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ error: "Could not update identity profile" });
    }
  });

  app.put('/api/auth/security', authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
      const users = loadUsers();
      const userIndex = users.findIndex((u: any) => u.uid === req.user.uid);

      if (userIndex === -1) return res.status(404).json({ error: 'User not found in matrix' });

      const user = users[userIndex];
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ error: 'Current matrix key is invalid.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      users[userIndex].password = hashedPassword;
      saveUsers(users);

      res.json({ message: 'Neural key updated successfully.' });
    } catch (err) {
      console.error("Security update error:", err);
      res.status(500).json({ error: "Could not update security matrix" });
    }
  });

  // --- News API ---
  app.get('/api/news', async (req, res) => {
    const parser = new Parser({
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const feeds = [
      'https://www.espn.com/espn/rss/news',
      'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
      'https://feeds.bbci.co.uk/sport/rss.xml'
    ];

    try {
      const feedPromises = feeds.map(async (url) => {
        try {
          const feed = await parser.parseURL(url);
          return feed.items.map(item => ({
            id: item.guid || item.link || Math.random().toString(),
            title: item.title,
            excerpt: item.contentSnippet || item.content?.replace(/<[^>]*>?/gm, '').slice(0, 200) || 'Intelligence report pending...',
            author: item.creator || feed.title?.replace('BBC Sport - ', '') || 'Scout Network',
            date: item.pubDate || item.isoDate || new Date().toISOString(),
            category: feed.title?.split(':').pop()?.trim() || 'Global Sports',
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.title || 'news')}/800/600`,
            link: item.link
          }));
        } catch (e) {
          return [];
        }
      });

      const results = await Promise.all(feedPromises);
      const items = results.flat();

      if (items.length === 0) {
        const fallbackItems = [
          {
            id: 'fallback-1',
            title: "Neural Scouting: The 2026 Shift in Athlete Biometrics",
            excerpt: "New data models suggest that predictive analytics are now outperforming traditional scouting by 45%.",
            author: "System Architect",
            date: new Date().toISOString(),
            category: "Intelligence",
            imageUrl: "https://picsum.photos/seed/neural1/800/600",
            link: "#"
          }
        ];
        return res.json(fallbackItems);
      }

      const sortedItems = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(sortedItems.slice(0, 30)); 
    } catch (err) {
      res.status(500).json({ error: "Intelligence sync failure" });
    }
  });

  // --- Assessments API ---

  app.get('/api/assessments', authenticateToken, async (req: any, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.uid;
      const assessments = loadAssessments();
      let filtered;

      if (userRole === 'admin') {
        filtered = assessments;
      } else if (userRole === 'scout') {
        filtered = assessments.filter((a: any) => a.scoutId === userId);
      } else {
        filtered = assessments.filter((a: any) => a.athleteId === userId);
      }

      const sorted = filtered.sort((a: any, b: any) => b.timestamp - a.timestamp);
      res.json(sorted);
    } catch (err) {
      console.error("Fetch assessments error:", err);
      res.status(500).json({ error: "Telemetry link failure" });
    }
  });

  app.post('/api/assessments', authenticateToken, async (req: any, res) => {
    const userRole = req.user.role;
    const userId = req.user.uid;

    if (userRole === 'athlete' && req.body.athleteId !== userId) {
      return res.status(403).json({ error: 'Permission denied: Athletes can only log self-assessments' });
    }

    try {
      const assessments = loadAssessments();
      const newAssessment = {
        id: Date.now().toString(),
        ...req.body,
        scoutId: userRole === 'athlete' ? null : userId,
        type: userRole === 'athlete' ? 'self' : 'scout',
        timestamp: Date.now()
      };

      assessments.push(newAssessment);
      saveAssessments(assessments);
      res.json(newAssessment);
    } catch (err) {
      console.error("Create assessment error:", err);
      res.status(500).json({ error: "Matrix write failure" });
    }
  });

  // --- Users API ---
  app.get('/api/users/athletes', authenticateToken, async (req, res) => {
    try {
      const users = loadUsers();
      const athletes = users.filter((u: any) => u.role === 'athlete').map((u: any) => {
        const { password, ...safeUser } = u;
        return safeUser;
      });
      res.json(athletes);
    } catch (err) {
      res.status(500).json({ error: "Could not retrieve athlete matrix" });
    }
  });

  // --- Chat API ---
  app.post('/api/chat', authenticateToken, async (req: any, res) => {
    const { messages, contextualInput = '', config: reqConfig } = req.body;
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    try {
      let combinedHistory = messages.filter((m: any, i: number) => !(i === 0 && m.role === 'model'));
      const formattedHistory = combinedHistory.map((m: any) => ({ 
        role: m.role, 
        parts: [{ text: m.content }] 
      }));

      const contents = [...formattedHistory];
      const lastMessage = contents[contents.length - 1];
      
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.parts[0].text !== contextualInput) {
        contents.push({ role: 'user', parts: [{ text: contextualInput }] });
      }

      const alternatingContents = contents.filter((m, i) => i === 0 || m.role !== contents[i - 1].role);

      const response = await genAI.models.generateContent({
        model: "models/gemini-flash-latest",
        contents: alternatingContents,
        config: {
          systemInstruction: {
            parts: [{ text: reqConfig?.systemInstruction || `You are an intelligent, friendly, and supportive AI assistant for a sports and wellness platform.` }]
          }
        }
      });

      const botText = response.text || (typeof response.text === 'function' ? response.text() : "I'm processing your request.");
      res.json({ text: botText });
    } catch (err: any) {
      res.status(500).json({ error: "Neural link failed", details: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Neural Server Active on http://localhost:${PORT}`);
  });
}

startServer();
