import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceOption } from '../types';
import { DEFAULT_VOICE_SETTINGS, VOICE_REGION_PRIORITY } from '../constants';

export interface SpeechSynthesisHook {
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

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(DEFAULT_VOICE_SETTINGS.rate);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  // Get the best matching voice based on user preferences
  const getBestMatchingVoice = useCallback((voices: VoiceOption[]) => {
    if (voices.length === 0) return null;
    
    const userLang = navigator.language || 'en-US';
    
    // Try to find a voice that matches the user's language and region
    for (const region of VOICE_REGION_PRIORITY) {
      // Check if user's language matches any of the region's language codes
      const langMatch = region.codes.some(code => 
        userLang.toLowerCase() === code.toLowerCase() ||
        userLang.toLowerCase().startsWith(code.toLowerCase() + '-')
      );
      
      if (langMatch) {
        const matchingVoice = voices.find(voice => 
          region.codes.some(code => voice.lang.toLowerCase() === code.toLowerCase()) ||
          region.patterns.some(pattern => 
            pattern.test(voice.name) || pattern.test(voice.lang)
          )
        );
        if (matchingVoice) return matchingVoice;
      }
    }
    
    // Fall back to any voice that matches the patterns
    for (const region of VOICE_REGION_PRIORITY) {
      const matchingVoice = voices.find(voice => 
        region.patterns.some(pattern => 
          pattern.test(voice.name) || pattern.test(voice.lang)
        )
      );
      if (matchingVoice) return matchingVoice;
    }
    
    // Default to the first available voice
    return voices[0];
  }, []);

  const populateVoiceList = useCallback(() => {
    if (!isSupported) return;
    
    const allVoices = speechSynthesis.getVoices();
    
    const processedVoices = allVoices
      .filter(voice => {
        // Include English voices or voices from our priority regions
        if (voice.lang.startsWith('en')) return true;
        
        const langCode = voice.lang.split('-')[0].toLowerCase();
        return VOICE_REGION_PRIORITY.some(region => 
          region.codes.some(code => code.toLowerCase().startsWith(langCode))
        );
      })
      .map(voice => {
        const regionMatch = VOICE_REGION_PRIORITY.find(region => 
          region.patterns.some(pattern => 
            pattern.test(voice.name) || pattern.test(voice.lang)
          )
        );
        
        return {
          name: voice.name,
          lang: voice.lang,
          voiceURI: voice.voiceURI,
          region: regionMatch?.name || 'Other',
          isDefault: voice.default,
          localService: voice.localService
        };
      });
    
    // Sort by region priority and quality
    processedVoices.sort((a, b) => {
      const regionA = VOICE_REGION_PRIORITY.findIndex(r => 
        r.patterns.some(p => p.test(a.name) || p.test(a.lang))
      );
      const regionB = VOICE_REGION_PRIORITY.findIndex(r => 
        r.patterns.some(p => p.test(b.name) || p.test(b.lang))
      );
      
      if (regionA !== regionB) return regionA - regionB;
      if (a.localService !== b.localService) return a.localService ? -1 : 1;
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    
    setSupportedVoices(processedVoices);
    
    // Set default voice if not already set
    if (processedVoices.length > 0 && !selectedVoiceURI) {
      const bestVoice = getBestMatchingVoice(processedVoices);
      if (bestVoice) {
        setSelectedVoiceURI(bestVoice.voiceURI);
      }
    }
  }, [isSupported, selectedVoiceURI, getBestMatchingVoice]);

  // Load voices when they become available
  useEffect(() => {
    if (!isSupported) {
      setSpeechError("Speech synthesis is not supported in this browser.");
      return;
    }
    
    // Initial population
    populateVoiceList();
    
    // Some browsers require this event to be listened to for voice loading
    const handleVoicesChanged = () => {
      populateVoiceList();
    };
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }
    
    return () => {
      if (isSupported && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
      cancel(); // Clean up any ongoing speech
    };
  }, [isSupported, populateVoiceList]);
  
  // Speak function that handles text-to-speech
  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;
    
    try {
      // Cancel any ongoing speech
      cancel();
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance.current = utterance;
      
      // Set voice if available
      if (selectedVoiceURI) {
        const voice = supportedVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (voice) {
          utterance.voice = supportedVoices.find(v => v.voiceURI === selectedVoiceURI) as any;
        }
      }
      
      // Set speech properties
      utterance.rate = speechRate;
      utterance.pitch = DEFAULT_VOICE_SETTINGS.pitch;
      utterance.volume = DEFAULT_VOICE_SETTINGS.volume;
      
      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeechError(null);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtterance.current = null;
      };
      
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setSpeechError(`Speech synthesis error: ${event.error}`);
        console.error('SpeechSynthesis error:', event);
      };
      
      // Start speaking
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to speak:', error);
      setSpeechError(`Failed to speak: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [isSupported, selectedVoiceURI, speechRate, supportedVoices]);
  
  // Cancel any ongoing speech
  const cancel = useCallback(() => {
    if (!isSupported) return;
    
    speechSynthesis.cancel();
    if (currentUtterance.current) {
      currentUtterance.current = null;
    }
    setIsSpeaking(false);
  }, [isSupported]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);
  
  // Return the hook API
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
