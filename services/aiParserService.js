import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

// Helper: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const parseWithGeminiAI = async (rawText) => {
  if (!process.env.GEMINI_API_KEY) {
      console.error(" GEMINI_API_KEY missing");
      return [];
  }

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    Extract transaction details from this text into a JSON Array.
    Ignore headers. Return ONLY JSON.
    Format: [{"date": "YYYY-MM-DD", "description": "str", "amount": num, "type": "CREDIT"/"DEBIT", "category": "OTHERS"}]
    
    Text:
    ${rawText.substring(0, 50000)}
  `;

  // RETRY LOGIC (Max 2 retries)
  for (let attempt = 1; attempt <= 2; attempt++) {
      try {
          const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", // Use 1.5 for better limits
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });

          let jsonString = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(jsonString);

      } catch (error) {
          console.warn(` AI Parsing Attempt ${attempt} failed: ${error.message}`);
          
          if (error.message.includes("429") || error.message.includes("quota")) {
              console.log(" Quota exceeded. Waiting 5 seconds...");
              await sleep(5000); // Wait 5s
          } else {
              break; // Don't retry for other errors
          }
      }
  }
  
  return []; // Return empty if all retries fail
};