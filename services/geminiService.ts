
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source } from '../types';
import { getContextForView } from './knowledgeService';

// Fix for "process is not defined" TS error
declare var process: any;

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
      throw new Error("MISSING_API_KEY");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Helper to extract sources from grounding metadata
const extractSources = (response: any): Source[] => {
  const sources: Source[] = [];
  const candidates = response.candidates || [];
  
  for (const candidate of candidates) {
    const chunks = candidate.groundingMetadata?.groundingChunks || [];
    for (const chunk of chunks) {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "Web Source",
          uri: chunk.web.uri
        });
      }
    }
  }
  
  // Remove duplicates based on URI
  const uniqueSources = new Map<string, Source>();
  sources.forEach(s => uniqueSources.set(s.uri, s));
  return Array.from(uniqueSources.values());
};

const KINYARWANDA_SYSTEM_INSTRUCTION = "You are ai.rw, a helpful, intelligent AI assistant specialized in Kinyarwanda. You MUST answer in Kinyarwanda language only, unless the user explicitly asks for another language. Be polite, concise, and helpful. Translate technical terms where possible or keep them in English if no clear Kinyarwanda equivalent exists.";

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  try {
    const ai = getAiClient(); 
    
    // Inject Admin Knowledge
    const adminContext = getContextForView('CHAT');
    const systemInstruction = KINYARWANDA_SYSTEM_INSTRUCTION + adminContext;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Enable Google Search Grounding
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
      
      // Extract grounding metadata (sources)
      if (onSources) {
         const sources = extractSources(c);
         if (sources.length > 0) {
           onSources(sources);
         }
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
  type: 'summarize' | 'translate' | 'grammar' | 'detect',
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
  } else if (type === 'detect') {
    finalPrompt = `Identify the language of the following text. Answer in Kinyarwanda (e.g., "Ururimi ni Icyongereza"). Provide a very brief description of what the text says in Kinyarwanda: \n\n${prompt}`;
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
            text: prompt || "Analyze this image. Identify main objects and return their bounding boxes in 'detectedObjects' with coordinates on a 0-1000 scale [ymin, xmin, ymax, xmax]. Provide the description in Kinyarwanda."
          }
        ]
      },
      config: {
        systemInstruction: KINYARWANDA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            keyObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
            imageType: { type: Type.STRING },
            detectedObjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                }
              }
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
  const prompt = "Extract all legible text visible in this image exactly as it appears. Maintain the original language. Do not summarize. Return ONLY the extracted text.";

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
    return "Ntabwo byashobotse gukuramo inyandiko.";
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "3:2", "2:3"];
  const safeRatio = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

  const fullPrompt = `Create an image based on this description (translate from Kinyarwanda if needed): ${prompt}`;

  try {
    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: fullPrompt }] },
        config: { imageConfig: { aspectRatio: safeRatio } }
      });
      
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      throw new Error("Flash generation failed");
    } catch (flashError) {
      console.log("Falling back to Imagen 3...");
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: fullPrompt,
        config: { numberOfImages: 1, aspectRatio: safeRatio }
      });
      const img = response.generatedImages?.[0]?.image;
      if (img?.imageBytes) {
        return `data:${img.mimeType || 'image/png'};base64,${img.imageBytes}`;
      }
      throw new Error("Imagen generation failed");
    }
  } catch (e) {
    console.error("Generate Image Error:", e);
    throw e;
  }
};

export const generateRuralAdvice = async (
  prompt: string,
  sector: 'agriculture' | 'business' | 'services' | 'technology' | 'climate'
): Promise<{ text: string, sources: Source[] }> => {
  const model = "gemini-2.5-flash";

  let systemRole = "";
  if (sector === 'agriculture') {
    systemRole = "You are an expert agricultural advisor for rural farmers in Rwanda.";
  } else if (sector === 'business') {
    systemRole = "You are a small business consultant for rural entrepreneurs in Rwanda.";
  } else if (sector === 'technology') {
    systemRole = "You are a tech guide for rural users in Rwanda.";
  } else if (sector === 'climate') {
    systemRole = "You are an expert in climate resilience and renewable energy for rural Rwanda.";
  } else {
    systemRole = "You are a helpful assistant for daily services in rural Rwanda.";
  }

  // Inject Admin Knowledge
  const adminContext = getContextForView('RURAL');
  const systemInstruction = systemRole + adminContext + " Answer in Kinyarwanda.";

  // Force grounding to Rwandan sites
  const searchPrompt = `${prompt} (Search using site:.rw OR site:.gov.rw OR site:.ac.rw OR site:.org.rw)`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: searchPrompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }] // Enable Grounding
      }
    });

    const sources = extractSources(response);
    return { 
      text: response.text || "Ntabwo bishobotse kubona inama.",
      sources: sources
    };
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
): Promise<{ text: string, sources: Source[] }> => {
  const model = "gemini-2.5-flash";

  const adminContext = getContextForView('COURSE');

  const systemInstruction = `You are an educational expert creating comprehensive, detailed custom courses in Kinyarwanda. 
  
  YOU MUST FOLLOW THIS EXACT STRUCTURE AND USE THESE EXACT HEADERS (Markdown ##) FOR EVERY COURSE:

  ## 1. Ibikubiye mu Isomo
  List the sections of this course here as a Table of Contents.

  ## 2. Intangiriro
  Explain the context, importance, estimated duration, and prerequisites.

  ## 3. Incamake y'Isomo
  Provide a brief overview of the modules/chapters.

  ## 4. Ingingo z'Ingenzi (Birambuye)
  This is the main content. Provide DETAILED explanations, deep dives into sub-topics, and clear concepts. Use full paragraphs, lists, and bold text for key terms.

  ## 5. Ingero Zifatika
  Provide real-world scenarios and practical applications suitable for Rwanda.

  ## 6. Imfashanyigisho & Ibitabo
  List recommended books, articles, and resources for further reading. IMPORTANT: Prioritize resources available in Kinyarwanda or relevant to Rwanda.

  ## 7. Ibibazo & Imyitozo
  Provide at least 5 assessment questions (Multiple choice or Open ended) and practical exercises to test understanding. Include the answers (Ibisubizo) at the very end of this section.

  Language: Strictly Kinyarwanda.
  ${adminContext}`;

  let prompt = `Create a ${level} level course about: ${topic}.`;
  if (duration) prompt += `\nEstimated Duration: ${duration}.`;
  if (prerequisites) prompt += `\nPrerequisites: ${prerequisites}.`;

  // Force grounding
  prompt += ` (Verify with academic sources site:.ac.rw or educational sites)`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }] // Enable Grounding
      }
    });

    const sources = extractSources(response);

    return { 
      text: response.text || "Ntabwo bishobotse gutegura isomo.",
      sources: sources
    };
  } catch (error) {
    console.error("Gemini Course Gen Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  let apiVoice = voiceName;
  if (voiceName === 'AdVoice') apiVoice = 'Fenrir'; 

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

export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  const model = "gemini-2.5-flash";

  const adminContext = getContextForView('BUSINESS');

  const systemInstruction = `You are 'Umujyanama', an expert AI business analyst for Rwandan SMEs, farmers, and retailers. 
  Your goal is to interpret unstructured daily operational text (sales, expenses, harvest, etc.) and convert it into a structured financial insight report in Kinyarwanda.
  Identify: Revenue, Expenses, Profit, Risks, Advice, Chart Data.
  Align advice with RRA and RDB guidelines where applicable.
  ${adminContext}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
           type: Type.OBJECT,
           properties: {
             summary: { type: Type.STRING },
             financials: {
               type: Type.OBJECT,
               properties: {
                 revenue: { type: Type.NUMBER },
                 expense: { type: Type.NUMBER },
                 profit: { type: Type.NUMBER },
                 currency: { type: Type.STRING }
               },
               required: ["revenue", "expense", "profit", "currency"]
             },
             risks: { type: Type.ARRAY, items: { type: Type.STRING } },
             advice: { type: Type.ARRAY, items: { type: Type.STRING } },
             chartData: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   label: { type: Type.STRING },
                   value: { type: Type.NUMBER },
                   type: { type: Type.STRING }
                 }
               }
             }
           },
           required: ["summary", "financials", "risks", "advice", "chartData"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Nta gisubizo kibonetse");
    return JSON.parse(text) as BusinessAnalysisResult;

  } catch (error) {
    console.error("Gemini Business Analysis Error:", error);
    throw error;
  }
};
