import React, { useState, useEffect } from 'react';
import { Review } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star, ThumbsUp, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { summarizeReviews } from '@/lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewListProps {
  reviews: Review[];
  onLike: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews, onLike, onReport }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (reviews.length === 0) return;
    setIsSummarizing(true);
    const textReviews = reviews.map(r => r.text).filter(Boolean);
    const result = await summarizeReviews(textReviews);
    setSummary(result);
    setIsSummarizing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Customer Reviews ({reviews.length})
        </h3>
        {reviews.length > 0 && !summary && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-2 rounded-full"
          >
            <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-spin' : ''}`} />
            {isSummarizing ? 'Summarizing...' : 'AI Summary'}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {summary && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              AI Generated Summary
            </h4>
            <p className="text-sm text-indigo-900 leading-relaxed italic">
              "{summary}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400">No reviews yet. Be the first to leave one!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.customerPhoto} />
                    <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{review.customerName}</h5>
                    <p className="text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(review.createdAt))} ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs font-bold">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{review.rating}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {review.text}
              </p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {review.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      className="w-20 h-20 object-cover rounded-lg border border-slate-100" 
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onLike(review.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful ({review.helpfulCount})
                  </button>
                  <button 
                    onClick={() => onReport(review.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Report
                  </button>
                </div>
                {review.sentiment && (
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] uppercase border-none ${
                      review.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : 
                      review.sentiment === 'negative' ? 'bg-rose-50 text-rose-600' : 
                      'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {review.sentiment}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
