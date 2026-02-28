import { GoogleGenAI } from "@google/genai";

export const generateFinancialSummary = async (
  transactions,
  recurring,
  financialHealth
) => {

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const totalIncome = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const prompt = `
You are a fintech financial advisor AI.

Analyze this financial data and generate:
1. A short financial summary (4-5 lines)
2. 3 improvement suggestions
3. Risk warnings if any

Data:
Total Income: ${totalIncome}
Total Expense: ${totalExpense}
Financial Score: ${financialHealth.score} (${financialHealth.status})
Savings Rate: ${financialHealth.savingsRate}
Recurring Payments: ${recurring.length}
`;

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
};