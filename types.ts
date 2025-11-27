export enum WorldType {
  MODERN = 'MODERN',
  CULTIVATION = 'CULTIVATION',
  SCIFI = 'SCIFI',
  MYTHOLOGY = 'MYTHOLOGY'
}

export interface Attributes {
  strength: number;   // 体质/力量
  intelligence: number; // 智力/悟性
  charm: number;      // 颜值/魅力
  wealth: number;     // 家境/气运
}

export interface LifeEvent {
  age: number;
  content: string;
  isSpecial?: boolean;
  statChanges?: Partial<Attributes>;
  world: WorldType; // The world state when this event occurred
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'narrator';
  content: string;
  timestamp: number;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  age: number;
  world: WorldType;
  attributes: Attributes;
  history: LifeEvent[];
  loading: boolean;
  talents: string[];
}

export const WORLD_CONFIGS: Record<WorldType, { name: string; description: string; color: string; bgGradient: string }> = {
  [WorldType.MODERN]: {
    name: "现代都市",
    description: "普通的现代生活，或者是商业大亨，或者是默默无闻的打工人。",
    color: "text-blue-400",
    bgGradient: "from-blue-900 to-gray-900"
  },
  [WorldType.CULTIVATION]: {
    name: "修仙世界",
    description: "逆天改命，渡劫飞升。炼气、筑基、金丹、元婴...",
    color: "text-emerald-400",
    bgGradient: "from-emerald-900 to-gray-900"
  },
  [WorldType.SCIFI]: {
    name: "赛博未来",
    description: "高科技低生活，义体改造，星际殖民，AI觉醒。",
    color: "text-purple-400",
    bgGradient: "from-purple-900 to-gray-900"
  },
  [WorldType.MYTHOLOGY]: {
    name: "远古神话",
    description: "神魔并起，洪荒巨兽。在诸神的注视下求生。",
    color: "text-amber-400",
    bgGradient: "from-amber-900 to-gray-900"
  }
};