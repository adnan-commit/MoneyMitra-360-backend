export const detectAnomalies = (transactions) => {
  const debitTxns = transactions.filter(
    (t) => t.type === "DEBIT"
  );

  if (debitTxns.length === 0) return [];

  const overallAvg =
    debitTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0) /
    debitTxns.length;

  const categoryMap = {};

  debitTxns.forEach((txn) => {
    if (!categoryMap[txn.category])
      categoryMap[txn.category] = [];

    categoryMap[txn.category].push(Math.abs(txn.amount));
  });

  const categoryAvg = {};

  for (const [cat, amounts] of Object.entries(categoryMap)) {
    categoryAvg[cat] =
      amounts.reduce((a, b) => a + b, 0) / amounts.length;
  }

  const anomalies = debitTxns.filter((txn) => {
    const amount = Math.abs(txn.amount);
    const catAvg = categoryAvg[txn.category] || 0;

    return (
      amount > overallAvg * 1.5 ||
      amount > catAvg * 2
    );
  });

  return anomalies;
};