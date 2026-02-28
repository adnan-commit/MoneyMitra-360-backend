import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getStatementDashboard,
  getUserStatements,
  getOverallDashboard,
  getMonthlyTrendAll,
  getCategoryBreakdown,
  getTopSpendingCategories,
} from "../controllers/dashboardController.js";
import { downloadReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/statement/:statementId", authMiddleware, getStatementDashboard);
router.get("/statements", authMiddleware, getUserStatements);
router.get("/overall", authMiddleware, getOverallDashboard);
router.get("/monthly-trend", authMiddleware, getMonthlyTrendAll);
router.get("/category-breakdown", authMiddleware, getCategoryBreakdown);
router.get("/top-categories", authMiddleware, getTopSpendingCategories);
router.get("/report/:statementId", authMiddleware, downloadReport);

export default router;
