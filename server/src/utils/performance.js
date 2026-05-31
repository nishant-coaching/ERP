/** Analyze student performance vs previous test */
export function analyzePerformance(currentPct, previousPct) {
  const prev = previousPct ?? currentPct;
  const delta = Number((currentPct - prev).toFixed(2));
  let label = 'consistent';

  if (currentPct >= 90) label = 'topper';
  else if (delta >= 5) label = 'excellent_improvement';
  else if (delta <= -5) label = 'needs_attention';
  else if (Math.abs(delta) < 2) label = 'consistent';

  return { delta, label };
}

export const LABEL_DISPLAY = {
  topper: 'Topper',
  excellent_improvement: 'Excellent Improvement',
  consistent: 'Consistent Performer',
  needs_attention: 'Needs Attention',
};
