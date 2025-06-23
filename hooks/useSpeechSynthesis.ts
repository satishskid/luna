import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceOption } from '../types';
import { DEFAULT_VOICE_SETTINGS, VOICE_REGION_PRIORITY } from '../constants';

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
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const getBestMatchingVoice = useCallback((voices: VoiceOption[]): VoiceOption | null => {
    if (voices.length === 0) return null;

    const userLang = navigator.language || 'en-US';

    for (const region of VOICE_REGION_PRIORITY) {
      const langMatch = region.codes.some(code =>
        userLang.toLowerCase() === code.toLowerCase() ||
        userLang.toLowerCase().startsWith(`${code.toLowerCase()}-`)
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

    for (const region of VOICE_REGION_PRIORITY) {
      const matchingVoice = voices.find(voice =>
        region.patterns.some(pattern =>
          pattern.test(voice.name) || pattern.test(voice.lang)
        )
      );
      if (matchingVoice) return matchingVoice;
    }

    return voices[0] || null;
  }, []);

  const cancel = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();
    currentUtterance.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    try {
      cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance.current = utterance;

      if (selectedVoiceURI) {
        const voice = supportedVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (voice) {
          const synthesisVoice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoiceURI);
          if (synthesisVoice) utterance.voice = synthesisVoice;
        }
      }

      utterance.rate = speechRate;
      utterance.pitch = DEFAULT_VOICE_SETTINGS.pitch;
      utterance.volume = DEFAULT_VOICE_SETTINGS.volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeechError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtterance.current = null;
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        setIsSpeaking(false);
        setSpeechError(`Speech synthesis error: ${(event as any).error}`);
        console.error('SpeechSynthesis error:', event);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to speak:', error);
      setSpeechError(`Failed to speak: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [isSupported, selectedVoiceURI, speechRate, supportedVoices, cancel]);

  const populateVoiceList = useCallback(() => {
    if (!isSupported) return;

    const allVoices = window.speechSynthesis.getVoices();

    const processedVoices = allVoices
      .filter(voice => {
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
          localService: (voice as any).localService || false
        };
      });

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

    if (processedVoices.length > 0 && !selectedVoiceURI) {
      const bestVoice = getBestMatchingVoice(processedVoices);
      if (bestVoice) {
        setSelectedVoiceURI(bestVoice.voiceURI);
      }
    }
  }, [isSupported, selectedVoiceURI, getBestMatchingVoice]);

  useEffect(() => {
    if (!isSupported) {
      setSpeechError("Speech synthesis is not supported in this browser.");
      return;
    }

    populateVoiceList();

    const handleVoicesChanged = () => {
      populateVoiceList();
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      cancel();
    };
  }, [isSupported, populateVoiceList, cancel]);

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

export { useSpeechSynthesis };
