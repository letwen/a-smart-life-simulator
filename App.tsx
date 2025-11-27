import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Attributes, GameState, WorldType, LifeEvent, WORLD_CONFIGS, ChatMessage } from './types';
import { generateNextYear, chatWithNarrator } from './services/geminiService';
import { AttributePanel } from './components/AttributePanel';
import { EventLog } from './components/EventLog';
import { SetupScreen } from './components/SetupScreen';
import { ChatPanel } from './components/ChatPanel';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    age: -1,
    world: WorldType.MODERN,
    attributes: { strength: 0, intelligence: 0, charm: 0, wealth: 0 },
    history: [],
    loading: false,
    talents: []
  });

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const startGame = (initialAttrs: Attributes, talents: string[]) => {
    // Always start in Modern world
    const initialWorld = WorldType.MODERN;
    
    setGameState({
      isPlaying: true,
      isGameOver: false,
      age: 0,
      world: initialWorld,
      attributes: initialAttrs,
      history: [],
      loading: false,
      talents
    });
    // Trigger birth immediately
    processYear(0, initialWorld, initialAttrs, [], talents, []);
  };

  const processYear = async (
    currentAge: number, 
    currentWorld: WorldType, 
    attrs: Attributes, 
    history: LifeEvent[],
    talents: string[],
    recentChat: ChatMessage[]
  ) => {
    setGameState(prev => ({ ...prev, loading: true }));

    // Extract recent conversation (User AND Narrator) to capture agreements
    // Take the last 6 messages to provide enough context
    const narratorContext = recentChat
        .slice(-6)
        .map(m => `${m.sender === 'user' ? 'Player' : 'Narrator'}: "${m.content}"`)
        .join("\n");

    const response = await generateNextYear(currentAge, attrs, currentWorld, history, talents, narratorContext);
    
    // Calculate new attributes
    const newAttributes: Attributes = {
      strength: attrs.strength + (response.statsDiff.strength || 0),
      intelligence: attrs.intelligence + (response.statsDiff.intelligence || 0),
      charm: attrs.charm + (response.statsDiff.charm || 0),
      wealth: attrs.wealth + (response.statsDiff.wealth || 0),
    };

    // Determine if world changed
    const nextWorld = response.newWorld ? response.newWorld : currentWorld;

    const newEvent: LifeEvent = {
      age: currentAge,
      content: response.events.join('\n'),
      statChanges: response.statsDiff,
      world: nextWorld // The event leads to this world state
    };

    setGameState(prev => ({
      ...prev,
      age: currentAge + 1,
      world: nextWorld,
      attributes: newAttributes,
      history: [...prev.history, newEvent],
      loading: false,
      isGameOver: !response.isAlive || currentAge >= 200 // Cap increased for cultivation/mythology potential
    }));
  };

  const handleNextYear = useCallback(() => {
    if (gameState.loading || gameState.isGameOver) return;
    processYear(
        gameState.age, 
        gameState.world, 
        gameState.attributes, 
        gameState.history, 
        gameState.talents,
        chatHistory
    );
  }, [gameState, chatHistory]);

  const handleSendMessage = async (msg: string) => {
      const newMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          content: msg,
          timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, newMsg]);
      setIsChatLoading(true);

      // Get narrator response
      const lastEventContent = gameState.history.length > 0 
        ? gameState.history[gameState.history.length - 1].content 
        : "出生";

      const replyText = await chatWithNarrator(
          msg, 
          gameState.age, 
          gameState.world, 
          gameState.attributes,
          lastEventContent
      );

      const replyMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'narrator',
          content: replyText,
          timestamp: Date.now()
      };

      setChatHistory(prev => [...prev, replyMsg]);
      setIsChatLoading(false);
  };

  const restart = () => {
    setChatHistory([]);
    setGameState(prev => ({ ...prev, isPlaying: false, age: -1, history: [] }));
  };

  if (!gameState.isPlaying) {
    return <SetupScreen onStart={startGame} />;
  }

  const worldConfig = WORLD_CONFIGS[gameState.world];

  return (
    <div className={`h-screen flex flex-col md:flex-row overflow-hidden transition-colors duration-1000 bg-gradient-to-br ${worldConfig.bgGradient} relative`}>
      
      {/* Sidebar / Topbar for Stats */}
      <div className="w-full md:w-80 flex-shrink-0 z-20 md:h-full p-4 md:p-6 bg-gray-900/60 backdrop-blur-sm border-b md:border-r border-gray-700 flex flex-col transition-all duration-500">
        <div className="flex justify-between items-center mb-6">
            <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">当前世界</div>
                <h1 className={`text-2xl font-serif-sc font-bold transition-colors duration-500 ${worldConfig.color} drop-shadow-md`}>{worldConfig.name}</h1>
            </div>
            <div className="text-sm px-3 py-1 rounded-full bg-gray-800 border border-gray-600 text-gray-200 font-mono">
                {gameState.age} 岁
            </div>
        </div>
        
        <AttributePanel attributes={gameState.attributes} />
        
        <div className="mt-6 hidden md:block flex-1">
            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">当前天赋</h4>
            <div className="flex flex-wrap gap-2">
                {gameState.talents.map(t => (
                    <span key={t} className="px-2 py-1 text-xs rounded bg-gray-800 border border-gray-600 text-gray-300 shadow-sm">{t}</span>
                ))}
            </div>
        </div>

        <div className="mt-auto pt-6 hidden md:flex flex-col gap-3">
             {gameState.isGameOver ? (
                 <button 
                    onClick={restart}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-all"
                 >
                    人生重开
                 </button>
             ) : (
                 <div className="flex gap-2">
                    <button 
                        id="next-year-btn"
                        onClick={handleNextYear}
                        disabled={gameState.loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white rounded-lg font-bold shadow-lg transition-all"
                    >
                        {gameState.loading ? '推演中...' : '下一年'}
                    </button>
                 </div>
             )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
         <EventLog history={gameState.history} world={gameState.world} loading={gameState.loading} />
         
         {/* Floating Chat Button (Desktop & Mobile) */}
         {!gameState.isGameOver && (
             <button
               onClick={() => setChatOpen(true)}
               className="absolute bottom-24 md:bottom-8 right-4 md:right-8 bg-indigo-600 hover:bg-indigo-500 text-white p-3 md:p-4 rounded-full shadow-2xl z-40 transition-transform transform hover:scale-110 flex items-center justify-center"
               title="与旁白对话"
             >
                <span className="text-2xl">💬</span>
                {chatHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-900"></span>
                )}
             </button>
         )}
         
         {/* Mobile Sticky Action Bar */}
         <div className="md:hidden p-4 bg-gray-900/90 border-t border-gray-700 backdrop-blur pb-8 z-30">
            {gameState.isGameOver ? (
                 <button 
                    onClick={restart}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-bold shadow-lg"
                 >
                    人生重开
                 </button>
            ) : (
                <div className="flex gap-3">
                    <button 
                        onClick={handleNextYear}
                        disabled={gameState.loading}
                        className="w-full py-3 bg-indigo-600 disabled:bg-gray-700 text-white rounded-lg font-bold shadow-lg"
                    >
                        {gameState.loading ? '推演中...' : '下一年'}
                    </button>
                </div>
            )}
         </div>
      </div>
      
      {/* Chat Panel Overlay */}
      <ChatPanel 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        messages={chatHistory} 
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
        world={gameState.world}
      />

      {/* Game Over Overlay */}
      {gameState.isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-gray-900 border border-gray-600 p-8 rounded-2xl shadow-2xl max-w-sm text-center transform scale-100 transition-all">
                  <h2 className="text-4xl font-serif-sc text-white mb-2">人生终结</h2>
                  <div className="text-xl text-gray-400 mb-6 font-serif-sc">享年 {gameState.age} 岁</div>
                  <div className="bg-gray-800 p-4 rounded-lg mb-8 text-left border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">最终世界: <span className={worldConfig.color}>{worldConfig.name}</span></p>
                      <p className="text-sm text-gray-500 italic border-t border-gray-700 pt-2 mt-2">
                          "{gameState.history[gameState.history.length - 1]?.content.split('\n')[0].slice(0, 60)}..."
                      </p>
                  </div>
                  <button 
                    onClick={restart}
                    className="w-full px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                  >
                    再次轮回
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}