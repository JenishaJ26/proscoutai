import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ''
});

async function list() {
  try {
    const models = await genAI.models.list();
    for await (const m of models) {
      console.log(m.name);
    }
  } catch(e) {
    console.error(e.message);
  }
}

list();
