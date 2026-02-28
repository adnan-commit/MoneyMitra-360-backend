export const generateMonthlyAnalytics = (transactions) => {
  const monthlyData = {};

  transactions.forEach((txn) => {
    const date = new Date(txn.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
        categories: {},
      };
    }

    if (txn.type === "CREDIT") {
      monthlyData[monthKey].income += txn.amount;
    }

    if (txn.type === "DEBIT") {
      const absAmount = Math.abs(txn.amount);
      monthlyData[monthKey].expense += absAmount;

      if (!monthlyData[monthKey].categories[txn.category]) {
        monthlyData[monthKey].categories[txn.category] = 0;
      }

      monthlyData[monthKey].categories[txn.category] += absAmount;
    }
  });

  // Convert to array for frontend charts
  const result = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
    savings: data.income - data.expense,
    categories: data.categories,
  }));

  return result.sort((a, b) => a.month.localeCompare(b.month));
};
