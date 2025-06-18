
import React from 'react';
import { AppPhase } from '../types';
import { MicrophoneIcon, StopIcon } from './icons';

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
  hasRecognitionSupport,
  micError,
}) => {
  const isDisabled = 
    appPhase === AppPhase.LUNA_THINKING || 
    appPhase === AppPhase.LUNA_SPEAKING ||
    appPhase === AppPhase.INITIAL_SETUP ||
    appPhase === AppPhase.PROCESSING_USER_INPUT;

  const getButtonTextAndIcon = () => {
    if (isListening) return { text: 'Stop Listening', Icon: StopIcon, action: stopListening, color: 'bg-red-600 hover:bg-red-500' };
    return { text: 'Speak to Luna', Icon: MicrophoneIcon, action: startListening, color: 'bg-sky-600 hover:bg-sky-500' };
  };

  const { text, Icon, action, color } = getButtonTextAndIcon();

  if (!hasRecognitionSupport) {
    return (
      <div className="p-4 border-t border-slate-700 bg-slate-800 text-center text-red-400">
        Voice input is not supported by your browser. You can still type your responses.
      </div>
    );
  }
  
  return (
    <div className="p-4 border-t border-slate-700 bg-slate-800/80 backdrop-blur-sm rounded-b-lg">
      {micError && <p className="text-red-400 text-sm text-center mb-2">{micError}</p>}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={action}
          disabled={isDisabled}
          className={`px-6 py-3 rounded-full text-white font-semibold transition-all duration-150 ease-in-out flex items-center space-x-2 shadow-lg
                      ${isDisabled ? 'bg-slate-600 cursor-not-allowed opacity-70' : `${color} focus:ring-4 focus:ring-opacity-50 ${isListening ? 'ring-red-400' : 'ring-sky-400'}`}
                      transform hover:scale-105 active:scale-95`}
          aria-label={text}
        >
          <Icon className="w-6 h-6" />
          <span>{isListening ? 'Listening...' : (isDisabled && (appPhase === AppPhase.LUNA_SPEAKING || appPhase === AppPhase.LUNA_THINKING) ? 'Luna is active' : 'Speak')}</span>
        </button>
      </div>
      {isListening && userTranscript && (
        <p className="text-center text-slate-400 italic mt-3 text-sm h-6">
          {userTranscript ? `"${userTranscript}"` : "..."}
        </p>
      )}
       {!isListening && userTranscript && ( // Show final transcript before sending
        <p className="text-center text-slate-300 mt-3 text-sm h-6">
          You said: "{userTranscript}"
        </p>
      )}
    </div>
  );
};

export default VoiceInputControls;
