
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GEMINI_CHAT_MODEL, LUNA_SYSTEM_PROMPT_TEMPLATE } from '../constants';
import { ChatMessage } from "../types";

// Get API key from environment variables
// @ts-ignore
const API_KEY = window?.ENV?.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
try {
   if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set. Gemini Service will not function.");
    // Potentially throw an error or handle this state in the UI
  } else {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
  // This error should be surfaced to the user appropriately.
}


export const initLunaChat = (symbolicName: string): Chat | null => {
  if (!ai) {
    console.error("Gemini AI not initialized. Cannot create chat.");
    return null;
  }
  const systemInstruction = LUNA_SYSTEM_PROMPT_TEMPLATE.replace('[SYMBOLIC_NAME_PLACEHOLDER]', symbolicName);
  
  try {
    const chat = ai.chats.create({
      model: GEMINI_CHAT_MODEL,
      config: {
        systemInstruction: systemInstruction,
        // Optional: Add other configs like temperature if needed
        // temperature: 0.7, 
      },
      // History could be pre-filled if needed, but for a new session, it's empty.
      history: [], 
    });
    return chat;
  } catch (error) {
    console.error("Error creating Gemini chat:", error);
    return null;
  }
};

export const sendUserMessageToLuna = async (
  chat: Chat,
  userMessageText: string,
  _currentHistory: ChatMessage[] // For context, though Chat object handles history internally
): Promise<string | null> => {
  if (!ai) {
    console.error("Gemini AI not initialized. Cannot send message.");
    return null;
  }

  try {
    // The `chat` object automatically maintains history.
    // We don't need to pass currentHistory to `sendMessage` itself,
    // but it's good to be aware of what the AI has seen.
    const response: GenerateContentResponse = await chat.sendMessage({ message: userMessageText });
    
    // Extract text response
    const lunaResponseText = response.text;
    if (lunaResponseText) {
      return lunaResponseText;
    } else {
      console.error("Luna's response was empty or not in the expected format.");
      return "I'm sorry, I seem to be having a little trouble forming a response right now. Could you try saying that again?";
    }
  } catch (error) {
    console.error("Error sending message to Luna (Gemini API):", error);
    // Provide a user-friendly error message
    return "I'm having a bit of trouble connecting at the moment. Please check your connection or try again in a little while.";
  }
};
