export function calculateNewRatings(ratingA, ratingB, solutionA, solutionB) {
  const K = 32; // Commonly used constant

  // Determine outcome
  let scoreA = 0.5; // Assume draw
  if (solutionA && !solutionB) {
    scoreA = 1; // A wins
  } else if (!solutionA && solutionB) {
    scoreA = 0; // B wins
  } else if (solutionA && solutionB) {
    // Optional: compare code quality, speed, or test results
    // For now, assume draw if both submitted
    scoreA = 0.5;
  } else {
    // Should never happen due to earlier validation
    scoreA = 0.5;
  }

  const scoreB = 1 - scoreA;

  // Expected scores
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  // New ratings
  const newRatingA = Math.round(ratingA + K * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + K * (scoreB - expectedB));

  return { newRatingA, newRatingB };
}
