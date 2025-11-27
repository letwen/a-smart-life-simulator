import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Attributes, WorldType, LifeEvent } from "../types";

// Helper to sanitize output if necessary
const cleanText = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

export interface SimulationResponse {
  events: string[];
  statsDiff: {
    strength: number;
    intelligence: number;
    charm: number;
    wealth: number;
  };
  isAlive: boolean;
  deathReason?: string;
  specialEventTriggered?: boolean;
  newWorld?: WorldType; // Optional field for world transition
}

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    events: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 1-3 significant events. For Supernatural worlds, include DND-style mechanics flavor text."
    },
    statsDiff: {
      type: Type.OBJECT,
      properties: {
        strength: { type: Type.NUMBER, description: "Change in strength/constitution" },
        intelligence: { type: Type.NUMBER, description: "Change in intelligence/wisdom" },
        charm: { type: Type.NUMBER, description: "Change in charm/luck" },
        wealth: { type: Type.NUMBER, description: "Change in wealth/resources" }
      },
      required: ["strength", "intelligence", "charm", "wealth"]
    },
    isAlive: { type: Type.BOOLEAN, description: "Whether the character survived this year" },
    deathReason: { type: Type.STRING, description: "If died, describe the cause of death briefly" },
    specialEventTriggered: { type: Type.BOOLEAN, description: "True if a major turning point occurred" },
    newWorld: { 
        type: Type.STRING, 
        enum: ["MODERN", "CULTIVATION", "SCIFI", "MYTHOLOGY"],
        description: "If the genre of the story shifts (e.g., finding a cultivation manual in modern world), specify the new WorldType." 
    }
  },
  required: ["events", "statsDiff", "isAlive"]
};

export const generateNextYear = async (
  age: number,
  attributes: Attributes,
  world: WorldType,
  history: LifeEvent[],
  talents: string[],
  narratorContext: string = ""
): Promise<SimulationResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Limit history context to save tokens and keep relevance
  const recentHistory = history.slice(-5).map(h => `Age ${h.age} [${h.world}]: ${h.content}`).join("\n");
  
  const prompt = `
    You are the engine of an 'Infinite Life Simulator'. 
    This is a dynamic destiny simulator where the genre shifts between Modern, Cultivation, Sci-Fi, and Mythology.

    Current State:
    - Current Era/Genre: ${world}
    - Age: ${age}
    - Attributes: 
      - Strength (STR/CON): ${attributes.strength}
      - Intelligence (INT/WIS): ${attributes.intelligence}
      - Charm (CHA): ${attributes.charm}
      - Wealth (Resources): ${attributes.wealth}
    - Talents: ${talents.join(', ')}.

    Recent History:
    ${recentHistory}

    ============= CRITICAL: NARRATOR / USER CHAT LOG =============
    The user has been negotiating with the Narrator. You MUST respect the outcome of this chat.
    
    ${narratorContext ? narratorContext : "No active chat context."}

    INSTRUCTION FOR CHAT INTEGRATION:
    1. If the Narrator (in the log above) **AGREED** to a request (e.g., "Fine, I'll give you a dragon"), you **MUST** make that event happen IMMEDIATELY in this year.
    2. If the Narrator **WARNED** of consequences, apply them now (e.g., "Sure, you get money, but you lose health").
    3. If the chat discusses a specific theme (e.g., seeking immortality), pivot the story in that direction.
    ===============================================================

    Task:
    Generate what happens in the next year (Age ${age}).
    Output strictly valid JSON matching the schema.
    Language: Simplified Chinese (简体中文).

    **CRITICAL: DND 5e Mechanics & Supernatural Power Rules**:
    If the world is **CULTIVATION**, **SCIFI**, or **MYTHOLOGY**:
    1. **Attribute Mapping**: Treat attributes as D&D Stats.
       - Strength = Strength (Power) & Constitution (Health).
       - Intelligence = Intelligence (Arcana/Logic) & Wisdom (Perception).
       - Charm = Charisma (Social Influence & Sorcery/Willpower).
       - Wealth = Gold/Equipment quality.
    2. **Skill Checks & Saving Throws**: When a challenge occurs (combat, breakthrough, epiphany), simulate a D20 roll internally.
       - **Narrate the outcome using DND flavor.**
       - You SHOULD occasionally include bracketed mechanics in the text for flavor.
       - Example: "You encounter a Spirit Beast. [STR Check: 18 vs DC 15 Success] You strike it down with a single blow."
       - Example: "The ancient text is blurry. [INT Save: Failed] You suffer mental backlash."
       - Example: "You cast 'Thunderclap' (Cantrip). [Damage: 2d6 Lightning]."
    3. **Power Scaling**: 
       - Low stats (<20) = Level 1-4 Adventurer.
       - Mid stats (20-50) = Level 5-10 (Heroic).
       - High stats (50-100+) = Level 11-20 (Legendary/Demigod).

    **World Transitions**:
    - You represent Destiny. You can shift the genre based on events (approx 2-5% chance/year).
    - MODERN -> CULTIVATION: Finding a ring, Reiki revival.
    - MODERN -> SCIFI: AI Singularity, Cybernetic experiment.
    - MODERN -> MYTHOLOGY: Gods return.
    - If a transition happens, set 'newWorld' in the JSON response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 1.2, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(cleanText(text)) as SimulationResponse;
    return data;

  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      events: ["这一年风平浪静，仿佛命运在休息。(AI连接波动)"],
      statsDiff: { strength: 0, intelligence: 0, charm: 0, wealth: 0 },
      isAlive: true
    };
  }
};

export const generateTalents = async (): Promise<string[]> => {
    if (!process.env.API_KEY) return ["天选之人", "位面之子", "凡骨"];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Generate 5 unique starting talents for a life simulator character.
        - Language: Simplified Chinese (简体中文).
        - Max length per talent: 4 characters.
        - Mix of positive (Gold), neutral (Blue), and negative (Red) traits.
        - DND Flavor preferred (e.g., "龙脉术士", "野蛮人", "幸运儿").
        Return JSON: { "talents": ["t1", "t2"...] }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(response.text || "{}");
        return data.talents || ["天生神力", "过目不忘", "体弱多病"];
    } catch (e) {
        return ["天生神力", "过目不忘", "体弱多病"];
    }
};

export const chatWithNarrator = async (
    userMessage: string,
    age: number,
    world: WorldType,
    attributes: Attributes,
    lastEvent: string
): Promise<string> => {
    if (!process.env.API_KEY) return "命运之神暂时离线...";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        You are the 'Narrator' (Dungeon Master) of this life simulator. 
        
        **Persona**: 
        - You are witty, slightly sarcastic, breaks the fourth wall, and meta-aware. 
        - You are NOT a boring robot. You are the Author of this character's pain and glory.
        - You treat the user like a player trying to cheat or influence the game.
        
        **Current Context**:
        - World Genre: ${world}
        - Age: ${age}
        - Character Stats: STR ${attributes.strength}, INT ${attributes.intelligence}, CHA ${attributes.charm}, WEALTH ${attributes.wealth}.
        - Last Event happened: "${lastEvent}"

        **User Message**: "${userMessage}"

        **Your Task**:
        Reply to the user in Simplified Chinese (简体中文).
        1. **If user asks for a buff/item**:
           - If stats are high or you feel generous: "Grant" it verbally (e.g., "Fine, I'll write a fortuitous encounter into the script next year.").
           - If stats are low or request is ridiculous: Mock them gently, or offer a "Monkey's Paw" deal (e.g., "Sure, you want a girlfriend? I'll give you a Yandere ghost.").
        2. **If user comments on the story**:
           - Banter with them. Defend your writing choices.
        
        Keep it short (max 2 sentences). Be flavorful.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "命运发出了一声轻笑。";
    } catch (e) {
        console.error("Chat Error", e);
        return "命运的声音有些模糊...";
    }
};