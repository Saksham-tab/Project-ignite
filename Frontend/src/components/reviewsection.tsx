import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { getReviewsByProduct, submitReview, ReviewInput, Review } from '../services/reviewservice';
import { Star } from 'lucide-react';

interface Props {
  productId: string;
}

const ReviewSection = ({ productId }: Props) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [formData, setFormData] = useState<ReviewInput>({
    productId: '',
    rating: 0,
    comment: '',
    file: null,
    username: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Sync productId into formData when available
  useEffect(() => {
    console.log('[ReviewSection] Rendered with productId:', productId);
    if (productId) {
      setFormData((prev) => ({ ...prev, productId }));
    }
  }, [productId]);

  // ✅ Load existing reviews
  useEffect(() => {
    if (!productId) return;
    getReviewsByProduct(productId)
      .then((res) => setReviews(res.data))
      .catch((err) => setError(err.message));
  }, [productId]);

  const handleStarClick = (value: number) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('[ReviewSection] Submitting review for productId:', productId);
    // Always use the prop value for productId
    const reviewData = { ...formData, productId };
    if (!reviewData.productId || reviewData.productId === 'undefined' || reviewData.productId.length < 10) {
      setError('Product ID is missing or invalid. Please refresh the page or contact support.');
      return;
    }

    if (!reviewData.username?.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!reviewData.comment?.trim()) {
      setError('Please enter your review.');
      return;
    }

    if (reviewData.rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    try {
      await submitReview(reviewData); // Always use reviewData
      setSuccess('✅ Review submitted!');
      setError('');

      // Reset form
      setFormData({
        productId,
        rating: 0,
        comment: '',
        file: null,
        username: '',
      });

      // Reload reviews
      const res = await getReviewsByProduct(productId);
      setReviews(res.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setSuccess('');
    }
  };

  return (
    <div className="w-full md:w-1/2 bg-black/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700">
      {!productId || productId === 'undefined' || productId.length < 10 ? (
        <div className="bg-red-800 text-white p-3 mb-4 rounded">Product ID is missing or invalid. Reviews cannot be submitted for this product.</div>
      ) : null}

      <h2 className="text-2xl font-bold mb-4 text-white">Leave a Review</h2>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="p-2 bg-gray-900 border border-gray-700 rounded w-full text-white"
          placeholder="Your name"
          required
        />

        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((val) => (
            <Star
              key={val}
              size={24}
              className={`cursor-pointer transition ${
                val <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'
              }`}
              onClick={() => handleStarClick(val)}
            />
          ))}
        </div>

        <textarea
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          className="p-2 bg-gray-900 border border-gray-700 rounded w-full text-white"
          placeholder="Write your review..."
          required
        />

        <input
          type="file"
          onChange={handleFileChange}
          className="text-sm text-gray-300"
          accept="image/*,video/*"
        />

        <button
          type="submit"
          className="bg-ritual-red px-4 py-2 rounded text-white hover:bg-blood-red transition"
        >
          Submit Review
        </button>
      </form>

      <h3 className="text-xl mt-8 mb-2 text-white">Reviews</h3>
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-400">No reviews yet.</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev._id} className="bg-gray-900/70 p-4 rounded border border-gray-700">
              <div className="flex space-x-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i <= rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-ritual-red font-semibold">{rev.username}</p>
              <p className="text-gray-200">{rev.comment}</p>

              {rev.image && rev.image.endsWith('.mp4') ? (
                <video controls className="mt-2 w-64 rounded">
                  <source
                    src={`${import.meta.env.VITE_API_URL}/uploads/reviews/${rev.image}`}
                    type="video/mp4"
                  />
                </video>
              ) : rev.image ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}/uploads/reviews/${rev.image}`}
                  alt="Review"
                  className="mt-2 w-32 rounded"
                />
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
