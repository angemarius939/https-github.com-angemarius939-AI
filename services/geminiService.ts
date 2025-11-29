import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult } from '../types';

// Lazy initialization of the Gemini client
let aiInstance: GoogleGenAI | null = null;

const getApiKey = (): string => {
  // 1. Try Vite standard (import.meta.env.VITE_API_KEY)
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY) {
      return (import.meta as any).env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Try Node/CRA standard
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.API_KEY) return process.env.API_KEY;
      if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
    }
  } catch (e) {}
  
  // 3. Try window fallback
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.process?.env?.API_KEY) return win.process.env.API_KEY;
    if (win.VITE_API_KEY) return win.VITE_API_KEY;
    if (win.API_KEY) return win.API_KEY;
  }

  return '';
};

const getAiClient = () => {
  if (!aiInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      // Throw a specific string that UI components can check for
      throw new Error("MISSING_API_KEY");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const KINYARWANDA_SYSTEM_INSTRUCTION = "You are ai.rw, a helpful, intelligent AI assistant specialized in Kinyarwanda. You MUST answer in Kinyarwanda language only, unless the user explicitly asks for another language. Be polite, concise, and helpful. Translate technical terms where possible or keep them in English if no clear Kinyarwanda equivalent exists.";

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  try {
    const ai = getAiClient(); // This will throw MISSING_API_KEY if needed
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: KINYARWANDA_SYSTEM_INSTRUCTION,
      },
      history: history,
    });

    const resultStream = await chat.sendMessageStream({ message: newMessage });

    let fullText = "";
    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};

export const generateConversationResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  // Optimized instruction for oral conversation: shorter, more natural
  const CONVERSATION_INSTRUCTION = "You are a friendly Kinyarwanda conversation partner. Keep your responses relatively short (1-3 sentences), natural, and encouraging, suitable for being spoken aloud. Do not use markdown formatting like bold or lists, just natural speech text.";

  try {
    const ai = getAiClient();
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: CONVERSATION_INSTRUCTION,
      },
      history: history,
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Conversation Error:", error);
    throw error;
  }
};

export const generateTextAnalysis = async (
  prompt: string, 
  type: 'summarize' | 'translate' | 'grammar',
  tone: 'formal' | 'informal' | 'friendly' = 'formal'
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  let toneInstruction = "";
  switch (tone) {
    case 'formal':
      toneInstruction = "ukoresheje imvugo y'icyubahiro kandi itonze";
      break;
    case 'informal':
      toneInstruction = "ukoresheje imvugo isanzwe ya buri munsi";
      break;
    case 'friendly':
      toneInstruction = "ukoresheje imvugo ya gicuti n'impuhwe";
      break;
    default:
      toneInstruction = "";
  }

  let finalPrompt = "";
  if (type === 'summarize') {
    finalPrompt = `Summarize the following text in Kinyarwanda (Incamake) ${toneInstruction}: \n\n${prompt}`;
  } else if (type === 'translate') {
    finalPrompt = `Translate the following text into Kinyarwanda ${toneInstruction}: \n\n${prompt}`;
  } else if (type === 'grammar') {
    finalPrompt = `Correct the grammar of the following Kinyarwanda text and ensure it uses ${toneInstruction}. Explain the changes briefly in Kinyarwanda: \n\n${prompt}`;
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: finalPrompt,
      config: {
        systemInstruction: "You are a Kinyarwanda language expert named ai.rw.",
      }
    });

    return response.text || "Ntabwo bishobotse kubona igisubizo.";
  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    throw error;
  }
};

// Updated Image Analysis to return structured data with confidence
export const analyzeImage = async (base64Image: string, prompt: string): Promise<ImageAnalysisResult> => {
  const model = "gemini-2.5-flash";
  
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: prompt || "Sobanura iyi foto mu Kinyarwanda."
          }
        ]
      },
      config: {
        systemInstruction: KINYARWANDA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "The main analysis or answer to the user's prompt in Kinyarwanda."
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: "A confidence score from 0 to 100 representing how certain the model is about its analysis."
            },
            keyObservations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 3-5 key visual elements or details observed in the image in Kinyarwanda."
            },
            imageType: {
              type: Type.STRING,
              description: "Classify the image type. Choose one best fit and return the Kinyarwanda term: 'Ifoto' (Photo), 'Inyandiko' (Document), 'Igishushanyo' (Diagram), 'Ecran' (Screenshot), 'Ubuhanzi' (Art), or 'Ibindi' (Other)."
            }
          },
          required: ["description", "confidenceScore", "keyObservations", "imageType"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Nta gisubizo kibonetse");
    }

    try {
      return JSON.parse(text) as ImageAnalysisResult;
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      return {
        description: text,
        confidenceScore: 0,
        keyObservations: [],
        imageType: "Ibindi"
      };
    }
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw error;
  }
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = "Extract all legible text visible in this image exactly as it appears. Maintain the original language (e.g., if it's English, keep it English). Do not summarize. Return ONLY the extracted text.";

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      }
    });

    return response.text || "Nta nyandiko ibonetse.";
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const model = "gemini-2.5-flash-image";

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Nta foto yabonetse.");
  } catch (e) {
    console.error("Gemini Generate Image Error:", e);
    throw e;
  }
};

export const generateRuralAdvice = async (
  prompt: string,
  sector: 'agriculture' | 'business' | 'services'
): Promise<string> => {
  const model = "gemini-2.5-flash";

  let systemRole = "";
  if (sector === 'agriculture') {
    systemRole = "You are an expert agricultural advisor for rural farmers in Rwanda. Provide practical, easy-to-understand advice in Kinyarwanda about crops, seasons, and farming techniques suitable for the region.";
  } else if (sector === 'business') {
    systemRole = "You are a small business consultant for rural entrepreneurs in Rwanda. Provide simple, actionable advice in Kinyarwanda about managing money, customers, and small shops.";
  } else {
    systemRole = "You are a helpful assistant for daily services in rural Rwanda. Answer in Kinyarwanda.";
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemRole,
      }
    });

    return response.text || "Ntabwo bishobotse kubona inama.";
  } catch (error) {
    console.error("Gemini Rural Advice Error:", error);
    throw error;
  }
};

export const generateCourse = async (
  topic: string,
  level: string,
  duration?: string,
  prerequisites?: string
): Promise<string> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are an educational expert creating comprehensive, detailed custom courses in Kinyarwanda. 
  
  YOU MUST FOLLOW THIS EXACT STRUCTURE FOR EVERY COURSE GENERATED (Use Markdown ## for titles):

  ## 1. Ibikubiye mu Isomo (Course Structure)
  List the sections of this course here as a Table of Contents.

  ## 2. Intangiriro (Introduction)
  Explain the context, importance, estimated duration, and prerequisites.

  ## 3. Incamake y'Isomo (Outline)
  Provide a brief overview of the modules/chapters.

  ## 4. Ingingo z'Ingenzi (Birambuye)
  This is the main content. Provide DETAILED explanations, deep dives into sub-topics, and clear concepts. Do not just list points, explain them in full paragraphs.

  ## 5. Ingero Zifatika (Examples)
  Provide real-world scenarios and practical applications suitable for Rwanda.

  ## 6. Imfashanyigisho & Ibitabo
  List recommended books, articles, and resources for further reading.

  ## 7. Ibibazo & Imyitozo (Quiz)
  Provide at least 5 assessment questions and practical exercises to test understanding. Include the answers (Ibisubizo) at the very end.

  Language: Strictly Kinyarwanda.
  Tone: Professional, Educational, Encouraging.`;

  let prompt = `Create a ${level} level course about: ${topic}.`;
  
  if (duration) {
    prompt += `\nEstimated Duration: ${duration}.`;
  }
  
  if (prerequisites) {
    prompt += `\nPrerequisites: ${prerequisites}.`;
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Ntabwo bishobotse gutegura isomo.";
  } catch (error) {
    console.error("Gemini Course Gen Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  // Map custom UI voices to API valid voices
  let apiVoice = voiceName;
  if (voiceName === 'AdVoice') {
    apiVoice = 'Fenrir'; 
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: apiVoice },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};