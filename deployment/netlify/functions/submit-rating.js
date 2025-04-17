// Netlify serverless function to handle rating submissions
const fs = require('fs');
const path = require('path');

// Path to store ratings data
const RATINGS_FILE = path.join(__dirname, 'data', 'ratings.json');

// Ensure the data directory exists
function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load existing ratings
function loadRatings() {
  ensureDataDir();
  
  if (!fs.existsSync(RATINGS_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(RATINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading ratings:', error);
    return [];
  }
}

// Save ratings to file
function saveRatings(ratings) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving ratings:', error);
    return false;
  }
}

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.audioId || !data.predictedGenre || data.isCorrect === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    // If the prediction was incorrect, the actual genre is required
    if (data.isCorrect === false && !data.actualGenre) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Actual genre is required when prediction is incorrect' })
      };
    }
    
    // Add timestamp to the rating
    const rating = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    // Load existing ratings
    const ratings = loadRatings();
    
    // Add the new rating
    ratings.push(rating);
    
    // Save the updated ratings
    if (!saveRatings(ratings)) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save rating' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Rating submitted successfully',
        totalRatings: ratings.length
      })
    };
  } catch (error) {
    console.error('Error processing rating submission:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error processing rating submission' })
    };
  }
};
