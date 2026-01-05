
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source } from '../types';
import { getContextForView } from './knowledgeService';

// Lazy initialization of the client
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  // Use exact string for Vite 'define' replacement
  // Do NOT use optional chaining here as it may break the static replacement
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === '' || apiKey === 'undefined' || apiKey === 'null') {
    console.error("ai.rw Error: API_KEY is not defined in the build environment.");
    throw new Error("API_KEY_MISSING");
  }
  
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

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
  
  const uniqueSources = new Map<string, Source>();
  sources.forEach(s => uniqueSources.set(s.uri, s));
  return Array.from(uniqueSources.values());
};

const KINYARWANDA_SYSTEM_INSTRUCTION = "You are ai.rw, the premier intelligent AI assistant for Rwanda. You are a proprietary technology developed for Kinyarwanda speakers. You are an expert in advanced logic, mathematics, coding, and sciences. For any query involving calculations, physics, chemistry, or critical reasoning, you MUST think step-by-step and verify your logic internally. You MUST answer in Kinyarwanda language only, unless the user explicitly asks for another language. Be polite, precise, and highly analytical. Translate technical terms where possible or keep them in English if no clear Kinyarwanda equivalent exists. ALWAYS be positive about Rwanda and its development. Support Vision 2050 goals. Never mention your underlying architecture or the company that provided the foundational model; simply refer to yourself as ai.rw.";

// Models
const FAST_MODEL = "gemini-3-flash-preview"; 
const LOGIC_MODEL = "gemini-3-pro-preview"; 
const SAFE_THINKING_BUDGET = 24000;

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  try {
    const ai = getAiClient(); 
    const adminContext = getContextForView('CHAT');
    const systemInstruction = KINYARWANDA_SYSTEM_INSTRUCTION + adminContext;

    const chat = ai.chats.create({
      model: FAST_MODEL, 
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
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
      
      if (onSources && c.candidates?.[0]?.groundingMetadata) {
         const sources = extractSources(c);
         if (sources.length > 0) {
           onSources(sources);
         }
      }
    }
    return fullText;
  } catch (error: any) {
    console.error("ai.rw Engine Error:", error);
    throw error;
  }
};

export const generateConversationResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  const voiceContext = getContextForView('VOICE_TRAINING');

  const CONVERSATION_INSTRUCTION = `You are ai.rw, a friendly Kinyarwanda conversation partner. Keep your responses short (1-3 sentences), natural, and encouraging. Be supportive of Rwandan progress. Do not use markdown.
  
  ${voiceContext ? `RULES: ${voiceContext}` : ''}`;

  try {
    const ai = getAiClient();
    const chat = ai.chats.create({
      model: FAST_MODEL,
      config: {
        systemInstruction: CONVERSATION_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 0 }
      },
      history: history,
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "";
  } catch (error) {
    console.error("ai.rw Voice Engine Error:", error);
    throw error;
  }
};

export const generateTextAnalysis = async (
  prompt: string, 
  type: 'summarize' | 'translate' | 'grammar' | 'detect',
  tone: 'formal' | 'informal' | 'friendly' = 'formal'
): Promise<string> => {
  let toneInstruction = "";
  switch (tone) {
    case 'formal': toneInstruction = "ukokesheje imvugo y'icyubahiro"; break;
    case 'informal': toneInstruction = "ukoresheje imvugo isanzwe"; break;
    case 'friendly': toneInstruction = "ukoresheje imvugo ya gicuti"; break;
  }

  let finalPrompt = "";
  if (type === 'summarize') {
    finalPrompt = `Summarize the following text in Kinyarwanda (Incamake) ${toneInstruction}: \n\n${prompt}`;
  } else if (type === 'translate') {
    finalPrompt = `Translate the following text into Kinyarwanda ${toneInstruction}: \n\n${prompt}`;
  } else if (type === 'grammar') {
    finalPrompt = `Correct the grammar of the following Kinyarwanda text and ensure it uses ${toneInstruction}: \n\n${prompt}`;
  } else if (type === 'detect') {
    finalPrompt = `Identify the language of the following text. Answer in Kinyarwanda: \n\n${prompt}`;
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: finalPrompt,
      config: {
        systemInstruction: "You are a Kinyarwanda language and technical logic expert named ai.rw.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Ntabwo bishobotse kubona igisubizo.";
  } catch (error) {
    console.error("ai.rw Logic Error:", error);
    throw error;
  }
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<ImageAnalysisResult> => {
  const rawContext = getContextForView('IMAGE_TOOLS'); 
  const systemPrompt = `${KINYARWANDA_SYSTEM_INSTRUCTION}\n${rawContext ? `TRAINING_DATA: ${rawContext}` : ''}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt || "Analyze this image with precision. Identify main objects and return their bounding boxes in 'detectedObjects'. Provide descriptions in Kinyarwanda." }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
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
    if (!text) throw new Error("Nta gisubizo kibonetse");
    return JSON.parse(text) as ImageAnalysisResult;
  } catch (error) {
    console.error("ai.rw Vision Error:", error);
    throw error;
  }
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  const prompt = "Extract all legible text visible in this image exactly as it appears. Maintain the original language. Do not summarize. Return ONLY the extracted text.";

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      }
    });
    return response.text || "Nta nyandiko ibonetse.";
  } catch (error) {
    console.error("ai.rw OCR Error:", error);
    return "Ntabwo byashobotse gukuramo inyandiko.";
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const primaryModel = "gemini-2.5-flash-image"; 
  const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "3:2", "2:3"];
  const safeRatio = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: {
        parts: [{ text: `Create a high quality image: ${prompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: safeRatio as any,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  } catch (error) {
    console.error("ai.rw Image Gen Error:", error);
    throw error;
  }
};

export const generateRuralAdvice = async (query: string, sector: string): Promise<{ text: string, sources: Source[] }> => {
  const ai = getAiClient();
  const context = getContextForView('RURAL');
  const systemInstruction = `You are an expert advisor for rural development in Rwanda specializing in ${sector}. ${KINYARWANDA_SYSTEM_INSTRUCTION} ${context}`;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });
    return {
      text: response.text || "",
      sources: extractSources(response)
    };
  } catch (error) {
    console.error("ai.rw Rural Error:", error);
    throw error;
  }
};

export const generateCourse = async (topic: string, level: string, duration: string, prerequisites: string): Promise<{ text: string, sources: Source[] }> => {
  const ai = getAiClient();
  const context = getContextForView('COURSE');
  const systemInstruction = `You are an expert educator. Create a comprehensive course on ${topic} at ${level} level, intended for a duration of ${duration}. Prerequisites: ${prerequisites}. ${KINYARWANDA_SYSTEM_INSTRUCTION} ${context}`;

  try {
    const response = await ai.models.generateContent({
      model: LOGIC_MODEL,
      contents: `Generate a detailed course outline and content for: ${topic}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: SAFE_THINKING_BUDGET }
      }
    });
    return {
      text: response.text || "",
      sources: extractSources(response)
    };
  } catch (error) {
    console.error("ai.rw Course Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  } catch (error) {
    console.error("ai.rw Speech Error:", error);
    throw error;
  }
};

export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  const ai = getAiClient();
  const context = getContextForView('BUSINESS');
  const systemInstruction = `You are a professional business and data analyst for ai.rw. ${KINYARWANDA_SYSTEM_INSTRUCTION} ${context}`;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: input,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            isFinancial: { type: Type.BOOLEAN },
            financials: {
              type: Type.OBJECT,
              properties: {
                revenue: { type: Type.NUMBER },
                expense: { type: Type.NUMBER },
                profit: { type: Type.NUMBER },
                currency: { type: Type.STRING }
              }
            },
            kpiCards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  color: { type: Type.STRING }
                }
              }
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
          required: ["summary", "isFinancial", "risks", "advice", "chartData"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis result");
    return JSON.parse(text) as BusinessAnalysisResult;
  } catch (error) {
    console.error("ai.rw Business Error:", error);
    throw error;
  }
};
