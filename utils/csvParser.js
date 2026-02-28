import { parse } from "csv-parse/sync";

export const parseCSVTransactions = (fileBuffer) => {
  const text = fileBuffer.toString("utf-8");

  const records = parse(text, {
    columns: true, // first row as header
    skip_empty_lines: true,
    trim: true,
  });

  const transactions = records.map((row) => ({
    date: row.Date,
    description: row.Description,
    type: row.Type,
    amount: parseFloat(row.Amount),
    balance: parseFloat(row.Balance),
  }));

  return transactions;
};