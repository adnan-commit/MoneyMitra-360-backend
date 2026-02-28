export const calculateYearlyImpact = (
  monthlyAnalytics,
  budgetRecommendations,
) => {
  if (!monthlyAnalytics.length) return {};

  const recentMonths = monthlyAnalytics.slice(-6);

  const monthCount = recentMonths.length;

  let totalIncome = 0;
  let totalExpense = 0;

  recentMonths.forEach((m) => {
    totalIncome += m.income;
    totalExpense += m.expense;
  });

  const avgIncome = totalIncome / monthCount;
  const avgExpense = totalExpense / monthCount;

  const projectedIncome = avgIncome * 12;
  const projectedExpense = avgExpense * 12;

  const projectedSavings = projectedIncome - projectedExpense;

  // Potential optimized savings
  const potentialMonthlySavings = budgetRecommendations.reduce(
    (sum, r) => sum + parseFloat(r.suggestedSavings),
    0,
  );

  const optimizedYearlySavings =
    projectedSavings + potentialMonthlySavings * 12;

  return {
    projectedIncome: projectedIncome.toFixed(2),
    projectedExpense: projectedExpense.toFixed(2),
    projectedSavings: projectedSavings.toFixed(2),
    optimizedYearlySavings: optimizedYearlySavings.toFixed(2),
  };
};
