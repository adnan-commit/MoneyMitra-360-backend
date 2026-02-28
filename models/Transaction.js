import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    statement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Statement",
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      required: true,
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Transaction", transactionSchema);
