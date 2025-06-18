
import React from 'react';
import { VoiceOption } from '../types';
import { CloseIcon, VolumeOffIcon, VolumeUpIcon } from './icons';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supportedVoices: VoiceOption[];
  selectedVoiceURI: string | null;
  onVoiceChange: (uri: string) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  supportedVoices,
  selectedVoiceURI,
  onVoiceChange,
  speechRate,
  onSpeechRateChange,
  isMuted,
  toggleMute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-end" onClick={onClose}>
      <div 
        className="w-full max-w-sm h-full bg-slate-800 shadow-2xl p-6 text-slate-200 overflow-y-auto transform transition-transform duration-300 ease-in-out translate-x-0"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside drawer
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-sky-400" style={{fontFamily: "'Lora', serif"}}>Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Close settings">
            <CloseIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="voice-select" className="block text-sm font-medium text-slate-300 mb-1">Luna's Voice:</label>
          <select
            id="voice-select"
            value={selectedVoiceURI || ''}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-100"
          >
            {supportedVoices.length === 0 && <option value="">Loading voices...</option>}
            {supportedVoices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="speed-range" className="block text-sm font-medium text-slate-300 mb-1">
            Speaking Speed: <span className="font-normal text-sky-400">{speechRate.toFixed(1)}x</span>
          </label>
          <input
            id="speed-range"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechRate}
            onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        <div className="mb-8">
            <button
                onClick={toggleMute}
                className="w-full flex items-center justify-center p-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-100 transition-colors"
            >
                {isMuted ? <VolumeOffIcon className="w-5 h-5 mr-2"/> : <VolumeUpIcon className="w-5 h-5 mr-2" />}
                {isMuted ? "Unmute Luna's Voice" : "Mute Luna's Voice"}
            </button>
        </div>


        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-sky-400 mb-2">Privacy & You</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your conversations with Luna are designed to be private and ephemeral. 
            <strong>No conversation data is logged or stored, either on a server or in your browser's persistent storage (like localStorage).</strong>
            This means Luna's memory of our conversations is limited to the current session only; she will not remember details from past sessions if you start a new one by, for example, refreshing the page.
            The entire interaction happens within your browser session. If you close this tab or refresh, the conversation and any temporary memory from this session will be cleared.
            Luna will never ask for personally identifiable information. Your symbolic name is just for our interaction in this session.
          </p>
        </div>
         <p className="text-xs text-slate-500 mt-8 text-center">
            Luna is an AI companion and not a replacement for professional therapy. If you are in distress, please seek help from a qualified professional.
          </p>
      </div>
    </div>
  );
};

export default SettingsDrawer;
