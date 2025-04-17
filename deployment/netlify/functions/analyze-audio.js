// Netlify serverless function to handle audio analysis
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const formidable = require('formidable');
const { createReadStream, unlink } = require('fs');

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the multipart form data
    const { fields, files } = await parseFormData(event);
    
    if (!files.file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file uploaded' })
      };
    }

    const file = files.file;
    
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (!validTypes.includes(file.mimetype)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid file type. Please upload an audio file (MP3, WAV, OGG, M4A)' })
      };
    }

    // Call the Python script to analyze the audio
    const result = await analyzeAudio(file.filepath);
    
    // Clean up the temporary file
    await fs.promises.unlink(file.filepath);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error processing audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error processing audio file' })
    };
  }
};

// Parse multipart form data
function parseFormData(event) {
  return new Promise((resolve, reject) => {
    const form = formidable({ 
      maxFileSize: MAX_FILE_SIZE,
      uploadDir: os.tmpdir(),
      keepExtensions: true
    });
    
    // Create a request-like object that formidable can process
    const req = {
      headers: event.headers,
      body: Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
    };
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

// Call Python script to analyze audio
async function analyzeAudio(filepath) {
  return new Promise((resolve, reject) => {
    // Path to the Python script (relative to the function)
    const scriptPath = path.join(__dirname, 'python', 'analyze_audio.py');
    
    // Spawn Python process
    const python = spawn('python3', [scriptPath, filepath]);
    
    let dataString = '';
    let errorString = '';
    
    // Collect data from script
    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    // Collect error messages
    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    // Handle process completion
    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error(`Error: ${errorString}`);
        reject(new Error(`Python script failed with code ${code}: ${errorString}`));
        return;
      }
      
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        console.error('Failed to parse Python output:', error);
        reject(new Error('Failed to parse analysis results'));
      }
    });
  });
}
