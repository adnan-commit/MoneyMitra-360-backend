import Statement from "../models/Statements.js";
import Transaction from "../models/Transaction.js";
import FinancialAnalysis from "../models/FinancialAnalysis.js";

import { extractTextFromPDF } from "../utils/pdfParser.js";
import { parseTransactions } from "../utils/transactionParser.js";
import { parseCSVTransactions } from "../utils/csvParser.js";
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


const processAndSaveStatement = async ({
  userId,
  fileName,
  fileType,
  transactions,
}) => {
  if (!transactions || transactions.length === 0) {
    throw new Error("No valid transactions found.");
  }

  // Categorize
  transactions = categorizeTransactions(transactions);

  // Save Statement
  const statement = await Statement.create({
    user: userId,
    fileName,
    fileType,
    totalTransactions: transactions.length,
  });

  // Save Transactions (Bulk Insert)
  await Transaction.insertMany(
    transactions.map((txn) => ({
      ...txn,
      user: userId,
      statement: statement._id,
      type: txn.type.toUpperCase(),
    })),
  );

  // ---- Analytics & Intelligence Layer ----

  const recurring = detectRecurringTransactions(transactions);
  const scoreData = calculateFinancialHealthScore(transactions, recurring);
  const anomalies = detectAnomalies(transactions);
  const monthlyAnalytics = generateMonthlyAnalytics(transactions);
  const budgetRecommendations = generateBudgetRecommendations(monthlyAnalytics);
  const yearlyImpact = calculateYearlyImpact(
    monthlyAnalytics,
    budgetRecommendations,
  );
  const spendingTrend = predictSpendingTrend(monthlyAnalytics);
  const riskAssessment = calculateRiskScore(
    scoreData,
    spendingTrend,
    monthlyAnalytics,
  );

  const aiSummary = await generateFinancialSummary(
    transactions,
    recurring,
    scoreData,
    anomalies,
    riskAssessment,
    budgetRecommendations,
  );

  // Save Financial Analysis
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
    aiSummary,
  });

  return {
    statementId: statement._id,
    financialHealth: scoreData,
    riskAssessment,
    aiSummary,
  };
};

/* =====================================================
   FILE UPLOAD (PDF / CSV)
===================================================== */

export const uploadStatement = async (req, res) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    let transactions = [];

    if (req.file.mimetype === "application/pdf") {
      const extractedText = await extractTextFromPDF(req.file.buffer);
      transactions = parseTransactions(extractedText);
    } else if (req.file.mimetype === "text/csv") {
      transactions = parseCSVTransactions(req.file.buffer);
    } else {
      return res.status(400).json({
        message: "Unsupported file type. Only PDF and CSV allowed.",
      });
    }

    const result = await processAndSaveStatement({
      userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      transactions,
    });

    return res.status(200).json({
      message: "Statement processed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Upload Error:", error.message);

    return res.status(500).json({
      message: "Failed to process statement",
      error: error.message,
    });
  }
};

/* =====================================================
   TEXT INPUT UPLOAD
===================================================== */

export const uploadTextStatement = async (req, res) => {
  try {
    const userId = req.userId;
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({
        message: "No text provided",
      });
    }

    const cleanedText = rawText.replace(/\s+/g, " ").trim();
    const transactions = parseTransactions(cleanedText);

    const result = await processAndSaveStatement({
      userId,
      fileName: "Text Input",
      fileType: "text",
      transactions,
    });

    return res.status(200).json({
      message: "Text statement processed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Text Upload Error:", error.message);

    return res.status(500).json({
      message: "Failed to process text statement",
      error: error.message,
    });
  }
};
