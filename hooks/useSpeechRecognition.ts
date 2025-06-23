import { useState, useEffect, useCallback, useRef } from 'react';

// Types are now globally available via global.d.ts
// No specific import needed here for SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
  resetTranscript: () => void;
}

const useSpeechRecognition = (onResultCallback?: (result: string) => void): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  const hasRecognitionSupport = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // List of language codes that better support Indian and Middle Eastern accents
  const getLanguageCode = () => {
    // Try to get user's preferred language from browser
    const userLang = navigator.language || 'en-US';
    
    // List of language codes that work well with Indian and Middle Eastern English accents
    const supportedAccentCodes = [
      'en-IN',  // Indian English
      'en-AE',  // UAE English
      'en-SA',  // Saudi Arabia English
      'en-GB',  // British English (often works better than US for non-native speakers)
      'en-US'   // Default fallback
    ];
    
    // Check if user's language is in our supported list
    if (supportedAccentCodes.includes(userLang)) {
      return userLang;
    }
    
    // Default to Indian English as it often handles various accents well
    return 'en-IN';
  };

  useEffect(() => {
    if (!hasRecognitionSupport) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition API not found.");
      return;
    }
    
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;

    // Configure recognition settings
    recognition.continuous = false; // We'll handle continuous mode ourselves
    recognition.interimResults = true; // Get results as they come
    recognition.lang = getLanguageCode(); // Set language based on user's preferences
    recognition.maxAlternatives = 5; // Get more alternatives for better accuracy

    // Clear any existing silence timer
    const clearSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    // Set a timer to stop listening after a period of silence
    const startSilenceTimer = () => {
      clearSilenceTimer();
      // Increase silence timeout to 2.5 seconds for better natural pauses
      silenceTimerRef.current = window.setTimeout(() => {
        if (isListening) {
          console.log('Silence detected, stopping recognition');
          stopListening();
        }
      }, 2500);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearSilenceTimer();
      
      let interimTranscript = '';
      let finalTranscript = '';
      let hasFinalResult = false;
      let confidence = 0;
      let resultCount = 0;
      
      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        const text = alternative.transcript;
        confidence += alternative.confidence || 0;
        resultCount++;
        
        if (result.isFinal) {
          finalTranscript += text + ' ';
          hasFinalResult = true;
        } else {
          interimTranscript += text;
        }
      }
      
      // Calculate average confidence
      const avgConfidence = resultCount > 0 ? confidence / resultCount : 0;
      
      // Update the transcript with both final and interim results
      const newTranscript = (finalTranscript || '') + (interimTranscript || '');
      setTranscript(newTranscript);
      
      // If we have a final result with good confidence, or if we've been listening for a while
      // with some speech detected, we can be more confident to stop
      if (hasFinalResult || (newTranscript.length > 5 && avgConfidence > 0.7)) {
        startSilenceTimer();
      } else if (newTranscript) {
        // If we have some text but not final, use a slightly longer timeout
        clearSilenceTimer();
        silenceTimerRef.current = window.setTimeout(() => {
          if (isListening) {
            console.log('No final result but text detected, stopping recognition');
            stopListening();
          }
        }, 3000);
      }
    };
    
    recognition.onspeechend = () => {
      // Speech has stopped, but we'll wait for onend to handle the final result
      startSilenceTimer();
    };
    
    recognition.onend = () => {
      clearSilenceTimer();
      
      // Only process the final transcript if we were actually listening
      if (isListening) {
        setIsListening(false);
        
        // Only trigger callback if we have a non-empty transcript
        if (transcript.trim() !== '') {
          onResultCallback?.(transcript.trim());
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      if (event.error === 'no-speech') {
        setError("I didn't hear anything. Could you try speaking again?");
      } else if (event.error === 'audio-capture') {
        setError("I couldn't access your microphone. Please check permissions.");
      } else if (event.error === 'not-allowed') {
        setError("Microphone access was denied. Please enable it in your browser settings.");
      } else {
        setError(`An error occurred: ${event.error}`);
      }
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRecognitionSupport, onResultCallback]); // transcript removed from deps to avoid re-triggering callback

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      // Reset state
      setTranscript('');
      setError(null);
      
      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
      
      // Set a timeout to automatically stop if no speech is detected
      setTimeout(() => {
        if (isListening && transcript === '') {
          stopListening();
        }
      }, 10000); // 10 seconds timeout if no speech detected
      
    } catch (e: any) {
      console.error("Error starting speech recognition:", e);
      setError(`Could not start voice input: ${e.message || "Please try again."}`);
      setIsListening(false);
    }
  }, [isListening, transcript]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
      // onend will handle setting isListening to false and calling onResultCallback
    } catch (e) {
      console.error("Error stopping speech recognition:", e);
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return { isListening, transcript, error, startListening, stopListening, hasRecognitionSupport, resetTranscript };
};

export default useSpeechRecognition;
