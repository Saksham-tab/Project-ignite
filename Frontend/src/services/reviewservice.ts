export interface ReviewInput {
  productId: string;
  rating: number;
  comment: string;
  file?: File | null; // image or video
  username: string;  // optional: can default to 'Anonymous' if not provided
}

export interface Review {
  _id: string;
  productId: string;
  rating: number;
  comment: string;
  image?: string; // ✅ backend stores file as 'image'
  createdAt: string;
  updatedAt?: string;
  username: string;
}

/**
 * Submit a review with optional image/video
 */
export const submitReview = async (
  review: ReviewInput
): Promise<{ success: boolean; data: Review }> => {
  const formData = new FormData();
  formData.append('rating', String(review.rating));
  formData.append('comment', review.comment);
  formData.append('username', review.username || 'Anonymous');

  if (review.file) {
    formData.append('image', review.file); // ✅ MATCHES BACKEND FIELD
  }

  const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${review.productId}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Something went wrong' }));
    throw new Error(error.message || 'Failed to submit review');
  }

  return res.json();
};

/**
 * Get all reviews for a specific product
 */
export const getReviewsByProduct = async (
  productId: string
): Promise<{ success: boolean; data: Review[] }> => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${productId}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Something went wrong' }));
    throw new Error(error.message || 'Failed to fetch reviews');
  }

  return res.json();
};
