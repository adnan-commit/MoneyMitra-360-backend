import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getAllUserTransactions,
  getStatementTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

// All transactions of logged in user
router.get("/", authMiddleware, getAllUserTransactions);

// Transactions by statement
router.get("/:statementId", authMiddleware, getStatementTransactions);

export default router;