import React from 'react';
import { Attributes } from '../types';

interface AttributePanelProps {
  attributes: Attributes;
  className?: string;
}

const StatBar = ({ label, value, colorClass }: { label: string; value: number; colorClass: string }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1 font-semibold tracking-wider text-gray-400 uppercase">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
      <div 
        className={`h-full ${colorClass} transition-all duration-500 ease-out`} 
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  </div>
);

export const AttributePanel: React.FC<AttributePanelProps> = ({ attributes, className }) => {
  return (
    <div className={`bg-gray-900/80 backdrop-blur-md p-6 rounded-xl border border-gray-700 shadow-xl ${className}`}>
      <h3 className="text-xl font-serif-sc font-bold mb-6 text-gray-100 border-b border-gray-700 pb-2">当前属性 (DND)</h3>
      <StatBar label="力量/体质 (STR/CON)" value={attributes.strength} colorClass="bg-red-500" />
      <StatBar label="智力/感知 (INT/WIS)" value={attributes.intelligence} colorClass="bg-blue-500" />
      <StatBar label="魅力 (CHA)" value={attributes.charm} colorClass="bg-pink-500" />
      <StatBar label="资产/幸运 (LUCK)" value={attributes.wealth} colorClass="bg-yellow-500" />
    </div>
  );
};