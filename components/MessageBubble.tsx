
import React from 'react';
import { ChatMessage, ChatMessageSender } from '../types';
import { UserIcon, BotIcon } from './icons';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === ChatMessageSender.USER;

  const bubbleClasses = isUser
    ? 'bg-sky-600 text-white self-end rounded-l-xl rounded-tr-xl'
    : 'bg-slate-700 text-slate-200 self-start rounded-r-xl rounded-tl-xl';
  
  const alignmentClasses = isUser ? 'items-end' : 'items-start';
  
  const IconComponent = isUser ? UserIcon : BotIcon;
  const iconColor = isUser ? 'text-sky-300' : 'text-purple-400';

  return (
    <div className={`flex flex-col w-full max-w-lg mb-4 ${alignmentClasses} animate-fade-in-up`}>
      <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-sky-700' : 'bg-slate-600'} mt-1`}>
          <IconComponent className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className={`px-4 py-3 ${bubbleClasses} shadow-md`}>
          <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
        </div>
      </div>
      <p className={`text-xs text-slate-500 mt-1 px-11 ${isUser ? 'text-right' : 'text-left'}`}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
};

export default MessageBubble;

// Add this to your Tailwind config or a global style for animations if needed:
/*
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}
*/
// For simplicity here, assume Tailwind JIT handles this or it's added to index.html style block if complex.
// The provided Tailwind CDN should support basic animations.
// If not, a simple opacity transition can be used: `transition-opacity duration-300 opacity-0 data-[loaded=true]:opacity-100`
// and manage a 'loaded' data attribute.
