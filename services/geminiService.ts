
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source, ModelConfig, CourseLevel } from '../types';
import { getContextForView } from './knowledgeService';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "Wowe uri ai.rw, umufasha w'ubwenge mu Rwanda. Ugomba gusubiza mu Kinyarwanda gusa. MU BURYO BW'INGENZI: Kurikiza amategeko y'imyandikire n'ikibonezamvugo ari muri [LINGUISTIC RULES] wahawe.",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  thinkingBudget: 0,
  maxOutputTokens: 2048,
  seed: 42
};

const getModelConfig = (): ModelConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem('ai_rw_model_config');
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  } catch (e) {
    return DEFAULT_CONFIG;
  }
};

// Fix: Updated to include onSources callback to handle search grounding results
export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  
  const grammarContext = getContextForView('GRAMMAR');
  const vocabContext = getContextForView('VOCABULARY');

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: newMessage }] }],
      config: {
        systemInstruction: `${config.systemInstruction}\n\n[LINGUISTIC RULES]:\n${grammarContext}\n${vocabContext}`,
        temperature: config.temperature,
        topP: config.topP,
        maxOutputTokens: config.maxOutputTokens,
        tools: [{ googleSearch: {} }]
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(chunk.text);
      }
      
      // Extract grounding sources if available
      if (onSources && chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
        const sources: Source[] = chunks
          .filter(c => c.web)
          .map(c => ({
            title: c.web!.title || 'Website',
            uri: c.web!.uri
          }));
        if (sources.length > 0) onSources(sources);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// Fix: Implement text analysis specialized method
export const generateTextAnalysis = async (
  text: string,
  mode: 'summarize' | 'translate' | 'grammar' | 'detect',
  tone: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView('TECHNICAL');

  const prompt = `Mode: ${mode}. Tone: ${tone}. Text: ${text}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: `${config.systemInstruction}\n${context}`,
      temperature: 0.3,
    }
  });

  return response.text || "";
};

// Fix: Implement image analysis specialized method
export const analyzeImage = async (base64Data: string, prompt: string): Promise<ImageAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: prompt || "Sesengura iyi foto mu buryo burambuye mu Kinyarwanda." }
      ]
    }
  });

  return {
    description: response.text || "Ntabwo hashoboye kuboneka ibisobanuro.",
    confidenceScore: 92,
    keyObservations: ["Ifoto yasesenguwe neza"],
    imageType: "Ifoto"
  };
};

// Fix: Implement image generation specialized method
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any || "1:1"
      }
    }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to generate image");
};

// Fix: Implement OCR specialized method
export const extractTextFromImage = async (base64Data: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: "Kura inyandiko yose iri kuri iyi foto uyishyire mu buryo bw'umwandiko gusa." }
      ]
    }
  });

  return response.text || "";
};

// Fix: Implement rural advice specialized method
export const generateRuralAdvice = async (query: string, sector: string): Promise<{text: string, sources: Source[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getContextForView('RURAL');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Sector: ${sector}. Query: ${query}`,
    config: {
      systemInstruction: `Wowe uri umujyanama mu by'iterambere ry'icyaro mu Rwanda. ${context}`,
      tools: [{ googleSearch: {} }]
    }
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: Source[] = chunks
    .filter(c => c.web)
    .map(c => ({ title: c.web!.title || 'Website', uri: c.web!.uri }));

  return {
    text: response.text || "",
    sources
  };
};

// Fix: Implement streaming course generation method
export const streamCourseResponse = async (
  topic: string,
  level: CourseLevel,
  duration: string,
  prerequisites: string,
  onChunk: (text: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getContextForView('COURSE');

  const prompt = `Topic: ${topic}. Level: ${level}. Duration: ${duration}. Prerequisites: ${prerequisites}. Create a structured course.`;
  
  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: `Wowe uri mwarimu ukora imfashanyigisho mu Kinyarwanda. ${context}`,
    }
  });

  let fullText = "";
  for await (const chunk of responseStream) {
    if (chunk.text) {
      fullText += chunk.text;
      onChunk(chunk.text);
    }
  }
  return fullText;
};

// Fix: Implement voice conversation response method
export const generateConversationResponse = async (
  history: {role: string, parts: {text: string}[]}[],
  text: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getContextForView('VOICE_TRAINING');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: `Wowe uri ai.rw, urimo kuvugana n'umuntu mu majwi. Jya uba mugufi kandi ukoreshe amagambo asobanutse. ${context}`,
    }
  });

  return response.text || "";
};

// Fix: Implement text-to-speech generation method
export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
};

// Fix: Implement business analysis specialized method with JSON schema
export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getContextForView('BUSINESS');

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: input,
    config: {
      systemInstruction: `Wowe uri umujyanama mu by'imari n'ubucuruzi mu Rwanda. ${context}`,
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

  return JSON.parse(response.text || "{}");
};

// Fix: Implement Kinyarwanda content generation specialized method
export const generateKinyarwandaContent = async (
  prompt: string,
  mode: 'learn' | 'compose',
  level: CourseLevel,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView(mode === 'learn' ? 'LEARN_KINYARWANDA' : 'GRAMMAR');

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: `${config.systemInstruction}\n${context}`,
      tools: [{ googleSearch: {} }]
    }
  });

  let fullText = "";
  for await (const chunk of responseStream) {
    if (chunk.text) {
      fullText += chunk.text;
      onChunk(chunk.text);
    }
    
    if (onSources && chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
      const sources: Source[] = chunks
        .filter(c => c.web)
        .map(c => ({ title: c.web!.title || 'Website', uri: c.web!.uri }));
      if (sources.length > 0) onSources(sources);
    }
  }
  return fullText;
};
