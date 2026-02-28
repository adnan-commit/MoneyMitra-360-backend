import mongoose from "mongoose";

const statementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: String,
    fileType: String, // pdf, csv, text
    totalTransactions: Number,
  },
  { timestamps: true },
);

export default mongoose.model("Statement", statementSchema);
