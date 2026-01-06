
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source } from '../types';
import { getContextForView } from './knowledgeService';

let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === '' || apiKey === 'undefined' || apiKey === 'null') {
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

const FAST_MODEL = "gemini-3-flash-preview"; 
const LOGIC_MODEL = "gemini-3-pro-preview"; 

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
      try {
        const text = c.text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      } catch (e) {
        // Safe access if text getter fails on metadata-only chunks
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
    const msg = error?.message || "";
    if (msg.includes("API key not valid") || msg.includes("403") || msg.includes("400")) {
      throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
};

export const generateConversationResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const voiceContext = getContextForView('VOICE_TRAINING');
    const chat = ai.chats.create({
      model: FAST_MODEL,
      config: {
        systemInstruction: `You are ai.rw, a friendly Kinyarwanda conversation partner. Keep your responses short (1-3 sentences), natural, and encouraging. Do not use markdown.\n\n${voiceContext}`,
        thinkingConfig: { thinkingBudget: 0 }
      },
      history: history,
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "";
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
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
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<ImageAnalysisResult> => {
  try {
    const ai = getAiClient();
    const rawContext = getContextForView('IMAGE_TOOLS'); 
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt || "Analyze this image with precision. Identify main objects and return their bounding boxes in 'detectedObjects'. Provide descriptions in Kinyarwanda." }
        ]
      },
      config: {
        systemInstruction: `${KINYARWANDA_SYSTEM_INSTRUCTION}\n${rawContext}`,
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

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Extract all legible text. Maintain original language. Return ONLY text." }
        ]
      }
    });
    return response.text || "Nta nyandiko ibonetse.";
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: `Create high quality: ${prompt}` }] },
      config: { imageConfig: { aspectRatio: aspectRatio as any } },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const generateRuralAdvice = async (query: string, sector: string): Promise<{ text: string, sources: Source[] }> => {
  try {
    const ai = getAiClient();
    const context = getContextForView('RURAL');
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: query,
      config: {
        systemInstruction: `You are an expert advisor for rural development in Rwanda specializing in ${sector}. ${KINYARWANDA_SYSTEM_INSTRUCTION} ${context}`,
        tools: [{ googleSearch: {} }]
      }
    });
    return { text: response.text || "", sources: extractSources(response) };
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const generateCourse = async (topic: string, level: string, duration: string, prerequisites: string): Promise<{ text: string, sources: Source[] }> => {
  try {
    const ai = getAiClient();
    const context = getContextForView('COURSE');
    const response = await ai.models.generateContent({
      model: LOGIC_MODEL,
      contents: `Generate course: ${topic}`,
      config: {
        systemInstruction: `You are an expert educator. Create a course on ${topic} (${level}, ${duration}). ${KINYARWANDA_SYSTEM_INSTRUCTION} ${context}`,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 24000 }
      }
    });
    return { text: response.text || "", sources: extractSources(response) };
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  try {
    const ai = getAiClient();
    const context = getContextForView('BUSINESS');
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: input,
      config: {
        systemInstruction: `You are a professional business analyst for ai.rw. ${KINYARWANDA_SYSTEM_INSTRUCTION} ${context}`,
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
                properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER }, type: { type: Type.STRING } }
              }
            }
          },
          required: ["summary", "isFinancial", "risks", "advice", "chartData"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    if (error?.message?.includes("API key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
};
