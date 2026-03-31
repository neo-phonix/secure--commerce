'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, User, ShieldCheck, ThumbsUp, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_verified: boolean;
}

export default function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      });

      if (res.ok) {
        toast.success('Review submitted successfully!');
        setNewReview({ rating: 5, comment: '' });
        fetchReviews(); // Refresh reviews
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to submit review');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 border-t border-black/5 dark:border-white/5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold dark:text-white">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < 4.5 ? 'fill-current' : ''}`} />
            ))}
          </div>
          <span className="text-sm font-bold dark:text-white">4.5 / 5.0</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/5 sticky top-24">
            <h3 className="font-bold mb-4 dark:text-white">Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`p-2 rounded-lg transition-all ${
                        newReview.rating >= star ? 'text-yellow-400' : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${newReview.rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-2 block">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all min-h-[120px] dark:text-white"
                  placeholder="Share your experience..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={20} />
                    Posting...
                  </>
                ) : (
                  'Post Review'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Review List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={40} />
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-black/30 dark:text-white/30" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm dark:text-white">{review.user_name}</h4>
                          {review.is_verified && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[8px] font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Verified
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-black/30 dark:text-white/30">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed mb-6">{review.comment}</p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      Helpful
                    </button>
                    <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
                      <MessageSquare className="w-3 h-3" />
                      Reply
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
