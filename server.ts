import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'proscout-neural-key-2026';
const DB_PATH = path.join(process.cwd(), 'data');

// Ensure DB directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH);
}

const USERS_FILE = path.join(DB_PATH, 'users.json');
const ASSESSMENTS_FILE = path.join(DB_PATH, 'assessments.json');

// Initialize DB files
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(ASSESSMENTS_FILE)) fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify([]));

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  // Helper to read/write DB
  const getData = (file: string) => JSON.parse(fs.readFileSync(file, 'utf-8'));
  const saveData = (file: string, data: any) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

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
    const users = getData(USERS_FILE);

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
    saveData(USERS_FILE, users);

    const { password: _, ...userWithoutPassword } = newUser;
    const token = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '7d' });
    
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ user: userWithoutPassword, token });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const users = getData(USERS_FILE);
    const user = users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
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
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', { secure: true, sameSite: 'none' });
    res.json({ success: true });
  });

  app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
    const { displayName, bio, preferredSport } = req.body;
    const users = getData(USERS_FILE);
    const userIndex = users.findIndex((u: any) => u.uid === req.user.uid);

    if (userIndex === -1) return res.status(404).json({ error: 'User not found in matrix' });

    users[userIndex] = {
      ...users[userIndex],
      displayName: displayName || users[userIndex].displayName,
      bio: bio !== undefined ? bio : users[userIndex].bio,
      preferredSport: preferredSport !== undefined ? preferredSport : users[userIndex].preferredSport,
      sport: preferredSport || users[userIndex].sport
    };

    saveData(USERS_FILE, users);
    const { password: _, ...updatedUser } = users[userIndex];
    
    const token = jwt.sign(updatedUser, SECRET_KEY, { expiresIn: '7d' });
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ user: updatedUser });
  });

  // --- Assessments API ---

  app.get('/api/assessments', authenticateToken, (req: any, res) => {
    const assessments = getData(ASSESSMENTS_FILE);
    const userRole = req.user.role;
    const userId = req.user.uid;

    if (userRole === 'admin') {
      return res.json(assessments);
    }
    
    if (userRole === 'scout') {
      return res.json(assessments.filter((a: any) => a.scoutId === userId));
    }

    return res.json(assessments.filter((a: any) => a.athleteId === userId));
  });

  app.post('/api/assessments', authenticateToken, (req: any, res) => {
    const assessments = getData(ASSESSMENTS_FILE);
    const userRole = req.user.role;
    const userId = req.user.uid;

    if (userRole === 'athlete' && req.body.athleteId !== userId) {
      return res.status(403).json({ error: 'Permission denied: Athletes can only log self-assessments' });
    }

    const newAssessment = {
      id: Date.now().toString(),
      ...req.body,
      scoutId: userRole === 'athlete' ? null : userId,
      type: userRole === 'athlete' ? 'self' : 'scout',
      timestamp: Date.now()
    };

    assessments.push(newAssessment);
    saveData(ASSESSMENTS_FILE, assessments);
    res.json(newAssessment);
  });

  // --- Users API ---
  app.get('/api/users/athletes', authenticateToken, (req: any, res) => {
    const users = getData(USERS_FILE);
    res.json(users.filter((u: any) => u.role === 'athlete').map(({ password, ...u }: any) => u));
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
