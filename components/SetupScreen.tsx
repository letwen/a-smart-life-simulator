import React, { useState, useEffect } from 'react';
import { Attributes, WorldType } from '../types';
import { generateTalents } from '../services/geminiService';

interface SetupScreenProps {
  onStart: (attributes: Attributes, selectedTalents: string[]) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [points, setPoints] = useState(20);
  const [attributes, setAttributes] = useState<Attributes>({
    strength: 0,
    intelligence: 0,
    charm: 0,
    wealth: 0
  });
  const [availableTalents, setAvailableTalents] = useState<string[]>([]);
  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);
  const [loadingTalents, setLoadingTalents] = useState(true);

  // Initialize talents on mount
  useEffect(() => {
    const fetchTalents = async () => {
        const talents = await generateTalents();
        setAvailableTalents(talents);
        setLoadingTalents(false);
    };
    fetchTalents();
  }, []);

  const handleStatChange = (key: keyof Attributes, val: number) => {
    const diff = val - attributes[key];
    if (points - diff < 0) return;
    setAttributes(prev => ({ ...prev, [key]: val }));
    setPoints(prev => prev - diff);
  };

  const toggleTalent = (t: string) => {
    if (selectedTalents.includes(t)) {
        setSelectedTalents(prev => prev.filter(i => i !== t));
    } else {
        if (selectedTalents.length < 3) {
            setSelectedTalents(prev => [...prev, t]);
        }
    }
  };

  const handleStart = () => {
      onStart(attributes, selectedTalents);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 font-sans">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="text-center mb-10">
             <h1 className="text-4xl md:text-5xl font-serif-sc font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500">
                无限人生模拟器
            </h1>
            <p className="text-gray-400">万千世界，由你开启。你的命运可能会在现代、修仙、科技或神话之间流转。</p>
        </div>

        <div className="mb-8">
            <h2 className="text-xl font-serif-sc text-white mb-6 border-b border-gray-700 pb-2">1. 调整初始属性</h2>
            <div className="flex justify-between mb-4 bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">剩余点数</span>
                <span className={`text-xl font-bold ${points > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{points}</span>
            </div>
            <div className="space-y-5">
                {(['strength', 'intelligence', 'charm', 'wealth'] as const).map(attr => (
                <div key={attr} className="flex items-center gap-4 group">
                    <span className="w-16 text-gray-300 font-medium">{
                        attr === 'strength' ? '体质' : 
                        attr === 'intelligence' ? '智力' : 
                        attr === 'charm' ? '魅力' : '家境'
                    }</span>
                    <input
                    type="range"
                    min="0"
                    max="10"
                    value={attributes[attr]}
                    onChange={(e) => handleStatChange(attr, parseInt(e.target.value))}
                    className="flex-1 accent-indigo-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer group-hover:bg-gray-600 transition-colors"
                    />
                    <span className="w-8 text-right font-mono text-indigo-300">{attributes[attr]}</span>
                </div>
                ))}
            </div>
        </div>

        <div className="mb-10">
           <h2 className="text-xl font-serif-sc text-white mb-6 border-b border-gray-700 pb-2">2. 选择天赋 (最多3个)</h2>
           {loadingTalents ? (
               <div className="flex justify-center py-6">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
               </div>
           ) : (
               <div className="flex flex-wrap gap-3">
                   {availableTalents.map(t => (
                       <button
                         key={t}
                         onClick={() => toggleTalent(t)}
                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                             selectedTalents.includes(t) 
                             ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] transform scale-105' 
                             : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                         }`}
                       >
                           {t}
                       </button>
                   ))}
               </div>
           )}
        </div>

        <button
          onClick={handleStart}
          disabled={loadingTalents}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25"
        >
          开启轮回
        </button>
      </div>
    </div>
  );
};