
import React, { useEffect, useState } from 'react';
import { AppPhase } from '../types';
import { MicrophoneIcon, StopIcon, VolumeUpIcon, VolumeOffIcon } from './icons';

interface VoiceInputControlsProps {
  appPhase: AppPhase;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  userTranscript: string;
  isMuted: boolean;
  toggleMute: () => void;
  hasRecognitionSupport: boolean;
  micError: string | null;
}

const VoiceInputControls: React.FC<VoiceInputControlsProps> = ({
  appPhase,
  isListening,
  startListening,
  stopListening,
  userTranscript,
  isMuted,
  toggleMute,
  hasRecognitionSupport,
  micError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');

  // Update last transcript when user stops speaking
  useEffect(() => {
    if (!isListening && userTranscript) {
      setLastTranscript(userTranscript);
      
      // Clear the last transcript after a delay
      const timer = setTimeout(() => {
        setLastTranscript('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isListening, userTranscript]);

  const isDisabled = 
    appPhase === AppPhase.LUNA_THINKING || 
    appPhase === AppPhase.LUNA_SPEAKING ||
    appPhase === AppPhase.INITIAL_SETUP ||
    appPhase === AppPhase.PROCESSING_USER_INPUT;

  const handleMicClick = () => {
    if (isListening) {
      // When stopping manually, process immediately
      setIsProcessing(true);
      stopListening();
      // Reset processing state after a short delay
      setTimeout(() => setIsProcessing(false), 1000);
    } else {
      // When starting, clear any previous state
      setLastTranscript('');
      startListening();
    }
  };

  const getButtonTextAndIcon = () => {
    if (isProcessing) {
      return { 
        text: 'Processing...', 
        Icon: MicrophoneIcon, 
        action: () => {},
        color: 'bg-amber-600 hover:bg-amber-500',
        pulse: true
      };
    }
    if (isListening) {
      return { 
        text: 'Listening...', 
        Icon: StopIcon, 
        action: handleMicClick, 
        color: 'bg-red-600 hover:bg-red-500',
        pulse: true
      };
    }
    return { 
      text: 'Speak to Luna', 
      Icon: MicrophoneIcon, 
      action: handleMicClick, 
      color: 'bg-sky-600 hover:bg-sky-500',
      pulse: false
    };
  };

  const { text, Icon, action, color, pulse } = getButtonTextAndIcon();

  if (!hasRecognitionSupport) {
    return (
      <div className="p-4 border-t border-slate-700 bg-slate-800 text-center text-red-400">
        Voice input is not supported by your browser. You can still type your responses.
      </div>
    );
  }
  
  return (
    <div className="p-4 border-t border-slate-700 bg-slate-800/80 backdrop-blur-sm rounded-b-lg">
      {micError && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm p-2 rounded-lg mb-3 text-center">
          {micError}
        </div>
      )}
      
      <div className="flex items-center justify-center space-x-4">
        <div className="relative">
          <button
            onClick={action}
            disabled={isDisabled || isProcessing}
            className={`px-6 py-3 rounded-full text-white font-semibold transition-all duration-150 ease-in-out flex items-center space-x-2 shadow-lg
                        ${isDisabled ? 'bg-slate-600 cursor-not-allowed opacity-70' : `${color} focus:ring-4 focus:ring-opacity-50`}
                        transform hover:scale-105 active:scale-95 relative overflow-hidden`}
            aria-label={text}
          >
            <Icon className={`w-6 h-6 ${pulse ? 'animate-pulse' : ''}`} />
            <span className="flex items-center">
              {isProcessing ? (
                <>
                  <span className="inline-block w-2 h-2 mr-2 bg-amber-400 rounded-full animate-pulse"></span>
                  Processing...
                </>
              ) : isListening ? (
                <>
                  <span className="inline-block w-2 h-2 mr-2 bg-red-500 rounded-full animate-pulse"></span>
                  Tap to Stop
                </>
              ) : isDisabled && (appPhase === AppPhase.LUNA_SPEAKING || appPhase === AppPhase.LUNA_THINKING) ? (
                'Luna is active'
              ) : (
                'Tap to Speak'
              )}
            </span>
          </button>
          
          {/* Visual indicator for listening state */}
          {isListening && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
          )}
          {isListening && (
            <div className="absolute -inset-1 rounded-full bg-red-500/10 animate-pulse"></div>
          )}
        </div>
        
        {/* Mute toggle button */}
        <button
          onClick={toggleMute}
          disabled={isDisabled}
          className={`p-3 rounded-full transition-colors ${isDisabled ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-700'}`}
          aria-label={isMuted ? 'Unmute Luna' : 'Mute Luna'}
        >
          {isMuted ? (
            <VolumeOffIcon className="w-5 h-5" />
          ) : (
            <VolumeUpIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Transcript display */}
      <div className="mt-3 min-h-6 text-center">
        {isListening && userTranscript ? (
          <p className="text-slate-400 italic">
            <span className="text-sky-400">You:</span> {userTranscript}
            <span className="inline-block w-1 h-4 bg-slate-500 ml-1 animate-pulse"></span>
          </p>
        ) : lastTranscript ? (
          <p className="text-slate-400 text-sm">
            <span className="text-slate-500">You said:</span> {lastTranscript}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default VoiceInputControls;
