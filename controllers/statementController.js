import Statement from "../models/Statements.js";
import Transaction from "../models/Transaction.js";
import FinancialAnalysis from "../models/FinancialAnalysis.js";
import XLSX from "xlsx";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { parseWithGeminiAI } from "../services/aiParserService.js";

// Analytics Utils
import { categorizeTransactions } from "../utils/categorizer.js";
import { detectRecurringTransactions } from "../utils/recurringDetector.js";
import { calculateFinancialHealthScore } from "../utils/financialScore.js";
import { generateFinancialSummary } from "../services/geminiservices.js";
import { detectAnomalies } from "../utils/anomalyDetector.js";
import { generateMonthlyAnalytics } from "../utils/monthlyAnalytics.js";
import { generateBudgetRecommendations } from "../utils/budgetRecommendation.js";
import { calculateYearlyImpact } from "../utils/yearlyImpact.js";
import { predictSpendingTrend } from "../utils/trendPrediction.js";
import { calculateRiskScore } from "../utils/riskPredictor.js";
import { parseTransactions } from "../utils/transactionParser.js";

// ==========================================
// 1. HELPERS (Robust Date Parser)
// ==========================================
const parseDateRobust = (dateInput) => {
    if (!dateInput) return null;
    let dateStr = String(dateInput).trim().replace(/["\n\r]/g, ""); 

    // 1. Try ISO Date (YYYY-MM-DD)
    if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) return new Date(dateStr);

    // 2. Try Standard JS Date
    const simpleDate = new Date(dateStr);
    if (!isNaN(simpleDate.getTime()) && dateStr.length > 5 && (dateStr.includes("-") || dateStr.includes("/"))) {
        return simpleDate;
    }

    // 3. Try DD/MM/YYYY or DD-MM-YYYY
    const indianMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (indianMatch) {
        let y = indianMatch[3];
        if (y.length === 2) y = "20" + y;
        return new Date(`${y}-${indianMatch[2]}-${indianMatch[1]}`);
    }

    // 4. Try Excel Serial Number
    if (!isNaN(dateStr) && parseFloat(dateStr) > 30000 && parseFloat(dateStr) < 60000 && !dateStr.includes(".")) {
        return new Date((parseFloat(dateStr) - (25567 + 2)) * 86400 * 1000);
    }

    return null;
};

// ==========================================
// 2. BLOCK PARSER (Universal)
// ==========================================
const scanTextByDateBlocks = (fullText) => {
    const transactions = [];
    const cleanText = fullText.replace(/"/g, " ").replace(/\r/g, " ");

    const dateRegexGlobal = /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s?\d{4})/gi;
    
    let match;
    const dateMatches = [];
    while ((match = dateRegexGlobal.exec(cleanText)) !== null) {
        if (parseDateRobust(match[0])) {
            dateMatches.push({ dateStr: match[0], index: match.index, dateObj: parseDateRobust(match[0]) });
        }
    }

    if (dateMatches.length === 0) return [];

    for (let i = 0; i < dateMatches.length; i++) {
        const current = dateMatches[i];
        const next = dateMatches[i + 1];
        const blockText = cleanText.substring(current.index + current.dateStr.length, next ? next.index : cleanText.length);
        
        const amountRegex = /([-+]?[\d,]+\.\d{2}|[-+]?[\d,]{3,})/g;
        const numbers = blockText.match(amountRegex);
        
        let amount = null;
        let type = "DEBIT";

        if (numbers) {
            const candidates = numbers.map(n => parseFloat(n.replace(/,/g, '')))
                                      .filter(n => !isNaN(n) && Math.abs(n) !== current.dateObj.getFullYear());
            
            if (candidates.length > 0) {
                const signedNum = candidates.find(n => blockText.includes(n.toString()) && (blockText.includes(`-${Math.abs(n)}`) || blockText.includes(`+${Math.abs(n)}`)));
                amount = signedNum || candidates[0];
            }
        }

        if (amount !== null) {
            const lowerBlock = blockText.toLowerCase();
            if (lowerBlock.includes("credit") || lowerBlock.includes("cr ") || lowerBlock.includes("received") || amount > 0) {
                if (lowerBlock.includes("credit") || lowerBlock.includes("deposit")) {
                    type = "CREDIT";
                    amount = Math.abs(amount);
                } else if (amount < 0) {
                    type = "DEBIT";
                } else {
                    type = amount < 0 ? "DEBIT" : "CREDIT";
                }
            } else {
                type = "DEBIT";
                amount = -Math.abs(amount);
            }

            let desc = blockText
                .replace(amountRegex, "")
                .replace(/credit|debit|cr|dr|balance/gi, "")
                .replace(/opening balance/gi, "Opening Balance")
                .replace(/[^\w\s\-\.]/g, "")
                .replace(/\s+/g, " ")
                .trim();
            
            if (desc.length > 100) desc = desc.substring(0, 100);
            if (desc.length < 2) desc = "Transaction";

            transactions.push({
                date: current.dateObj,
                description: desc,
                amount: amount,
                type: type,
                category: "OTHERS"
            });
        }
    }
    return transactions;
};

// ==========================================
// 3. MAIN CONTROLLER
// ==========================================

const cleanAndValidateTransactions = (txns) => {
  return txns
    .map((t) => ({ ...t, date: new Date(t.date), amount: parseFloat(t.amount) }))
    .filter((t) => !isNaN(t.date.getTime()) && !isNaN(t.amount));
};

// --- THIS IS THE FIXED FUNCTION ---
const processAndSaveStatement = async ({ userId, fileName, fileType, transactions }) => {
  let cleanTransactions = cleanAndValidateTransactions(transactions);
  console.log(`Final Valid Transactions: ${cleanTransactions.length}`);

  if (cleanTransactions.length === 0) {
    throw new Error("Parser found data but validation failed. Formats invalid.");
  }

  cleanTransactions = categorizeTransactions(cleanTransactions);

  const statement = await Statement.create({
    user: userId,
    fileName,
    fileType,
    totalTransactions: cleanTransactions.length,
  });

  const transactionsToSave = cleanTransactions.map((txn) => ({ ...txn, user: userId, statement: statement._id }));
  await Transaction.insertMany(transactionsToSave);

  // Synchronous Analytics (Won't fail)
  const recurring = detectRecurringTransactions(cleanTransactions);
  const anomalies = detectAnomalies(cleanTransactions);
  const monthlyAnalytics = generateMonthlyAnalytics(cleanTransactions);
  const budgetRecommendations = generateBudgetRecommendations(monthlyAnalytics);
  const spendingTrend = predictSpendingTrend(monthlyAnalytics);
  const scoreData = calculateFinancialHealthScore(cleanTransactions, recurring);
  const riskAssessment = calculateRiskScore(scoreData, spendingTrend, monthlyAnalytics);
  const yearlyImpact = calculateYearlyImpact(monthlyAnalytics, budgetRecommendations);

  // --- AI SUMMARY: SAFEGUARDED ---
  // Agar Quota Exceed hota hai, to hum default message dikhayenge, crash nahi hone denge.
  let aiSummary = "AI insights are currently unavailable due to high server traffic. Please check back later.";
  
  try {
      console.log("Generating AI Summary...");
      aiSummary = await generateFinancialSummary(cleanTransactions, recurring, scoreData, anomalies, riskAssessment, budgetRecommendations);
  } catch (error) {
      console.warn("⚠️ Skipping AI Summary (Limit Exceeded):", error.message);
      // Process continues peacefully...
  }

  await FinancialAnalysis.create({
    user: userId,
    statement: statement._id,
    financialScore: scoreData.score,
    financialStatus: scoreData.status,
    savingsRate: scoreData.savingsRate,
    recurringRatio: scoreData.recurringRatio,
    riskScore: riskAssessment.riskScore,
    riskLevel: riskAssessment.riskLevel,
    monthlyAnalytics,
    spendingTrend,
    yearlyImpact,
    budgetRecommendations,
    aiSummary, // Will be either Real Summary or "Unavailable" message
  });

  return { statementId: statement._id, financialHealth: scoreData, riskAssessment, aiSummary };
};

export const uploadStatement = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    let transactions = [];
    let fullTextForParsing = "";

    if (req.file.mimetype === "application/pdf") {
        try {
            const text = await extractTextFromPDF(req.file.buffer);
            fullTextForParsing = text;
        } catch (e) { return res.status(400).json({ message: "PDF Error" }); }
    } 
    else if (req.file.mimetype === "text/csv") {
        fullTextForParsing = req.file.buffer.toString('utf8');
    }
    else {
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        fullTextForParsing = XLSX.utils.sheet_to_csv(sheet);
    }

    // 1. Run Block Scanner (Your verified logic)
    transactions = scanTextByDateBlocks(fullTextForParsing);
    console.log(`Scanner found: ${transactions.length} transactions`);

    // 2. AI Parsing Fallback (Only if block scanner fails completely)
    if (transactions.length === 0) {
        console.log("⚠️ Block Scanner failed. Falling back to AI...");
        if (fullTextForParsing.length > 20) {
            try {
                const safeText = fullTextForParsing.substring(0, 30000);
                transactions = await parseWithGeminiAI(safeText);
            } catch (err) {
                console.log("AI Parser also failed (skipping):", err.message);
            }
        }
    }

    if (!transactions || transactions.length === 0) {
        return res.status(400).json({ message: "Could not detect transactions. Please check file format." });
    }

    const result = await processAndSaveStatement({
      userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      transactions,
    });

    return res.status(201).json({ message: "Statement processed successfully", ...result });

  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const uploadTextStatement = async (req, res) => {
  try {
    const userId = req.userId;
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ message: "No text provided" });

    let transactions = scanTextByDateBlocks(rawText);

    if (transactions.length === 0) {
        try {
            transactions = await parseWithGeminiAI(rawText);
        } catch(err) { console.log("AI Text Parse Failed"); }
    }

    const result = await processAndSaveStatement({
      userId,
      fileName: "Text Input",
      fileType: "text",
      transactions,
    });

    return res.status(201).json({ message: "Processed successfully", ...result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const statement = await Statement.findOne({ _id: id, user: userId });
    
    if (!statement) return res.status(404).json({ message: "Statement not found" });

    await Transaction.deleteMany({ statement: id });
    await FinancialAnalysis.deleteMany({ statement: id });
    await Statement.deleteOne({ _id: id });

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};