
export enum ChatMessageSender {
  USER = 'user',
  LUNA = 'luna',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  text: string;
  timestamp: Date;
  audioUrl?: string; // Optional: if we were to store user audio
}

export enum AppPhase {
  INITIAL_SETUP = 'INITIAL_SETUP', // Choosing symbolic name
  READY_TO_CHAT = 'READY_TO_CHAT',   // Symbolic name set, ready for first interaction
  USER_SPEAKING = 'USER_SPEAKING',
  PROCESSING_USER_INPUT = 'PROCESSING_USER_INPUT',
  LUNA_THINKING = 'LUNA_THINKING',   // Waiting for Gemini API
  LUNA_SPEAKING = 'LUNA_SPEAKING',
  SESSION_ENDED = 'SESSION_ENDED',
  ERROR = 'ERROR'
}

export interface SymbolicName {
  id: string;
  name: string;
}

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}
