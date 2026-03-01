import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

/* =====================================================
   GET ALL USER TRANSACTIONS
===================================================== */
export const getAllUserTransactions = async (req, res) => {
  try {
    const userId = req.userId;

    const transactions = await Transaction.find({ user: userId })
      .sort({ date: -1 });

    return res.status(200).json({
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Fetch Transactions Error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};

/* =====================================================
   GET TRANSACTIONS BY STATEMENT
===================================================== */
export const getStatementTransactions = async (req, res) => {
  try {
    const { statementId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(statementId)) {
      return res.status(400).json({
        message: "Invalid Statement ID",
      });
    }

    const transactions = await Transaction.find({
      user: userId,
      statement: statementId,
    }).sort({ date: -1 });

    return res.status(200).json({
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Statement Transactions Error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch statement transactions",
    });
  }
};