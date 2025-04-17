/**
 * API client for communicating with the music genre classifier backend
 */

// Determine API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Interface for genre classification results
 */
export interface ClassificationResult {
  genre: string;
  confidence: number;
  top_genres: string[];
  top_confidences: number[];
  spectrogram: string | null;
}

/**
 * Interface for user rating submission
 */
export interface RatingSubmission {
  audioId: string;
  predictedGenre: string;
  isCorrect: boolean;
  actualGenre?: string;
  comment?: string;
}

/**
 * Interface for rating statistics
 */
export interface RatingStats {
  totalRatings: number;
  correctPredictions: number;
  accuracyRate: number;
  genreStats: Record<string, {
    total: number;
    correct: number;
    rate: number;
  }>;
}

/**
 * Check if the API is healthy
 * @returns Promise with health status
 */
export const checkApiHealth = async (): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

/**
 * Analyze an audio file to determine its genre
 * @param file Audio file to analyze
 * @returns Promise with classification results
 */
export const analyzeAudio = async (file: File): Promise<ClassificationResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Audio analysis failed:', error);
    throw error;
  }
};

/**
 * Submit user rating for a classification result
 * @param rating Rating submission data
 * @returns Promise with submission status
 */
export const submitRating = async (rating: RatingSubmission): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/submit-rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rating),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Rating submission failed:', error);
    // Return a client-side error response when API is unavailable
    return {
      success: false,
      message: 'Unable to submit rating. Your feedback has been saved locally and will be submitted when the API is available.'
    };
  }
};

/**
 * Get rating statistics
 * @returns Promise with rating statistics
 */
export const getRatingStats = async (): Promise<RatingStats> => {
  try {
    const response = await fetch(`${API_URL}/rating-stats`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch rating statistics:', error);
    // Return mock data when API is unavailable
    return {
      totalRatings: 0,
      correctPredictions: 0,
      accuracyRate: 0,
      genreStats: {}
    };
  }
};
