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
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

dotenv.config();

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'proscout-neural-key-2026';
const DB_PATH = path.join(process.cwd(), 'data');
const UPLOADS_PATH = path.join(DB_PATH, 'uploads');

// Initialize DB paths for local uploads
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
if (!fs.existsSync(UPLOADS_PATH)) fs.mkdirSync(UPLOADS_PATH);


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

  // Serve uploads statically
  app.use('/uploads', express.static(UPLOADS_PATH));

  // Serve uploads statically
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
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return res.status(400).json({ error: 'Identity already initialized in matrix' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdminAccount = email.toLowerCase() === 'jenisha261205@gmail.com';
      const finalRole = isAdminAccount ? 'admin' : role;

      const newUser = {
        uid: Date.now().toString(), // Firebase usually generates IDs, but we'll keep this for consistency with your existing JWT logic
        email,
        password: hashedPassword,
        displayName,
        role: finalRole,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'users', newUser.uid), newUser);

      const { password: _, ...userWithoutPassword } = newUser;
      const token = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '7d' });
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Could not sync with neural registry" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return res.status(401).json({ error: 'Invalid access sequence' });
      }

      const userDoc = querySnapshot.docs[0];
      const user = userDoc.data();

      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid access sequence' });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '7d' });
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Auth matrix connection unstable" });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', { secure: true, sameSite: 'none' });
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
      const userRef = doc(db, 'users', req.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return res.status(404).json({ error: 'User not found in matrix' });

      const currentData = userSnap.data();
      const updatedData = {
        ...currentData,
        displayName: displayName || currentData.displayName,
        bio: bio !== undefined ? bio : currentData.bio,
        preferredSport: preferredSport !== undefined ? preferredSport : currentData.preferredSport,
        sport: preferredSport || currentData.sport
      };

      await updateDoc(userRef, updatedData);

      const { password: _, ...userWithoutPassword } = updatedData;
      const token = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '7d' });
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ error: "Could not update identity profile" });
    }
  });

  // --- News API ---
  app.get('/api/news', async (req, res) => {
    const parser = new Parser({
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const feeds = [
      'https://www.espn.com/espn/rss/news',
      'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
      'https://feeds.bbci.co.uk/sport/rss.xml',
      'https://www.theguardian.com/sport/rss'
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
          console.warn(`Feed synchronization failed for ${url}:`, e);
          return [];
        }
      });

      const results = await Promise.all(feedPromises);
      const items = results.flat();

      if (items.length === 0) {
        // Mock fallback if all external feeds are unreachable in this environment
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
          },
          {
            id: 'fallback-2',
            title: "Matrix Connection Stable: Regional Talent Updates",
            excerpt: "Scouts report a surge in high-efficiency performance metrics across emerging youth academies.",
            author: "Network Lead",
            date: new Date().toISOString(),
            category: "Regional",
            imageUrl: "https://picsum.photos/seed/matrix2/800/600",
            link: "#"
          }
        ];
        return res.json(fallbackItems);
      }

      // Sort by date descending
      const sortedItems = items.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      res.json(sortedItems.slice(0, 30)); 
    } catch (err) {
      console.error("General news matrix error:", err);
      res.status(500).json({ error: "Intelligence sync failure" });
    }
  });

  // --- Assessments API ---

  app.get('/api/assessments', authenticateToken, async (req: any, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.uid;
      const assessmentsRef = collection(db, 'assessments');
      let q;

      if (userRole === 'admin') {
        q = query(assessmentsRef, orderBy('timestamp', 'desc'));
      } else if (userRole === 'scout') {
        q = query(assessmentsRef, where('scoutId', '==', userId), orderBy('timestamp', 'desc'));
      } else {
        q = query(assessmentsRef, where('athleteId', '==', userId), orderBy('timestamp', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const assessments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(assessments);
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
      const newAssessment = {
        ...req.body,
        scoutId: userRole === 'athlete' ? null : userId,
        type: userRole === 'athlete' ? 'self' : 'scout',
        timestamp: Date.now()
      };

      const docRef = await addDoc(collection(db, 'assessments'), newAssessment);
      res.json({ id: docRef.id, ...newAssessment });
    } catch (err) {
      console.error("Create assessment error:", err);
      res.status(500).json({ error: "Matrix write failure" });
    }
  });

  // --- Users API ---
  app.get('/api/users/athletes', authenticateToken, async (req, res) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'athlete'));
      const querySnapshot = await getDocs(q);
      
      const athletes = querySnapshot.docs.map(doc => {
        const { password, ...safeUser } = doc.data();
        return { id: doc.id, ...safeUser };
      });
      
      res.json(athletes);
    } catch (err) {
      console.error("Fetch athletes error:", err);
      res.status(500).json({ error: "Could not retrieve athlete matrix" });
    }
  });

  // --- Chat API ---
  app.post('/api/chat', authenticateToken, async (req: any, res) => {
    const { messages, contextualInput = '', config: reqConfig } = req.body;
    const genAI = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || ''
    });
    
    try {
      console.log("[DEBUG] Chat API Received Messages Count:", messages.length);
      console.log("[DEBUG] Chat API Contextual Input:", contextualInput);

      // Filter out initial model message
      let combinedHistory = messages.filter((m: any, i: number) => !(i === 0 && m.role === 'model'));
      
      // Map to Gemini format
      const formattedHistory = combinedHistory.map((m: any) => ({ 
        role: m.role, 
        parts: [{ text: m.content }] 
      }));

      // Add current message
      const contents = [...formattedHistory];
      const lastMessage = contents[contents.length - 1];
      
      // Only append contextualInput if it's not already the last message in history
      // (This handles cases where the frontend might have already updated its state)
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.parts[0].text !== contextualInput) {
        contents.push({ role: 'user', parts: [{ text: contextualInput }] });
      }

      // Final check: Ensure alternating roles (User/Model/User...)
      const alternatingContents = contents.filter((m, i) => i === 0 || m.role !== contents[i - 1].role);

      console.log("[DEBUG] Final Contents to Gemini:", JSON.stringify(alternatingContents, null, 2));

      const response = await genAI.models.generateContent({
        model: "models/gemini-flash-latest",
        contents: alternatingContents,
        config: {
          systemInstruction: {
            parts: [{ text: reqConfig?.systemInstruction || `You are an intelligent, friendly, and supportive AI assistant for a sports and wellness platform. Speak like a helpful coach and friend, not like a technical expert.` }]
          }
        }
      });

      console.log("[DEBUG] Gemini Response received");
      const botText = response.text || (typeof response.text === 'function' ? response.text() : "I'm processing your request.");
      res.json({ text: botText });
    } catch (err: any) {
      console.error("Server Chat Error:", err);
      if (err.status) console.error("Status:", err.status);
      if (err.message) console.error("Message:", err.message);
      if (err.errorDetails) console.error("Details:", JSON.stringify(err.errorDetails, null, 2));
      
      res.status(500).json({ error: "Neural link failed", details: err.message });
    }
  });

  // Vite middleware setup
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
