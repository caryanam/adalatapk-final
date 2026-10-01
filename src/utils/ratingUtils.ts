// Rating Utility for Client Ratings & Reviews (Fallback stub for React Native)

export const getLawyerRatingData = (lawyerId: any) => {
  return {
    average: 0,
    count: 0,
    reviews: []
  };
};

export const saveLawyerRating = async (lawyerId: any, rating: number, comment = '', customerName = 'Customer', consultationRequestId = null) => {
  // Sync logic handled by API
  return { average: rating, count: 1, reviews: [] };
};
