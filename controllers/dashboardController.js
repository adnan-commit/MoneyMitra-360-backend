import FinancialAnalysis from "../models/FinancialAnalysis.js";
import Statement from "../models/Statements.js";
import Transaction from "../models/Transaction.js";

export const getStatementDashboard = async (req, res) => {
  try {
    const { statementId } = req.params;
    const userId = req.userId;

    const statement = await Statement.findOne({
      _id: statementId,
      user: userId,
    });

    if (!statement) {
      return res.status(404).json({
        message: "Statement not found",
      });
    }

    const analysis = await FinancialAnalysis.findOne({
      statement: statementId,
      user: userId,
    });

    if (!analysis) {
      return res.status(404).json({
        message: "Analysis not found",
      });
    }

    res.json({
      statement,
      analysis,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
};

export const getUserStatements = async (req, res) => {
  try {
    const userId = req.userId;

    const statements = await Statement.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.json(statements);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch statements",
      error: error.message,
    });
  }
};

export const getOverallDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    const transactions = await Transaction.find({ user: userId });

    if (!transactions.length) {
      return res.status(404).json({
        message: "No transactions found",
      });
    }

    const totalIncome = transactions
      .filter((t) => t.type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netSavings = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      netSavings,
      totalTransactions: transactions.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load overall dashboard",
      error: error.message,
    });
  }
};

export const getMonthlyTrendAll = async (req, res) => {
  try {
    const userId = req.userId;

    const transactions = await Transaction.find({ user: userId });

    if (!transactions.length) {
      return res.status(404).json({
        message: "No transactions found",
      });
    }

    const monthlyMap = {};

    transactions.forEach((txn) => {
      const date = new Date(txn.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          income: 0,
          expense: 0,
        };
      }

      if (txn.type === "CREDIT") {
        monthlyMap[monthKey].income += txn.amount;
      } else {
        monthlyMap[monthKey].expense += Math.abs(txn.amount);
      }
    });

    res.json(monthlyMap);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch monthly trend",
      error: error.message,
    });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.userId;

    const transactions = await Transaction.find({
      user: userId,
      type: "DEBIT",
    });

    const categoryMap = {};

    transactions.forEach((txn) => {
      if (!categoryMap[txn.category]) {
        categoryMap[txn.category] = 0;
      }

      categoryMap[txn.category] += Math.abs(txn.amount);
    });

    res.json(categoryMap);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch category breakdown",
      error: error.message,
    });
  }
};

export const getTopSpendingCategories = async (req, res) => {
  try {
    const userId = req.userId;

    const transactions = await Transaction.find({
      user: userId,
      type: "DEBIT",
    });

    const categoryMap = {};

    transactions.forEach((txn) => {
      if (!categoryMap[txn.category]) {
        categoryMap[txn.category] = 0;
      }

      categoryMap[txn.category] += Math.abs(txn.amount);
    });

    const sorted = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch top categories",
      error: error.message,
    });
  }
};
