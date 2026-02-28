export const generateBudgetRecommendations = (monthlyAnalytics) => {
  const recommendations = [];

  if (!monthlyAnalytics.length) return [];

  // Take last 3 months average
  const recentMonths = monthlyAnalytics.slice(-3);

  const categoryTotals = {};
  const monthCount = recentMonths.length;

  recentMonths.forEach((month) => {
    for (const [cat, amount] of Object.entries(month.categories)) {
      if (!categoryTotals[cat]) categoryTotals[cat] = 0;
      categoryTotals[cat] += amount;
    }
  });

  for (const [category, total] of Object.entries(categoryTotals)) {
    const avg = total / monthCount;

    let adjustment = 1;

    if (["FOOD", "TRAVEL"].includes(category)) adjustment = 0.9;

    if (["SHOPPING", "ENTERTAINMENT"].includes(category)) adjustment = 0.75;

    const recommended = avg * adjustment;

    recommendations.push({
      category,
      currentAverage: avg.toFixed(2),
      recommendedBudget: recommended.toFixed(2),
      suggestedSavings: (avg - recommended).toFixed(2),
    });
  }

  return recommendations;
};
