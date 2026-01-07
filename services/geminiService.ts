
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source, ModelConfig } from '../types';
import { getContextForView } from './knowledgeService';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "You are ai.rw, the premier intelligent AI assistant for Rwanda. You are a proprietary technology developed for Kinyarwanda speakers. You are an expert in advanced logic, mathematics, coding, and sciences. You MUST answer in Kinyarwanda language only, unless the user explicitly asks for another language. ALWAYS be positive about Rwanda and its development. Never mention your underlying architecture; simply refer to yourself as ai.rw.",
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

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const cleanJsonString = (str: string): string => {
  // Remove markdown code blocks if present
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
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

const FAST_MODEL = "gemini-3-flash-preview"; 
const PRO_MODEL = "gemini-3-flash-preview"; // Switching to Flash for better stability on free tier
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  try {
    const ai = getAiClient(); 
    const config = getModelConfig();
    const adminContext = getContextForView('CHAT');
    const systemInstruction = config.systemInstruction + adminContext;

    const chat = ai.chats.create({
      model: FAST_MODEL, 
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        thinkingConfig: config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined
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
      } catch (e) {}
      if (onSources && c.candidates?.[0]?.groundingMetadata) {
         const sources = extractSources(c);
         if (sources.length > 0) onSources(sources);
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
  try {
    const ai = getAiClient();
    const config = getModelConfig();
    const adminContext = getContextForView('VOICE_TRAINING');
    const systemInstruction = config.systemInstruction + adminContext;

    const chat = ai.chats.create({
      model: FAST_MODEL,
      config: {
        systemInstruction: systemInstruction,
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK
      },
      history: history,
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "Ntabwo bishobotse.";
  } catch (error: any) {
    console.error("ai.rw Engine Error:", error);
    throw error;
  }
};

export const generateTextAnalysis = async (
  prompt: string, 
  type: 'summarize' | 'translate' | 'grammar' | 'detect',
  tone: 'formal' | 'informal' | 'friendly' = 'formal'
): Promise<string> => {
  const config = getModelConfig();
  let toneInstruction = "";
  switch (tone) {
    case 'formal': toneInstruction = "ukokesheje imvugo y'icyubahiro"; break;
    case 'informal': toneInstruction = "ukoresheje imvugo isanzwe"; break;
    case 'friendly': toneInstruction = "ukoresheje imvugo ya gicuti"; break;
  }
  let finalPrompt = "";
  if (type === 'summarize') finalPrompt = `Summarize in Kinyarwanda ${toneInstruction}: \n\n${prompt}`;
  else if (type === 'translate') finalPrompt = `Translate into Kinyarwanda ${toneInstruction}: \n\n${prompt}`;
  else if (type === 'grammar') finalPrompt = `Correct Kinyarwanda grammar ${toneInstruction}: \n\n${prompt}`;
  else if (type === 'detect') finalPrompt = `Identify the language of this text. Answer in Kinyarwanda: \n\n${prompt}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: finalPrompt,
      config: {
        systemInstruction: "You are a Kinyarwanda language expert named ai.rw.",
        temperature: config.temperature,
      }
    });
    return response.text || "Ntabwo bishobotse.";
  } catch (error: any) {
    throw error;
  }
};

export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  try {
    const ai = getAiClient();
    const config = getModelConfig();
    const context = getContextForView('BUSINESS');
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: input,
      config: {
        systemInstruction: `You are a professional business analyst for ai.rw. Answer in Kinyarwanda. ${config.systemInstruction} ${context}`,
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
  } catch (error: any) {
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error: any) {
    throw error;
  }
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<ImageAnalysisResult> => {
  try {
    const ai = getAiClient();
    const context = getContextForView('IMAGE_TOOLS'); 
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt || "Analyze image. Bounding boxes in 'detectedObjects'. Descriptions in Kinyarwanda." }
        ]
      },
      config: {
        systemInstruction: `You are ai.rw image expert.\n${context}`,
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
  } catch (error: any) {
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
          { text: "Extract text. Kinyarwanda preferred." }
        ]
      }
    });
    return response.text || "";
  } catch (error: any) {
    throw error;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: aspectRatio as any } },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error: any) {
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
        systemInstruction: `You are a rural advisor for Rwanda in ${sector}. Answer in Kinyarwanda. ${context}`,
        tools: [{ googleSearch: {} }]
      }
    });
    return { text: response.text || "", sources: extractSources(response) };
  } catch (error: any) {
    throw error;
  }
};

export const generateCourse = async (topic: string, level: string, duration: string, prerequisites: string): Promise<{ text: string, sources: Source[] }> => {
  try {
    const ai = getAiClient();
    const context = getContextForView('COURSE');
    const prompt = `Detailed educational course on: ${topic}. 
Urwego: ${level}, Igihe: ${duration}, Ibisabwa mbere: ${prerequisites}. 

Requirements: 
- Answer entirely in Kinyarwanda.
- Structure using Markdown with clear level 2 headers (##) for each main section.
- EVERY main section must start with a line like "## Section Name".
- Include a quiz section at the end.
- Act as a master world-class educator.
- Be highly descriptive and accurate.`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are an expert educator for ai.rw. Provide deep, factual, and structured educational material for Rwandans. Use consistent Markdown formatting with ## for sections. ${context}`,
        tools: [{ googleSearch: {} }]
      }
    });
    return { text: response.text || "Habaye ikibazo mu gutegura iri somo.", sources: extractSources(response) };
  } catch (error: any) {
    throw error;
  }
};
