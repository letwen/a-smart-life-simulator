import React, { useEffect, useRef } from 'react';
import { LifeEvent, WorldType, WORLD_CONFIGS } from '../types';

interface EventLogProps {
  history: LifeEvent[];
  world: WorldType;
  loading: boolean;
}

export const EventLog: React.FC<EventLogProps> = ({ history, world, loading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Current world color for loading state
  const currentWorldColor = WORLD_CONFIGS[world].color;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide relative min-h-[50vh]">
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        {history.length === 0 && (
            <div className="text-center text-gray-500 mt-20 italic">
                命运的齿轮准备开始转动...
            </div>
        )}
        
        {history.map((event, index) => {
            // Determine event specific styling based on the world it happened in
            const eventWorldConfig = WORLD_CONFIGS[event.world || WorldType.MODERN];
            const eventColor = eventWorldConfig.color;
            const isWorldChange = index > 0 && event.world !== history[index-1].world;

            return (
              <React.Fragment key={index}>
                  {isWorldChange && (
                      <div className="flex items-center justify-center my-8 animate-pulse">
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-1 opacity-50"></div>
                          <span className={`px-4 py-1 rounded-full border border-gray-600 bg-gray-900 text-xs font-bold uppercase tracking-widest ${eventColor}`}>
                             {eventWorldConfig.name} 开启
                          </span>
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-1 opacity-50"></div>
                      </div>
                  )}

                  <div className={`relative pl-8 md:pl-0 flex md:flex-row group animate-fade-in`}>
                    {/* Desktop Timeline Center Line */}
                    <div className="hidden md:flex flex-col items-center mr-8 w-16 flex-shrink-0">
                       <div className={`text-sm font-bold ${eventColor} mb-2 opacity-80`}>{event.age}岁</div>
                       <div className="h-full w-px bg-gray-700/50 group-last:bg-transparent"></div>
                    </div>

                    {/* Mobile Timeline Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-700/50 md:hidden ml-2"></div>
                    <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-gray-900 ${eventColor} bg-current md:hidden -ml-0.5 z-10`}></div>

                    <div className={`flex-1 p-5 rounded-xl border transition-all duration-300 ${
                        isWorldChange ? 'bg-gray-800 border-gray-500 shadow-lg' : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60'
                    }`}>
                       <div className="md:hidden text-xs font-bold text-gray-400 mb-1 flex justify-between">
                           <span>{event.age}岁</span>
                           {isWorldChange && <span className={eventColor}>{eventWorldConfig.name}</span>}
                       </div>
                       <p className="text-gray-200 font-serif-sc leading-relaxed whitespace-pre-line text-lg">
                         {event.content}
                       </p>
                       {event.statChanges && (
                         <div className="mt-3 flex flex-wrap gap-2 text-xs opacity-60">
                            {Object.entries(event.statChanges).map(([key, v]) => {
                                const val = v as number;
                                if(!val) return null;
                                return (
                                    <span key={key} className={val > 0 ? 'text-green-400' : 'text-red-400'}>
                                        {key === 'strength' ? '体质' : key === 'intelligence' ? '智力' : key === 'charm' ? '魅力' : '家境'} 
                                        {val > 0 ? '+' : ''}{val}
                                    </span>
                                )
                            })}
                         </div>
                       )}
                    </div>
                  </div>
              </React.Fragment>
            );
        })}
        
        {loading && (
          <div className="flex justify-center items-center p-8 animate-pulse">
             <span className={`text-xl font-serif-sc ${currentWorldColor}`}>
               时光流转中...
             </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};