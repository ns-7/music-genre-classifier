import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import type { RatingSubmission } from '@/lib/api';

interface RatingSystemProps {
  audioId: string;
  predictedGenre: string;
  onSubmit: (rating: RatingSubmission) => Promise<void>;
  onClose: () => void;
}

const genres = [
  'blues', 'classical', 'country', 'disco', 'hiphop',
  'jazz', 'metal', 'pop', 'reggae', 'rock'
];

export default function RatingSystem({ audioId, predictedGenre, onSubmit, onClose }: RatingSystemProps) {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [actualGenre, setActualGenre] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (isCorrect === null) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        audioId,
        predictedGenre,
        isCorrect,
        actualGenre: isCorrect ? undefined : actualGenre,
        comment: comment.trim() || undefined
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/30 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-blue-400">Thank You!</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-300 mb-4">
          Your feedback has been recorded and will help improve our model. Thank you for contributing!
        </p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/30 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-blue-400">Rate Our Prediction</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      
      <p className="text-gray-300 mb-4">
        Was our prediction of <span className="font-semibold capitalize">{predictedGenre}</span> correct?
      </p>
      
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setIsCorrect(true)}
          className={`flex items-center gap-2 py-2 px-4 rounded-md transition-colors ${
            isCorrect === true
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <ThumbsUp size={18} />
          Yes, it's correct
        </button>
        
        <button
          onClick={() => setIsCorrect(false)}
          className={`flex items-center gap-2 py-2 px-4 rounded-md transition-colors ${
            isCorrect === false
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <ThumbsDown size={18} />
          No, it's incorrect
        </button>
      </div>
      
      {isCorrect === false && (
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">
            What's the correct genre?
          </label>
          <select
            value={actualGenre}
            onChange={(e) => setActualGenre(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select the correct genre</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="mb-6">
        <label className="block text-gray-300 mb-2">
          Additional comments (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Share any additional feedback about the prediction..."
        />
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isCorrect === null || (isCorrect === false && !actualGenre) || isSubmitting}
          className={`flex items-center gap-2 py-2 px-6 rounded-md transition-colors ${
            isCorrect !== null && (isCorrect === true || actualGenre) && !isSubmitting
              ? 'bg-blue-500 hover:bg-blue-400 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
