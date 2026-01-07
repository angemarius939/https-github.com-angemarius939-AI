
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source, ModelConfig } from '../types';
import { getContextForView } from './knowledgeService';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "Wowe uri ai.rw, umufasha w'ubwenge mu Rwanda. Uri impuguke mu bumenyi n'ikoranabuhanga. Ugomba gusubiza mu Kinyarwanda gusa. Komeza ube umunyakuri kandi ushyigikire iterambere ry'u Rwanda. Iyo uvuze izina ryawe, vuga ai.rw.",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  thinkingBudget: 0
};

const getModelConfig = (): ModelConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  const stored = localStorage.getItem('ai_rw_model_config');
  return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
};

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === 'process.env.API_KEY' || key === 'undefined' || key === 'null') {
    return '';
  }
  return key;
};

const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  const firstBracket = str.indexOf('[');
  const lastBracket = str.lastIndexOf(']');
  let start = -1;
  let end = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const jsonCandidate = str.substring(start, end + 1).trim();
      JSON.parse(jsonCandidate);
      return jsonCandidate;
    } catch (e) {
      return str.replace(/```json/g, '').replace(/```/g, '').trim();
    }
  }
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

const extractSources = (response: any): Source[] => {
  const sources: Source[] = [];
  const candidates = response.candidates || [];
  if (candidates.length > 0) {
    const groundingMetadata = candidates[0].groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks || [];
    for (const chunk of chunks) {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "Inkomoko",
          uri: chunk.web.uri
        });
      }
    }
  }
  const uniqueSources = new Map<string, Source>();
  sources.forEach(s => uniqueSources.set(s.uri, s));
  return Array.from(uniqueSources.values());
};

const FAST_MODEL = "gemini-3-flash-preview"; 
const PRO_MODEL = "gemini-3-pro-preview";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const ai = new GoogleGenAI({ apiKey });
  const config = getModelConfig();
  const context = getContextForView('CHAT');

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: newMessage }] }
  ];

  try {
    const resultStream = await ai.models.generateContentStream({
      model: FAST_MODEL,
      contents,
      config: {
        systemInstruction: config.systemInstruction + context,
        temperature: config.temperature,
      }
    });

    let fullText = "";
    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
      if (onSources && c.candidates?.[0]?.groundingMetadata) {
         onSources(extractSources(c));
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw error;
  }
};

export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const context = getContextForView('BUSINESS');
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Analyze this data: ${input}` }] }],
    config: {
      systemInstruction: `Uri umusesenguzi wa ai.rw. Tanga isesengura mu Kinyarwanda. Return valid JSON only. ${context}`,
      responseMimeType: "application/json",
      temperature: 0.1, 
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
  return JSON.parse(cleanJsonString(response.text || "{}"));
};

export const generateRuralAdvice = async (query: string, sector: string): Promise<{ text: string, sources: Source[] }> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const context = getContextForView('RURAL');
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Sector: ${sector}. Query: ${query}` }] }],
    config: {
      systemInstruction: `Uri umujyanama mu by'icyaro wa ai.rw. Tanga inama zifatika mu Kinyarwanda. ${context}`,
    }
  });
  return { text: response.text || "", sources: extractSources(response) };
};

export const generateCourse = async (topic: string, level: string, duration: string, prerequisites: string): Promise<{ text: string, sources: Source[] }> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const context = getContextForView('COURSE');
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Topic: ${topic}` }] }],
    config: {
      systemInstruction: `Uri umwalimu kuri ai.rw. Kora isomo rirambuye mu Kinyarwanda. ${context}`,
    }
  });
  return { text: response.text || "", sources: extractSources(response) };
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      // Fix: Corrected typo from responseModalalities to responseModalities
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateTextAnalysis = async (prompt: string, type: string, tone: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Task: ${type}. Text: ${prompt}` }] }],
    config: { systemInstruction: "Uri impuguke mu rurimi rw'Ikinyarwanda kuri ai.rw." }
  });
  return response.text || "";
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<ImageAnalysisResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: prompt || "Sesengura iyi foto mu Kinyarwanda." }
      ]
    },
    config: {
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
  return JSON.parse(cleanJsonString(response.text || "{}"));
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Kuramo umwandiko mu Kinyarwanda cyangwa izindi ndimi." }
      ]
    }
  });
  return response.text || "";
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: aspectRatio as any } },
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image data");
};

export const generateConversationResponse = async (history: any[], newMessage: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  const contents = [...history, { role: 'user', parts: [{ text: newMessage }] }];
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents,
    config: { systemInstruction: "Uri ijwi rya ai.rw. Subiza mu Kinyarwanda gito kandi gishimishije." }
  });
  return response.text || "";
};
