export const predictSpendingTrend = (monthlyAnalytics) => {
  if (monthlyAnalytics.length < 2) {
    return { message: "Not enough data for prediction" };
  }

  const recentMonths = monthlyAnalytics.slice(-6);

  const expenses = recentMonths.map((m) => m.expense);

  const n = expenses.length;

  // Calculate simple linear regression slope
  let xSum = 0;
  let ySum = 0;
  let xySum = 0;
  let x2Sum = 0;

  for (let i = 0; i < n; i++) {
    xSum += i;
    ySum += expenses[i];
    xySum += i * expenses[i];
    x2Sum += i * i;
  }

  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

  const lastExpense = expenses[n - 1];

  const nextMonthPrediction = lastExpense + slope;

  const trendDirection =
    slope > 0 ? "Increasing" : slope < 0 ? "Decreasing" : "Stable";

  return {
    trendDirection,
    predictedNextMonthExpense: nextMonthPrediction.toFixed(2),
    monthlyChangeEstimate: slope.toFixed(2),
  };
};
