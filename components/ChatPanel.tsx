import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WorldType } from '../types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  world: WorldType;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
    isOpen, 
    onClose, 
    messages, 
    onSendMessage,
    isLoading,
    world
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
        onSendMessage(input.trim());
        setInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-700 transform transition-transform animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 backdrop-blur">
        <h2 className="text-lg font-serif-sc font-bold text-gray-100">
            与命运对话 (Narrator)
        </h2>
        <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Warning/Hint */}
      <div className="bg-indigo-900/30 p-2 text-xs text-indigo-300 text-center border-b border-indigo-500/20">
          你的建议可能会影响接下来的一年...
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
         {messages.length === 0 && (
             <div className="text-center text-gray-500 text-sm mt-10 italic">
                 在这里，你可以试图贿赂、威胁或恳求“旁白”...
             </div>
         )}
         {messages.map((msg) => (
             <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
             >
                 <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                     msg.sender === 'user' 
                     ? 'bg-indigo-600 text-white rounded-br-none' 
                     : 'bg-gray-700 text-gray-200 rounded-bl-none'
                 }`}>
                     {msg.content}
                 </div>
             </div>
         ))}
         {isLoading && (
             <div className="flex justify-start">
                 <div className="bg-gray-700 text-gray-400 rounded-2xl rounded-bl-none px-4 py-2 text-xs animate-pulse">
                     命运正在思考...
                 </div>
             </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="我想捡到一把神剑..."
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                发送
              </button>
          </div>
      </form>
    </div>
  );
};