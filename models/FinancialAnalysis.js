import mongoose from "mongoose";

const financialAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    statement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Statement",
    },

    financialScore: Number,
    financialStatus: String,
    savingsRate: Number,
    recurringRatio: Number,

    riskScore: Number,
    riskLevel: String,

    monthlyAnalytics: Array,
    spendingTrend: Object,
    yearlyImpact: Object,

    aiSummary: String,
  },
  { timestamps: true },
);

export default mongoose.model("FinancialAnalysis", financialAnalysisSchema);
