export const parseTransactions = (text) => {
  const transactions = [];

  const dateRegex =
    /\b(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{2,4}|\d{2}\s[A-Za-z]{3}\s\d{4})\b/g;

  const matches = [...text.matchAll(dateRegex)];

  if (matches.length === 0) return [];

  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].index;
    const endIndex =
      i + 1 < matches.length ? matches[i + 1].index : text.length;

    const chunk = text.slice(startIndex, endIndex).trim();

    const date = matches[i][0];

    // Extract all numbers from chunk
    const numberMatches = chunk.match(/-?\d+\.\d{2}/g) || [];

    let amount = null;
    let balance = null;

    if (numberMatches.length >= 2) {
      amount = parseFloat(numberMatches[numberMatches.length - 2]);
      balance = parseFloat(numberMatches[numberMatches.length - 1]);
    } else if (numberMatches.length === 1) {
      amount = parseFloat(numberMatches[0]);
    }

    // Detect transaction type
    let type = "UNKNOWN";
    if (/debit|dr|withdraw/i.test(chunk)) type = "DEBIT";
    if (/credit|cr|deposit/i.test(chunk)) type = "CREDIT";
    if (amount && amount < 0) type = "DEBIT";

    // Remove date and numbers from description
    let description = chunk
      .replace(date, "")
      .replace(/-?\d+\.\d{2}/g, "")
      .replace(/debit|credit|dr|cr/gi, "")
      .trim();

    transactions.push({
      date,
      description,
      type,
      amount,
      balance,
    });
  }

  return transactions;
};