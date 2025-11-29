import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult } from '../types';

// Initialize Gemini Client
// We assume process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const KINYARWANDA_SYSTEM_INSTRUCTION = "You are ai.rw, a helpful, intelligent AI assistant specialized in Kinyarwanda. You MUST answer in Kinyarwanda language only, unless the user explicitly asks for another language. Be polite, concise, and helpful. Translate technical terms where possible or keep them in English if no clear Kinyarwanda equivalent exists.";

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
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
};

export const generateConversationResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  // Optimized instruction for oral conversation: shorter, more natural
  const CONVERSATION_INSTRUCTION = "You are a friendly Kinyarwanda conversation partner. Keep your responses relatively short, natural, and encouraging, suitable for being spoken aloud. Do not use markdown formatting like bold or lists if possible, just natural speech text.";

  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: CONVERSATION_INSTRUCTION,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
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

  const response = await ai.models.generateContent({
    model: model,
    contents: finalPrompt,
    config: {
      systemInstruction: "You are a Kinyarwanda language expert named ai.rw.",
    }
  });

  return response.text || "Ntabwo bishobotse kubona igisubizo.";
};

// Updated Image Analysis to return structured data with confidence
export const analyzeImage = async (base64Image: string, prompt: string): Promise<ImageAnalysisResult> => {
  const model = "gemini-2.5-flash";
  
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
    // Fallback if JSON parsing fails
    return {
      description: text,
      confidenceScore: 0,
      keyObservations: [],
      imageType: "Ibindi"
    };
  }
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  // We do NOT use the Kinyarwanda system instruction here to avoid forced translation.
  // We want the raw text exactly as it appears.
  const prompt = "Extract all legible text visible in this image exactly as it appears. Maintain the original language (e.g., if it's English, keep it English). Do not summarize. Return ONLY the extracted text.";

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
};

export const generateImage = async (prompt: string): Promise<string> => {
  const model = "gemini-2.5-flash-image";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
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
    console.error(e);
    throw new Error("Habaye ikibazo mu guhanga ifoto.");
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

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      systemInstruction: systemRole,
    }
  });

  return response.text || "Ntabwo bishobotse kubona inama.";
};

export const generateCourse = async (
  topic: string,
  level: string,
  duration?: string,
  prerequisites?: string
): Promise<string> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are an educational expert creating short, custom courses in Kinyarwanda. 
  Create a structured mini-course on the provided topic. 
  Structure it with the following sections using these exact Kinyarwanda headings (Use Markdown formatting like # for main headings):
  
  # 1. Intangiriro (Introduction)
  Include estimated duration and prerequisites here if provided.
  
  # 2. Ingingo z'ingenzi (Key Points)
  Bullet points of the main concepts.
  
  # 3. Urugero rufatika (Practical Example)
  Real world application context suitable for Rwanda.
  
  # 4. Ibitabo n'Inyandiko (Recommended Books)
  List 2-3 specific books, manuals, or reports recommended for reading. Prioritize resources available in Kinyarwanda or relevant to the region.
  
  # 5. Aho gushakira amakuru (Other Resources)
  List websites, organizations, or tools for further learning.
  
  # 6. Ibibazo n'Imyitozo (Quiz & Exercises)
  Provide 3-5 specific questions (Ibibazo) to test understanding, and 1 practical exercise (Umwitozo).
  
  Keep language simple, educational, and strictly in Kinyarwanda.`;

  let prompt = `Create a ${level} level course about: ${topic}.`;
  
  if (duration) {
    prompt += `\nEstimated Duration: ${duration}.`;
  }
  
  if (prerequisites) {
    prompt += `\nPrerequisites: ${prerequisites}.`;
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text || "Ntabwo bishobotse gutegura isomo.";
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  // Map custom UI voices to API valid voices
  let apiVoice = voiceName;
  if (voiceName === 'AdVoice') {
    apiVoice = 'Fenrir'; // Using Fenrir as a proxy for a promotional/deeper voice
  }

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
};