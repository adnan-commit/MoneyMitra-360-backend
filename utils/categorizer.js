import { CATEGORY_KEYWORDS } from "../config/categories.js";

export const categorizeTransactions = (transactions) => {
  return transactions.map((txn) => {
    const description = txn.description.toLowerCase();

    let category = "OTHERS";

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => description.includes(keyword))) {
        category = cat;
        break;
      }
    }

    return {
      ...txn,
      category,
    };
  });
};