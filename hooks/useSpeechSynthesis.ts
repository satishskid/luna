import { useState, useEffect, useCallback } from 'react';
import { VoiceOption } from '../types'; // Corrected: VoiceOption is in types.ts
import { DEFAULT_VOICE_SETTINGS } from '../constants'; // DEFAULT_VOICE_SETTINGS is in constants.ts

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  supportedVoices: VoiceOption[];
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  isSupported: boolean;
  speechError: string | null;
}

const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(DEFAULT_VOICE_SETTINGS.rate);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const populateVoiceList = useCallback(() => {
    if (!isSupported) return;
    const voices = speechSynthesis.getVoices()
      .filter(voice => voice.lang.startsWith('en')) // Filter for English voices initially
      .map(voice => ({ name: voice.name, lang: voice.lang, voiceURI: voice.voiceURI }));
    setSupportedVoices(voices);
    if (voices.length > 0 && !selectedVoiceURI) {
       // Try to find a default female voice or a Google voice
      const defaultGoogleFemaleVoice = voices.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female'));
      const defaultFemaleVoice = voices.find(v => v.name.toLowerCase().includes('female'));
      const firstVoice = voices[0];
      setSelectedVoiceURI(defaultGoogleFemaleVoice?.voiceURI || defaultFemaleVoice?.voiceURI || firstVoice?.voiceURI);
    }
  }, [isSupported, selectedVoiceURI]);

  useEffect(() => {
    if (!isSupported) {
      setSpeechError("Speech synthesis is not supported in this browser.");
      return;
    }
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (isSupported) {
        speechSynthesis.cancel(); // Cancel any ongoing speech when component unmounts
      }
    };
  }, [isSupported, populateVoiceList]);

  const speak = useCallback((text: string) => {
    if (!isSupported || isSpeaking) return;
    setSpeechError(null);
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoiceURI) {
      const voice = supportedVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) {
        // Find the actual SpeechSynthesisVoice object
        const synthesisVoice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoiceURI);
        if(synthesisVoice) utterance.voice = synthesisVoice;
      }
    }
    
    utterance.rate = speechRate;
    utterance.pitch = DEFAULT_VOICE_SETTINGS.pitch;
    utterance.volume = DEFAULT_VOICE_SETTINGS.volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => { // Type SpeechSynthesisErrorEvent for browser compatibility
      console.error('Speech synthesis error:', event);
      setSpeechError(`Speech error: ${event.error}`);
      setIsSpeaking(false);
    };
    
    speechSynthesis.speak(utterance);
  }, [isSupported, isSpeaking, selectedVoiceURI, supportedVoices, speechRate]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { 
    speak, 
    cancel, 
    isSpeaking, 
    supportedVoices, 
    selectedVoiceURI, 
    setSelectedVoiceURI,
    speechRate,
    setSpeechRate,
    isSupported,
    speechError
  };
};

export default useSpeechSynthesis;
