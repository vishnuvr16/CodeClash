// This is a simplified implementation of the ELO rating system

// Calculate new ratings after a match
const calculateRatings = (ratingA, ratingB, resultA) => {
    const K = 32 // K-factor determines the maximum possible adjustment
  
    // Calculate expected scores
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400))
  
    // Calculate actual scores (1 for win, 0 for loss)
    const actualA = resultA ? 1 : 0
    const actualB = resultA ? 0 : 1
  
    // Calculate rating changes
    const ratingChangeA = Math.round(K * (actualA - expectedA))
    const ratingChangeB = Math.round(K * (actualB - expectedB))
  
    // Calculate new ratings
    const newRatingA = ratingA + ratingChangeA
    const newRatingB = ratingB + ratingChangeB
  
    return {
      newRatingA,
      newRatingB,
      ratingChangeA,
      ratingChangeB,
    }
  }
  
  module.exports = {
    calculateRatings,
  }
  