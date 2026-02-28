export const calculateFinancialHealthScore = (
  transactions,
  recurring
) => {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalBalance = 0;

  transactions.forEach((txn) => {
    if (txn.type === "CREDIT") totalIncome += txn.amount;
    if (txn.type === "DEBIT") totalExpense += Math.abs(txn.amount);

    totalBalance += txn.balance || 0;
  });

  const avgBalance =
    totalBalance / (transactions.length || 1);

  const savings =
    totalIncome > 0
      ? (totalIncome - totalExpense) / totalIncome
      : 0;

  let score = 0;

  // Savings Rate Score (40)
  if (savings > 0.4) score += 40;
  else if (savings > 0.2) score += 30;
  else if (savings > 0.1) score += 20;
  else score += 10;

  // Recurring Burden Score (20)
  const recurringTotal = recurring.reduce(
    (sum, r) => sum + Math.abs(r.averageAmount),
    0
  );

  const recurringRatio =
    totalExpense > 0
      ? recurringTotal / totalExpense
      : 0;

  if (recurringRatio < 0.2) score += 20;
  else if (recurringRatio < 0.4) score += 15;
  else score += 5;

  // Expense Control (20)
  const discretionaryCategories = [
    "FOOD",
    "ENTERTAINMENT",
    "SHOPPING",
  ];

  const discretionarySpend = transactions
    .filter((t) =>
      discretionaryCategories.includes(t.category)
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const discretionaryRatio =
    totalExpense > 0
      ? discretionarySpend / totalExpense
      : 0;

  if (discretionaryRatio < 0.4) score += 20;
  else score += 10;

  // Emergency Buffer (20)
  const monthlyExpense = totalExpense / 6; // approx
  if (avgBalance > 2 * monthlyExpense) score += 20;
  else score += 10;

  let status = "Poor";
  if (score > 80) status = "Excellent";
  else if (score > 60) status = "Good";
  else if (score > 40) status = "Average";

  return {
    score,
    status,
    savingsRate: Number((savings * 100).toFixed(2)),
    recurringRatio: Number((recurringRatio*100).toFixed(2)),
    discretionaryRatio: Number((discretionaryRatio * 100).toFixed(2)),
  };
};