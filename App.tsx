
import React, { useState, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { AppPhase, ChatMessage, ChatMessageSender, SymbolicName } from './types';
import SymbolicNameInput from './components/SymbolicNameInput';
import ChatView from './components/ChatView';
import VoiceInputControls from './components/VoiceInputControls';
import SettingsDrawer from './components/SettingsDrawer';
import { initLunaChat, sendUserMessageToLuna } from './services/geminiService';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useSpeechSynthesis from './hooks/useSpeechSynthesis';
import { SettingsIcon, VolumeUpIcon, VolumeOffIcon } from './components/icons';

const App: React.FC = () => {
  const [appPhase, setAppPhase] = useState<AppPhase>(AppPhase.INITIAL_SETUP);
  const [symbolicName, setSymbolicName] = useState<SymbolicName | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lunaChat, setLunaChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lunaStatusText, setLunaStatusText] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  
  const addMessage = useCallback((sender: ChatMessageSender, text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, timestamp: new Date() }]);
  }, []);

  const {
    speak: lunaSpeak,
    cancel: lunaCancelSpeech,
    isSpeaking: isLunaSpeaking,
    supportedVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speechRate,
    setSpeechRate,
    isSupported: ttsSupported,
    speechError: ttsError,
  } = useSpeechSynthesis();

  const handleUserSpeechResult = useCallback(async (text: string) => {
    if (!text.trim()) return;
    addMessage(ChatMessageSender.USER, text);
    setAppPhase(AppPhase.LUNA_THINKING);
    setLunaStatusText('Luna is thinking...');
    resetUserTranscript(); // Clear transcript after sending

    if (lunaChat) {
      const lunaResponseText = await sendUserMessageToLuna(lunaChat, text, messages);
      if (lunaResponseText) {
        addMessage(ChatMessageSender.LUNA, lunaResponseText);
        setAppPhase(AppPhase.LUNA_SPEAKING);
        setLunaStatusText('Luna is speaking...');
        if (!isMuted && ttsSupported) {
           lunaSpeak(lunaResponseText);
        } else {
            // If muted or TTS not supported, move to ready after a short delay
            setTimeout(() => setAppPhase(AppPhase.READY_TO_CHAT), 500);
        }
      } else {
        addMessage(ChatMessageSender.SYSTEM, "Sorry, I couldn't get a response. Please try again.");
        setAppPhase(AppPhase.ERROR);
        setError("Failed to get response from Luna.");
      }
    }
  }, [addMessage, lunaChat, messages, lunaSpeak, isMuted, ttsSupported]);

  const {
    isListening: isUserListening,
    transcript: userTranscript,
    error: micError,
    startListening: startUserListening,
    stopListening: stopUserListening,
    hasRecognitionSupport,
    resetTranscript: resetUserTranscript
  } = useSpeechRecognition(handleUserSpeechResult);


  useEffect(() => {
    if (appPhase === AppPhase.LUNA_SPEAKING && !isLunaSpeaking && !isMuted) {
      // Luna finished speaking (or was cancelled/error)
      setAppPhase(AppPhase.READY_TO_CHAT);
      setLunaStatusText('');
    }
  }, [appPhase, isLunaSpeaking, isMuted]);

  useEffect(() => {
    if (ttsError) {
      console.error("TTS Error:", ttsError);
      addMessage(ChatMessageSender.SYSTEM, `Speech error: ${ttsError}. Displaying text only.`);
      // If Luna was supposed to be speaking but TTS failed, transition state
      if (appPhase === AppPhase.LUNA_SPEAKING) {
        setAppPhase(AppPhase.READY_TO_CHAT);
      }
    }
  }, [ttsError, addMessage, appPhase]);


  const handleNameSelected = useCallback((name: SymbolicName) => {
    setSymbolicName(name);
    const chatInstance = initLunaChat(name.name);
    if (chatInstance) {
      setLunaChat(chatInstance);
      setAppPhase(AppPhase.LUNA_THINKING); // Initial greeting phase
      setLunaStatusText('Luna is preparing...');
      
      // Send an empty message or a specific trigger to get the first greeting from Luna
      sendUserMessageToLuna(chatInstance, "Hello Luna, I'm ready to start.", [])
        .then(initialResponse => {
          if (initialResponse) {
            addMessage(ChatMessageSender.LUNA, initialResponse);
            setAppPhase(AppPhase.LUNA_SPEAKING);
            setLunaStatusText('Luna is speaking...');
            if (!isMuted && ttsSupported) {
                lunaSpeak(initialResponse);
            } else {
                 setTimeout(() => setAppPhase(AppPhase.READY_TO_CHAT), 500);
            }
          } else {
            addMessage(ChatMessageSender.SYSTEM, "Welcome! I'm ready when you are.");
            setAppPhase(AppPhase.READY_TO_CHAT);
          }
        })
        .catch(err => {
          console.error("Error getting initial greeting:", err);
          addMessage(ChatMessageSender.SYSTEM, "There was an issue starting our chat. Please try refreshing.");
          setAppPhase(AppPhase.ERROR);
          setError("Failed to initialize chat.");
        });
    } else {
      setAppPhase(AppPhase.ERROR);
      setError("Failed to initialize chat with Luna. Please check API key and try again.");
    }
  }, [addMessage, lunaSpeak, isMuted, ttsSupported]);

  const toggleMute = () => {
    setIsMuted(prev => {
        const newMutedState = !prev;
        if (newMutedState && isLunaSpeaking) {
            lunaCancelSpeech(); // Stop current speech if muting
        }
        // If unmuting and Luna was supposed to be speaking (e.g. message just arrived)
        // this logic is tricky, usually unmuting applies to next speech.
        // For simplicity, current speech if any is stopped.
        return newMutedState;
    });
  };

  if (appPhase === AppPhase.INITIAL_SETUP || !symbolicName) {
    return <SymbolicNameInput onNameSelected={handleNameSelected} />;
  }
  
  // A simple loading for API key check (conceptual, as process.env is build-time)
  if (typeof process.env.API_KEY === 'undefined' || process.env.API_KEY === "") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-red-400 p-8">
        <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
        <p>The API_KEY is not configured. This application cannot function without it.</p>
        <p className="mt-2 text-sm text-slate-400">Please ensure the environment variable is set correctly by the hosting environment.</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen max-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 antialiased" style={{fontFamily: "'Inter', sans-serif"}}>
      <header className="p-4 bg-slate-800/70 backdrop-blur-md shadow-md flex justify-between items-center border-b border-slate-700">
        <h1 className="text-2xl font-bold text-sky-400" style={{fontFamily: "'Lora', serif"}}>Luna <span className="text-lg text-slate-400 font-normal"> & {symbolicName.name}</span></h1>
        <div className="flex items-center space-x-3">
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? <VolumeOffIcon className="w-6 h-6 text-slate-400" /> : <VolumeUpIcon className="w-6 h-6 text-slate-400" />}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Settings">
                <SettingsIcon className="w-6 h-6 text-slate-400" />
            </button>
        </div>
      </header>

      {error && (
        <div className="p-3 bg-red-700 text-white text-center text-sm">
          Error: {error} <button onClick={() => setError(null)} className="ml-2 font-bold underline">Dismiss</button>
        </div>
      )}

      <ChatView messages={messages} appPhase={appPhase} lunaStatusText={lunaStatusText} />

      <VoiceInputControls
        appPhase={appPhase}
        isListening={isUserListening}
        startListening={startUserListening}
        stopListening={stopUserListening}
        userTranscript={userTranscript}
        isMuted={isMuted}
        toggleMute={toggleMute}
        hasRecognitionSupport={hasRecognitionSupport}
        micError={micError}
      />
      
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        supportedVoices={supportedVoices}
        selectedVoiceURI={selectedVoiceURI}
        onVoiceChange={setSelectedVoiceURI}
        speechRate={speechRate}
        onSpeechRateChange={setSpeechRate}
        isMuted={isMuted}
        toggleMute={toggleMute}
      />
    </div>
  );
};

export default App;
