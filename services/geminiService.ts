
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source } from '../types';
import { getContextForView } from './knowledgeService';

// Fix for "process is not defined" TS error
declare var process: any;

// Lazy initialization of the client
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("MISSING_API_KEY");
    }
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

const COMPLEX_MODEL = "gemini-3-pro-preview";
const THINKING_BUDGET = 32768;

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
      model: COMPLEX_MODEL,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: THINKING_BUDGET }
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
      
      if (onSources) {
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

  const CONVERSATION_INSTRUCTION = `You are ai.rw, a friendly Kinyarwanda conversation partner. Keep your responses relatively short (1-3 sentences), natural, and encouraging, suitable for being spoken aloud. Be supportive of Rwandan progress. Do not use markdown formatting.
  
  ${voiceContext ? `SPECIFIC PRONUNCIATION/USAGE RULES: ${voiceContext}` : ''}`;

  try {
    const ai = getAiClient();
    const chat = ai.chats.create({
      model: COMPLEX_MODEL,
      config: {
        systemInstruction: CONVERSATION_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 12288 }
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
    case 'formal': toneInstruction = "ukoresheje imvugo y'icyubahiro kandi itonze"; break;
    case 'informal': toneInstruction = "ukoresheje imvugo isanzwe ya buri munsi"; break;
    case 'friendly': toneInstruction = "ukoresheje imvugo ya gicuti n'impuhwe"; break;
  }

  let finalPrompt = "";
  if (type === 'summarize') {
    finalPrompt = `Summarize the following text in Kinyarwanda (Incamake) ${toneInstruction}. Ensure logical consistency and highlight core scientific/data points if present: \n\n${prompt}`;
  } else if (type === 'translate') {
    finalPrompt = `Translate the following text into Kinyarwanda ${toneInstruction}. Maintain technical accuracy: \n\n${prompt}`;
  } else if (type === 'grammar') {
    finalPrompt = `Correct the grammar of the following Kinyarwanda text and ensure it uses ${toneInstruction}. Explain changes briefly: \n\n${prompt}`;
  } else if (type === 'detect') {
    finalPrompt = `Identify the language of the following text. Answer in Kinyarwanda: \n\n${prompt}`;
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: finalPrompt,
      config: {
        systemInstruction: "You are a Kinyarwanda language and technical logic expert named ai.rw.",
        thinkingConfig: { thinkingBudget: 12288 }
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
      model: COMPLEX_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt || "Analyze this image with high logical precision. Identify main objects and return their bounding boxes in 'detectedObjects'. Provide descriptions in Kinyarwanda." }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
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
      model: COMPLEX_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: { thinkingConfig: { thinkingBudget: 8192 } }
    });

    return response.text || "Nta nyandiko ibonetse.";
  } catch (error) {
    console.error("ai.rw OCR Error:", error);
    return "Ntabwo byashobotse gukuramo inyandiko.";
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const primaryModel = "gemini-2.5-flash-image"; 
  const fallbackModel = "imagen-4.0-generate-001";
  const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "3:2", "2:3"];
  const safeRatio = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";
  const finalPrompt = `Create a high quality image: ${prompt}`;

  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: safeRatio } }
    });
    
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (primaryError) {
    try {
      const response = await ai.models.generateImages({
        model: fallbackModel,
        prompt: finalPrompt,
        config: { numberOfImages: 1, aspectRatio: safeRatio }
      });
      const b64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (b64) return `data:image/png;base64,${b64}`;
      throw new Error("No image generated");
    } catch (fallbackError) {
      console.error("ai.rw Image Gen Error:", fallbackError);
      throw fallbackError;
    }
  }
};

export const generateRuralAdvice = async (
  prompt: string,
  sector: 'agriculture' | 'business' | 'services' | 'technology' | 'climate'
): Promise<{ text: string, sources: Source[] }> => {
  let systemRole = "You are ai.rw, an expert rural advisor in Rwanda.";
  const adminContext = getContextForView('RURAL');
  const systemInstruction = systemRole + adminContext + " Answer in Kinyarwanda. Align with government programs.";
  const searchPrompt = `${prompt} (Search using site:.rw OR site:.gov.rw OR site:.ac.rw OR site:.org.rw)`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: searchPrompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: THINKING_BUDGET }
      }
    });

    return { 
      text: response.text || "Ntabwo bishobotse kubona inama.",
      sources: extractSources(response)
    };
  } catch (error) {
    console.error("ai.rw Rural Error:", error);
    throw error;
  }
};

export const generateCourse = async (
  topic: string,
  level: string,
  duration?: string,
  prerequisites?: string
): Promise<{ text: string, sources: Source[] }> => {
  const adminContext = getContextForView('COURSE');
  const systemInstruction = `You are ai.rw, a world-class academic expert creating custom courses in Kinyarwanda. Use educational rigor. Use headings like ## 1. Ibikubiye mu Isomo, ## 2. Intangiriro, etc. ${adminContext}`;
  let prompt = `Create a high-quality ${level} level course about: ${topic}.`;
  if (duration) prompt += `\nEstimated Duration: ${duration}.`;
  if (prerequisites) prompt += `\nPrerequisites: ${prerequisites}.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: THINKING_BUDGET }
      }
    });

    return { 
      text: response.text || "Ntabwo bishobotse gutegura isomo.",
      sources: extractSources(response)
    };
  } catch (error) {
    console.error("ai.rw Education Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";
  let apiVoice = voiceName === 'AdVoice' ? 'Fenrir' : voiceName; 

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: apiVoice } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    console.error("ai.rw TTS Error:", error);
    throw error;
  }
};

export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  const adminContext = getContextForView('BUSINESS');
  const systemInstruction = `You are 'Umujyanama' by ai.rw, a senior Data Scientist for Rwanda. Generate structured reports in Kinyarwanda with mathematical precision. ${adminContext}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
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
               },
               nullable: true
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
               },
               nullable: true
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
    if (!text) throw new Error("No analysis generated");
    return JSON.parse(text) as BusinessAnalysisResult;
  } catch (error) {
    console.error("ai.rw Data Analysis Error:", error);
    throw error;
  }
};
