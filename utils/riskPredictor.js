export const calculateRiskScore = (
  financialHealth,
  spendingTrend,
  monthlyAnalytics,
) => {
  let riskScore = 0;

  const savingsRate = parseFloat(financialHealth.savingsRate);

  const recurringRatio = parseFloat(financialHealth.recurringRatio);

  // Savings Risk
  if (savingsRate < 10) riskScore += 30;
  else if (savingsRate < 20) riskScore += 20;
  else riskScore += 5;

  // Recurring Risk
  if (recurringRatio > 40) riskScore += 20;
  else if (recurringRatio > 20) riskScore += 10;
  else riskScore += 5;

  // Spending Trend Risk
  if (spendingTrend.trendDirection === "Increasing") riskScore += 20;
  else riskScore += 5;

  // Emergency Buffer Risk
  const recentMonths = monthlyAnalytics.slice(-3);

  const avgExpense =
    recentMonths.reduce((sum, m) => sum + m.expense, 0) / recentMonths.length;

  const avgSavings =
    recentMonths.reduce((sum, m) => sum + m.savings, 0) / recentMonths.length;

  if (avgSavings < avgExpense * 0.5) riskScore += 20;
  else riskScore += 5;

  // Income Stability
  const incomes = monthlyAnalytics.map((m) => m.income);

  const maxIncome = Math.max(...incomes);
  const minIncome = Math.min(...incomes);

  if (maxIncome - minIncome > maxIncome * 0.4) riskScore += 10;
  else riskScore += 5;

  let riskLevel = "Low";

  if (riskScore > 70) riskLevel = "High";
  else if (riskScore > 40) riskLevel = "Moderate";

  return {
    riskScore,
    riskLevel,
  };
};
