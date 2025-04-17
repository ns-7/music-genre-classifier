"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Share2,
  Twitter,
  Facebook,
  Copy,
  CheckCircle,
  Music,
  Info,
  Server,
  Wifi,
  WifiOff,
  Star
} from "lucide-react";
import RatingSystem from "@/components/RatingSystem";
import { submitRating } from "@/lib/api";

export default function MusicClassifier() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    genre: string;
    confidence: number;
    topGenres: string[];
    topConfidences: number[];
    spectrogram: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGenreInfo, setShowGenreInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [apiMessage, setApiMessage] = useState<string>('Checking API connection...');
  const [showRatingSystem, setShowRatingSystem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    }
  };

  const handleFileChange = (selectedFile: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload an audio file (MP3, WAV, OGG, M4A)');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create URL for audio preview
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(URL.createObjectURL(selectedFile));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const genreInfo: Record<string, string> = {
    blues: "Blues is a musical genre and form originating in the Deep South of the United States around the 1860s, characterized by specific chord progressions and blue notes.",
    classical: "Classical music is art music produced or rooted in the traditions of Western culture, typically characterized by complex composition, theoretical study, and an emphasis on technique.",
    country: "Country music is a genre of American popular music that originated in the rural Southern United States in the 1920s, often featuring stringed instruments like guitars, banjos, and fiddles.",
    disco: "Disco is a genre of dance music and a subculture that emerged in the 1970s, characterized by four-on-the-floor beats, syncopated basslines, and lush, orchestral arrangements.",
    hiphop: "Hip hop music (also called rap music) emerged in the United States in the 1970s and is characterized by rhythmic music that commonly accompanies rapping, a rhythmic and rhyming speech.",
    jazz: "Jazz is a music genre that originated in the African-American communities of New Orleans, United States, in the late 19th and early 20th centuries, known for swing and blue notes, complex chords, and improvisation.",
    metal: "Metal (or heavy metal) is a genre of rock music that developed in the late 1960s and early 1970s, largely in the United Kingdom and the United States, with distorted guitars, emphatic rhythms, and often apocalyptic or fantasy lyrics.",
    pop: "Pop music is a genre of popular music that originated in its modern form in the United States and United Kingdom during the mid-1950s, characterized by catchy melodies, simple structure, and often featuring vocals and rhythm sections.",
    reggae: "Reggae is a music genre that originated in Jamaica in the late 1960s, characterized by a distinctive rhythm pattern featuring regular chops on the off-beat, typically played by a guitar or piano.",
    rock: "Rock music is a broad genre of popular music that originated as 'rock and roll' in the United States in the late 1940s and early 1950s, developing into various styles in the 1960s, typically with a strong backbeat and using electric guitars, bass, and drums."
  };

  const toggleGenreInfo = (genre: string | null) => {
    setShowGenreInfo(genre);
  };

  const shareResults = async (platform: string) => {
    if (!results) return;

    const shareText = `I just analyzed a track with Music Genre Classifier and discovered it's ${results.genre} music with ${Math.round(results.confidence * 100)}% confidence! Check it out:`;
    const shareUrl = window.location.href;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
        break;
      default:
        break;
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setResults(null);
    setError(null);

    try {
      // Use the API to analyze the audio file if connected
      if (apiStatus === 'connected') {
        import('@/lib/api').then(async (api) => {
          try {
            const result = await api.analyzeAudio(file);

            // Transform API response format to match our frontend model
            setResults({
              genre: result.genre,
              confidence: result.confidence,
              topGenres: result.top_genres,
              topConfidences: result.top_confidences,
              spectrogram: result.spectrogram
            });
          } catch (error) {
            console.error('Error analyzing audio with API:', error);
            // Fall back to simulated classification
            performSimulatedClassification();
          } finally {
            setAnalyzing(false);
          }
        }).catch((error) => {
          console.error('Error importing API client:', error);
          // Fall back to simulated classification
          performSimulatedClassification();
        });
      } else {
        // If API is not connected, use simulated classification
        performSimulatedClassification();
      }
    } catch (error) {
      setError('An error occurred during analysis. Please try again.');
      console.error('Error:', error);
      setAnalyzing(false);
    }
  };

  // Simulated classification for fallback when API is not available
  const performSimulatedClassification = async () => {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simple filename-based classification with randomization
      if (!file) return;
      const fileName = file.name.toLowerCase();

      // Basic genre weights
      const genreWeights: Record<string, number> = {
        blues: 0.1,
        classical: 0.1,
        country: 0.1,
        disco: 0.1,
        hiphop: 0.1,
        jazz: 0.1,
        metal: 0.1,
        pop: 0.1,
        reggae: 0.1,
        rock: 0.1
      };

      // Apply filename-based weights
      for (const genre of Object.keys(genreWeights)) {
        if (fileName.includes(genre)) {
          genreWeights[genre] += 0.3;
        }
      }

      // Add randomness (less sophisticated than the original simulation)
      for (const genre of Object.keys(genreWeights)) {
        genreWeights[genre] += Math.random() * 0.4;
      }

      // Get top genres
      const sortedGenres = Object.entries(genreWeights)
        .sort((a, b) => b[1] - a[1])
        .map(([genre, weight]) => ({ genre, confidence: weight }));

      // Normalize
      const totalConfidence = sortedGenres.reduce((sum, item) => sum + item.confidence, 0);
      const topGenres = sortedGenres.slice(0, 3).map(item => item.genre);
      const topConfidences = sortedGenres.slice(0, 3).map(item => item.confidence / totalConfidence);

      setResults({
        genre: topGenres[0],
        confidence: topConfidences[0],
        topGenres,
        topConfidences,
        spectrogram: null
      });

      setApiMessage("Using simulated classification (API unavailable)");
    } catch (error) {
      setError('Error during simulated classification.');
      console.error('Simulation error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileUrl(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    // Check API health on component mount
    const checkApi = async () => {
      try {
        const api = await import('@/lib/api');
        const health = await api.checkApiHealth();

        setApiStatus('connected');
        setApiMessage(health.message || 'API connected');
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus('error');
        setApiMessage('API connection failed. Using simulated classification.');
      }
    };

    checkApi();

    return () => {
      // Clean up file URL on component unmount
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // API Status Indicator Component
  const ApiStatusIndicator = () => (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
      apiStatus === 'connected'
        ? 'bg-green-600 text-white'
        : apiStatus === 'connecting'
          ? 'bg-yellow-500 text-black'
          : 'bg-red-600 text-white'
    }`}>
      {apiStatus === 'connected' ? (
        <Wifi size={16} />
      ) : apiStatus === 'connecting' ? (
        <Server size={16} className="animate-pulse" />
      ) : (
        <WifiOff size={16} />
      )}
      <span className="hidden sm:inline">{apiMessage}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 py-10 text-white">
      <ApiStatusIndicator />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-gray-800 shadow-xl rounded-lg overflow-hidden p-6 border border-yellow-500/20">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
                <Music size={20} />
              </div>
              <h1 className="text-3xl font-bold text-blue-400">Music Genre Classifier</h1>
            </div>
            <p className="text-gray-400 mt-2">
              Upload a music file to classify its genre using our intelligent classifier technology
            </p>
          </div>

          {!results ? (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${error ? 'border-red-500' : 'border-gray-600'} hover:border-yellow-500 transition-colors`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="mb-4">
                  <Music className="w-12 h-12 mx-auto text-yellow-400" />
                </div>
                <p className="text-gray-300 mb-4">Drag and drop your audio file here or click to browse</p>
                <button
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-medium py-2 px-4 rounded-md transition duration-200"
                  onClick={handleBrowseClick}
                >
                  Browse Files
                </button>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept=".mp3,.wav,.ogg,.m4a"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
              </div>

              {error && (
                <div className="text-red-500 text-center mb-4">
                  {error}
                </div>
              )}

              {file && (
                <div className="mb-6">
                  <div className="p-4 bg-gray-700 rounded-md">
                    <div className="flex items-center mb-2">
                      <Music className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="text-gray-200 font-medium">{file.name}</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      File size: {formatFileSize(file.size)}
                    </div>
                    {fileUrl && (
                      <div className="mt-2">
                        <audio
                          ref={audioRef}
                          controls
                          className="w-full"
                          src={fileUrl}
                        >
                          <track kind="captions" />
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  className={`${
                    file ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-gray-600 cursor-not-allowed text-gray-300'
                  } font-medium py-2 px-6 rounded-md transition duration-200`}
                  onClick={handleAnalyze}
                  disabled={!file || analyzing}
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : 'Analyze Genre'}
                </button>
              </div>
            </>
          ) : (
            <div className="results-container">
              <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">Analysis Results</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">Detected Genre</h3>
                  <div className="text-3xl font-bold text-center mb-4 capitalize text-white">
                    {results.genre}
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-4">
                    <div
                      className="bg-yellow-500 h-4 rounded-full"
                      style={{ width: `${Math.round(results.confidence * 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-sm mt-1 text-gray-300">
                    {Math.round(results.confidence * 100)}%
                  </div>
                  <button
                    onClick={() => toggleGenreInfo(results.genre)}
                    className="mt-2 text-yellow-400 flex items-center"
                  >
                    <Info size={16} className="mr-1" />
                    {showGenreInfo === results.genre ? 'Hide Info' : 'About this genre'}
                  </button>
                  {showGenreInfo === results.genre && (
                    <div className="mt-2 text-gray-300 bg-gray-800 p-3 rounded">
                      {genreInfo[results.genre as keyof typeof genreInfo]}
                    </div>
                  )}
                </div>

                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">Top 3 Predictions</h3>
                  {results.topGenres.map((genre, index) => (
                    <div key={genre} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="capitalize text-white">{genre}</span>
                        <span className="text-gray-300">{Math.round(results.topConfidences[index] * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.round(results.topConfidences[index] * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">Audio Visualization</h3>
                {results.spectrogram ? (
                  <div className="text-center">
                    <img
                      src={`data:image/png;base64,${results.spectrogram}`}
                      alt="Audio Visualization"
                      className="max-w-full rounded-md mx-auto"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 border border-gray-600 rounded-lg">
                    <div className="text-gray-400">
                      <Music className="w-16 h-16 mx-auto text-yellow-400" />
                      <p className="mt-2">Audio visualization not available in this demo</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-4">
                  Note: This is a client-side demonstration of the music genre classifier. In a production environment,
                  audio processing would be performed on a server with a trained machine learning model for accurate results.
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center gap-4 mb-6">
                  <button
                    className="bg-blue-500 hover:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition duration-200"
                    onClick={handleReset}
                  >
                    Analyze Another Track
                  </button>
                  <button
                    className="bg-green-500 hover:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition duration-200 flex items-center"
                    onClick={() => setShowRatingSystem(true)}
                  >
                    <Star size={16} className="mr-2" />
                    Rate This Result
                  </button>
                </div>
                
                {showRatingSystem && (
                  <RatingSystem
                    audioId={file?.name || 'unknown'}
                    predictedGenre={results.genre}
                    onSubmit={async (rating) => {
                      try {
                        await submitRating(rating);
                        return Promise.resolve();
                      } catch (error) {
                        console.error('Failed to submit rating:', error);
                        return Promise.reject(error);
                      }
                    }}
                    onClose={() => setShowRatingSystem(false)}
                  />
                )}
                
                <div className="flex justify-center mt-6 gap-3">
                  <button
                    onClick={() => shareResults('twitter')}
                    className="flex items-center bg-[#1DA1F2] hover:bg-[#1a94da] text-white font-medium py-2 px-4 rounded-md"
                  >
                    <Twitter size={16} className="mr-2" />
                    Share
                  </button>
                  <button
                    onClick={() => shareResults('facebook')}
                    className="flex items-center bg-[#4267B2] hover:bg-[#375695] text-white font-medium py-2 px-4 rounded-md"
                  >
                    <Facebook size={16} className="mr-2" />
                    Share
                  </button>
                  <button
                    onClick={() => shareResults('copy')}
                    className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-md"
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
