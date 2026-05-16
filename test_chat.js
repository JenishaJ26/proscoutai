import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ''
});

async function runTest() {
  try {
    const contents = [
      { role: 'user', parts: [{ text: 'Test message' }] }
    ];
    
    console.log("Calling API...");
    const response = await genAI.models.generateContent({
      model: "models/gemini-flash-latest",
      contents,
      config: {
        systemInstruction: {
          parts: [{ text: `You are an intelligent, friendly, and supportive AI assistant for a sports and wellness platform.
          Speak like a helpful coach and friend, not like a technical expert.` }]
        }
      }
    });

    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error caught, writing to test_err.json");
    const fs = await import('fs');
    fs.writeFileSync('test_err.json', JSON.stringify({
      status: err.status,
      message: err.message,
      errorDetails: err.errorDetails
    }, null, 2));
  }
}

runTest();
