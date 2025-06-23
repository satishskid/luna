
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GEMINI_CHAT_MODEL, LUNA_SYSTEM_PROMPT_TEMPLATE } from '../constants';
import { ChatMessage } from "../types";

// Get API key from environment variables
const getApiKey = (): string | null => {
  // Check Vite environment variables first (VITE_ prefix is required for Vite)
  const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (viteKey && viteKey !== 'undefined' && viteKey.trim() !== '') {
    console.log('Using VITE_GEMINI_API_KEY from Vite environment');
    return viteKey.trim();
  }
  
  // Fallback to process.env for build time
  const processKey = process.env?.GEMINI_API_KEY;
  if (processKey && processKey !== 'undefined' && processKey.trim() !== '') {
    console.log('Using GEMINI_API_KEY from process environment');
    return processKey.trim();
  }
  
  // Check for window.ENV in browser
  if (typeof window !== 'undefined') {
    const windowKey = (window as any).ENV?.GEMINI_API_KEY;
    if (windowKey && windowKey !== 'undefined' && windowKey.trim() !== '') {
      console.log('Using GEMINI_API_KEY from window.ENV');
      return windowKey.trim();
    }
  }
  
  console.error('No API key found in any environment source');
  return null;
};

const API_KEY = getApiKey();

let ai: GoogleGenAI | null = null;
try {
   if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set. Gemini Service will not function.");
    console.log("Checked sources: import.meta.env, process.env, window.ENV");
  } else {
    console.log("Initializing GoogleGenAI with API key");
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log("GoogleGenAI initialized successfully");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}


export const initLunaChat = (symbolicName: string): Chat | null => {
  console.log("initLunaChat called for:", symbolicName);
  
  if (!ai) {
    console.error("Gemini AI not initialized. Cannot create chat.");
    return null;
  }
  
  const systemInstruction = LUNA_SYSTEM_PROMPT_TEMPLATE.replace('[SYMBOLIC_NAME_PLACEHOLDER]', symbolicName);
  console.log("System instruction prepared, length:", systemInstruction.length);
  
  try {
    console.log("Creating chat with model:", GEMINI_CHAT_MODEL);
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
    console.log("Chat created successfully");
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
  console.log("sendUserMessageToLuna called with:", userMessageText);
  
  if (!ai) {
    console.error("Gemini AI not initialized. Cannot send message.");
    return "I'm sorry, I'm having trouble connecting to my AI service. Please check that the API key is configured correctly.";
  }

  try {
    console.log("Sending message to Gemini API...");
    // The `chat` object automatically maintains history.
    const response: GenerateContentResponse = await chat.sendMessage({ message: userMessageText });
    console.log("Received response from Gemini API:", response);
    
    // Extract text response
    const lunaResponseText = response.text;
    console.log("Extracted text response:", lunaResponseText);
    
    if (lunaResponseText) {
      return lunaResponseText;
    } else {
      console.error("Luna's response was empty or not in the expected format.");
      return "I'm sorry, I seem to be having a little trouble forming a response right now. Could you try saying that again?";
    }
  } catch (error) {
    console.error("Error sending message to Luna (Gemini API):", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    // Provide a user-friendly error message
    return "I'm having a bit of trouble connecting at the moment. Please check your connection or try again in a little while.";
  }
};
