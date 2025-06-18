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

  const hasRecognitionSupport = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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

    recognition.continuous = true; // Keep listening even after a pause
    recognition.interimResults = true; // Get results as they come
    recognition.lang = 'en-US'; // Set language

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
      if (onResultCallback && finalTranscript) {
        // Only call callback with final result to avoid multiple triggers on interim
      }
    };
    
    recognition.onend = () => {
      // This onend can be triggered when stopListening is called, or naturally.
      // If it was listening and onend is called, it means it stopped.
      if (isListening) {
         // If it was supposed to be continuous and stopped, it might be an issue or a natural end.
         // For continuous=true, it might stop after a long silence.
         // We can choose to restart it here if we want truly continuous listening without manual restart.
         // However, for this app, user controls start/stop explicitly.
      }
       setIsListening(false); 
       if (onResultCallback && transcript.trim() !== "") {
         onResultCallback(transcript.trim()); // Send final transcript when listening stops
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
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.error("Error starting speech recognition:", e);
        setError(`Could not start voice input: ${e.message || "Please try again."}`);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will set isListening to false and trigger onResultCallback
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return { isListening, transcript, error, startListening, stopListening, hasRecognitionSupport, resetTranscript };
};

export default useSpeechRecognition;
