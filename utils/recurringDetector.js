export const detectRecurringTransactions = (transactions) => {
  const recurring = [];

  // Group by description
  const grouped = {};

  transactions.forEach((txn) => {
    const key = txn.description
      .toLowerCase()
      .replace(/[0-9]/g, "") // remove numeric suffix
      .replace(/\s+/g, " ") // normalize spacing
      .trim();

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(txn);
  });

  for (const [description, txns] of Object.entries(grouped)) {
    if (txns.length < 2) continue;

    // Sort by date
    txns.sort((a, b) => new Date(a.date) - new Date(b.date));

    let monthlyCount = 0;

    for (let i = 1; i < txns.length; i++) {
      const prevDate = new Date(txns[i - 1].date);
      const currDate = new Date(txns[i].date);

      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      const amountDiff = Math.abs(txns[i].amount - txns[i - 1].amount);

      if (diffDays >= 25 && diffDays <= 35 && amountDiff < 5) {
        monthlyCount++;
      }
    }

    if (monthlyCount >= 1) {
      recurring.push({
        description,
        occurrences: txns.length,
        averageAmount: txns.reduce((sum, t) => sum + t.amount, 0) / txns.length,
        type: txns[0].type,
      });
    }
  }

  return recurring;
};
