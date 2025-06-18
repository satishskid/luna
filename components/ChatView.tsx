
import React, { useEffect, useRef } from 'react';
import { ChatMessage, AppPhase } from '../types';
import MessageBubble from './MessageBubble';
import { BotIcon } from './icons';

interface ChatViewProps {
  messages: ChatMessage[];
  appPhase: AppPhase;
  lunaStatusText?: string; 
}

const ChatView: React.FC<ChatViewProps> = ({ messages, appPhase, lunaStatusText }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, appPhase]); // Also scroll when phase changes, e.g., Luna starts thinking

  return (
    <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto chat-container bg-slate-800/50 rounded-t-lg">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {(appPhase === AppPhase.LUNA_THINKING || appPhase === AppPhase.LUNA_SPEAKING || appPhase === AppPhase.PROCESSING_USER_INPUT) && (
        <div className="flex items-start space-x-2 self-start animate-pulse mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center mt-1">
            <BotIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="px-4 py-3 bg-slate-700 text-slate-400 rounded-r-xl rounded-tl-xl shadow-md">
            <p className="text-sm italic">
              {lunaStatusText || (appPhase === AppPhase.LUNA_THINKING ? 'Luna is thinking...' : (appPhase === AppPhase.PROCESSING_USER_INPUT ? 'Processing...' : 'Luna is speaking...'))}
            </p>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatView;
