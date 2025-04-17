#!/usr/bin/env python3
import sys
import os
import json
import numpy as np
import librosa
import base64
from io import BytesIO
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

# Set paths relative to the function directory
FUNCTION_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(FUNCTION_DIR, 'model')

# Load the simplified classifier model
# In a production environment, you would load a pre-trained model here
# For this example, we'll use a simple feature-based approach

# Define genre mapping
GENRES = ['blues', 'classical', 'country', 'disco', 'hiphop', 
          'jazz', 'metal', 'pop', 'reggae', 'rock']

def extract_features(audio_path, sr=22050, duration=30):
    """Extract audio features from the given file path"""
    try:
        # Load audio file (limit to first 30 seconds if longer)
        y, sr = librosa.load(audio_path, sr=sr, duration=duration)
        
        # Extract features
        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        spectral_contrast = np.mean(librosa.feature.spectral_contrast(y=y, sr=sr), axis=1)
        
        # Rhythm features
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # MFCC features (commonly used for genre classification)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_means = np.mean(mfccs, axis=1)
        mfcc_vars = np.var(mfccs, axis=1)
        
        # Chroma features (related to harmonic content)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_means = np.mean(chroma, axis=1)
        
        # Zero crossing rate (related to noisiness)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        
        # Combine all features
        features = np.concatenate([
            [np.mean(spectral_centroids), np.var(spectral_centroids)],
            [np.mean(spectral_rolloff), np.var(spectral_rolloff)],
            spectral_contrast,
            [tempo],
            mfcc_means, mfcc_vars,
            chroma_means,
            [np.mean(zcr), np.var(zcr)]
        ])
        
        return features, y, sr
    
    except Exception as e:
        print(f"Error extracting features: {str(e)}", file=sys.stderr)
        raise

def generate_mel_spectrogram(y, sr):
    """Generate a mel spectrogram image and return as base64 string"""
    plt.figure(figsize=(10, 4))
    S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
    S_dB = librosa.power_to_db(S, ref=np.max)
    librosa.display.specshow(S_dB, x_axis='time', y_axis='mel', sr=sr, fmax=8000)
    plt.colorbar(format='%+2.0f dB')
    plt.title('Mel-frequency spectrogram')
    plt.tight_layout()
    
    # Save figure to a BytesIO object
    buf = BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    
    # Convert to base64
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    return img_str

def classify_genre(features):
    """
    Classify the genre based on extracted features
    
    In a production environment, this would use a trained model.
    For this example, we'll use a simplified approach that mimics
    classification based on audio characteristics.
    """
    # This is a simplified classification approach
    # In reality, you would load and use a trained model here
    
    # Normalize features for consistent processing
    features_norm = (features - np.mean(features)) / np.std(features)
    
    # Generate pseudo-confidences based on feature patterns
    # This is not a real model, just a demonstration
    confidences = np.zeros(len(GENRES))
    
    # Use different feature combinations to influence genre predictions
    # MFCC features (indices 10-35) are particularly useful for genre classification
    mfcc_features = features_norm[10:36]
    
    # Spectral features (indices 0-9) help distinguish between genres
    spectral_features = features_norm[0:10]
    
    # Rhythm features (index 9) help identify genres with strong beats
    rhythm_feature = features_norm[9]
    
    # Chroma features (indices 36-47) relate to harmonic content
    chroma_features = features_norm[36:48]
    
    # Apply simplified rules to generate confidences
    # These are heuristics that loosely mimic what a trained model might learn
    
    # Blues: often has specific harmonic patterns
    confidences[0] = 0.5 + 0.1 * np.sum(chroma_features[0:3]) - 0.05 * rhythm_feature
    
    # Classical: typically has rich spectral content, less pronounced beats
    confidences[1] = 0.5 + 0.15 * np.sum(spectral_features[2:5]) - 0.1 * rhythm_feature
    
    # Country: specific vocal and instrument characteristics in MFCCs
    confidences[2] = 0.5 + 0.1 * np.sum(mfcc_features[0:5]) + 0.05 * chroma_features[2]
    
    # Disco: strong beats, specific spectral characteristics
    confidences[3] = 0.5 + 0.2 * rhythm_feature + 0.1 * spectral_features[1]
    
    # Hip hop: strong bass, specific rhythm patterns
    confidences[4] = 0.5 + 0.15 * rhythm_feature + 0.1 * mfcc_features[0]
    
    # Jazz: complex harmonic content, specific MFCC patterns
    confidences[5] = 0.5 + 0.15 * np.sum(chroma_features) + 0.1 * mfcc_features[2]
    
    # Metal: high energy across spectrum, strong beats
    confidences[6] = 0.5 + 0.15 * spectral_features[1] + 0.1 * rhythm_feature
    
    # Pop: balanced spectrum, moderate beats
    confidences[7] = 0.5 + 0.05 * np.sum(mfcc_features) + 0.05 * rhythm_feature
    
    # Reggae: specific rhythm and bass patterns
    confidences[8] = 0.5 + 0.1 * rhythm_feature + 0.1 * chroma_features[4]
    
    # Rock: high energy, strong beats, specific spectral shape
    confidences[9] = 0.5 + 0.1 * spectral_features[1] + 0.1 * rhythm_feature
    
    # Add some randomness to simulate model uncertainty
    confidences += np.random.normal(0, 0.05, len(confidences))
    
    # Ensure values are between 0 and 1
    confidences = np.clip(confidences, 0, 1)
    
    # Normalize to sum to 1
    confidences = confidences / np.sum(confidences)
    
    # Sort genres by confidence
    sorted_indices = np.argsort(confidences)[::-1]
    top_genres = [GENRES[i] for i in sorted_indices[:3]]
    top_confidences = confidences[sorted_indices[::-1]][:3].tolist()
    
    return {
        'genre': top_genres[0],
        'confidence': float(top_confidences[0]),
        'top_genres': top_genres,
        'top_confidences': top_confidences
    }

def main():
    """Main function to process audio file and return classification results"""
    if len(sys.argv) != 2:
        print(json.dumps({
            'error': 'Invalid arguments. Usage: python analyze_audio.py <audio_file_path>'
        }))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    
    try:
        # Extract features from audio
        features, y, sr = extract_features(audio_path)
        
        # Generate mel spectrogram
        spectrogram = generate_mel_spectrogram(y, sr)
        
        # Classify genre
        classification = classify_genre(features)
        
        # Add spectrogram to results
        classification['spectrogram'] = spectrogram
        
        # Output results as JSON
        print(json.dumps(classification))
        
    except Exception as e:
        print(json.dumps({
            'error': f'Error analyzing audio: {str(e)}'
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
