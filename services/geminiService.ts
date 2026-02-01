
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageAnalysisResult, BusinessAnalysisResult, Source, ModelConfig } from '../types';
import { getContextForView } from './knowledgeService';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "Wowe uri ai.rw, umufasha w'ubwenge mu Rwanda. Ugomba gusubiza mu Kinyarwanda gusa. Komeza ube umunyakuri kandi ushyigikire iterambere ry'u Rwanda. Tanga amakuru agezweho kandi ashingiye ku bimenyetso. MU BURYO BW'INGENZI: Kurikiza amategeko y'imyandikire n'ikibonezamvugo ari mu bumenyi (Knowledge Base) wahawe.",
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

const cleanJsonString = (str: string | undefined): string => {
  if (!str) return "{}";
  const trimmed = str.trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  
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
    return trimmed.substring(start, end + 1);
  }
  
  return trimmed.replace(/```json/g, '').replace(/```/g, '').trim();
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
  return sources;
};

const FAST_MODEL = 'gemini-3-flash-preview'; 
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  
  // Inject grammar and general training context
  const grammarContext = getContextForView('GRAMMAR');
  const vocabContext = getContextForView('VOCABULARY');
  const chatContext = getContextForView('CHAT');

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: newMessage }] }
  ];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: FAST_MODEL,
      contents,
      config: {
        systemInstruction: `${config.systemInstruction}\n\n[LINGUISTIC RULES]:\n${grammarContext}\n${vocabContext}\n\n[INTERFACE CONTEXT]:\n${chatContext}`,
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        maxOutputTokens: config.maxOutputTokens,
        thinkingConfig: { thinkingBudget: config.thinkingBudget },
        seed: config.seed,
        tools: [{ googleSearch: {} }]
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
      if (onSources && chunk.candidates?.[0]?.groundingMetadata) {
        onSources(extractSources(chunk));
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw error;
  }
};

export const generateKinyarwandaContent = async (
  prompt: string,
  type: 'learning' | 'composition',
  level: string,
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView('LEARN_KINYARWANDA');
  const grammar = getContextForView('GRAMMAR');
  
  const levelText = level === 'beginner' ? 'Abatangiye (Beginner)' : level === 'intermediate' ? 'Abaziho bike (Intermediate)' : 'Ababizi cyane (Advanced)';

  const systemInstruction = `Uri impuguke mu rurimi rw'Ikinyarwanda, amateka, n'ubuvanganzo bw'u Rwanda. 
  Mubyo ukora byose, ugomba gushingira ku mabwiriza n'inyandiko ziva mu nzego z'uburezi n'inteko y'umuco.
  
  URWEGO RWO KWIGA: ${levelText}

  [LATEST GRAMMAR RULES]:
  ${grammar}

  AMABWIRIZA Y'INYONGERA (DETAILED REQUIREMENTS):
  1. **Kurambura (Extreme Detail)**: Isomo rigomba kuba rirambuye cyane. Ntugasubize muri make. Buri gice kigomba kuba gifite amapaji n'ibisobanuro bihagije.
  2. **Ingero z'Ubuzima (Rwandan Examples)**: Shyiramo ingero zifatika zigaragara mu mibereho y'abanyarwanda (nka: ku isoko rya Kimironko, mu murenge wa Nyarugenge, mu mirimo y'ubuhinzi mu cyaro, cyangwa mu buzima bw'umujyi wa Kigali).
  3. **Guhenganya (Tailoring)**:
     - Niba ari **Abatangiye**: Koresha imvugo yoroheje, ibisobanuro bifatika, n'ingero zoroheje cyane.
     - Niba ari **Abaziho bike**: Winjire mu mizi y'amategeko y'ururimi n'ubuvanganzo busanzwe.
     - Niba ari **Ababizi cyane**: Koresha Ikinyarwanda gishituye, kigaragaza ubuhanga buhanitse, amategeko yimbitse, n'ubusesenguzi bukomeye.
  4. **Icons**: Ugomba gukoresha emojis nyinshi kugira ngo isomo rishimishe.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: FAST_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `${systemInstruction}\n${context}`,
        temperature: 0.8,
        tools: [{ googleSearch: {} }]
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
      if (onSources && chunk.candidates?.[0]?.groundingMetadata) {
        onSources(extractSources(chunk));
      }
    }
    return fullText;
  } catch (error) {
    console.error("Kinyarwanda Content Error:", error);
    throw error;
  }
};

// ... remaining service methods updated to include grammar/context injection ...
export const streamCourseResponse = async (
  topic: string, 
  level: string, 
  duration: string, 
  prerequisites: string,
  onChunk: (text: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView('COURSE');
  const grammar = getContextForView('GRAMMAR');
  
  const levelDescription = level === 'beginner' ? 'Abatangiye (Beginners) - koresha imvugo yoroheje, ibisobanuro byumvikana vuba, ingero zifatika zo mu Rwanda' : 
                          level === 'intermediate' ? 'Abaziho bike (Intermediate) - koresha imvugo irimo ubumenyi buvunnye gato, amasesengura asanzwe' : 
                          'Ababizi cyane (Advanced) - koresha imvugo ya gihanga (technical terms), amategeko yimbitse, n\'amasesengura akomeye yo mu Rwanda';

  const prompt = `Tegura isomo rirambuye cyane (extremely detailed course) rikoresheje Ikinyarwanda.
  
  INGINGO: ${topic}
  URWEGO: ${levelDescription}
  IGIHE CYO KWIGA: ${duration}
  IBISABWA MBERE: ${prerequisites}

  [GRAMMAR RULES TO FOLLOW]:
  ${grammar}`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: FAST_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `Uri umwalimu w'impuguke kuri ai.rw mu Rwanda. Inshingano yawe ni gutegura amasomo arambuye kandi ashimishije mu Kinyarwanda cy'umwimerere. Buri gihe tanga ingero zifatika zo mu Rwanda. ${context}`,
        temperature: 0.8,
        tools: [{ googleSearch: {} }]
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Course Generation Error:", error);
    throw error;
  }
};

export const generateBusinessAnalysis = async (input: string): Promise<BusinessAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView('BUSINESS');
  const grammar = getContextForView('GRAMMAR');
  
  const prompt = `Sesengura ubu bucuruzi kandi utange isesengura mu Kinyarwanda: "${input}". 
  Tanga igisubizo cya JSON yonyine. [GRAMMAR RULES]: ${grammar}`;

  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `Uri umusesenguzi wa ai.rw mu Rwanda. Subiza mu Kinyarwanda gusa. ${context}`,
      responseMimeType: "application/json",
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      tools: [{ googleSearch: {} }]
    }
  });
  
  return JSON.parse(cleanJsonString(response.text));
};

export const generateRuralAdvice = async (query: string, sector: string): Promise<{ text: string, sources: Source[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView('RURAL');
  const grammar = getContextForView('GRAMMAR');
  
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: `Urwego: ${sector}. Ikibazo: ${query}\n[LATEST GRAMMAR]: ${grammar}`,
    config: {
      systemInstruction: `Uri umujyanama mu by'icyaro wa ai.rw. Tanga inama zifatika kandi zigezweho mu Kinyarwanda. ${context}`,
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      tools: [{ googleSearch: {} }]
    }
  });
  return { text: response.text || "", sources: extractSources(response) };
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getContextForView('VOICE_TRAINING');
  
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: `${context}\n${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<ImageAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getContextForView('IMAGE_TOOLS');
  const grammar = getContextForView('GRAMMAR');
  const config = getModelConfig();
  
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: `${context}\n${grammar}\n${prompt || "Sesengura iyi foto mu Kinyarwanda."}` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER },
          keyObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
          imageType: { type: Type.STRING }
        },
        required: ["description", "confidenceScore", "keyObservations", "imageType"]
      }
    }
  });
  return JSON.parse(cleanJsonString(response.text || "{}"));
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Nyamuneka kura inyandiko iri muri iyi foto uyishyire mu mwandiko usomeka neza mu Kinyarwanda niba ari rwo rurimi ruriho. Garura inyandiko yakuwemo gusa." }
      ]
    },
    config: {
      temperature: 0.1,
      topP: config.topP,
      topK: config.topK,
      seed: config.seed
    }
  });
  return response.text || "";
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Nta foto yabonetse mu gisubizo cya AI.");
};

export const generateConversationResponse = async (history: any[], newMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView('VOICE_TRAINING');
  const grammar = getContextForView('GRAMMAR');
  
  const contents = [...history, { role: 'user', parts: [{ text: newMessage }] }];
  
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents,
    config: { 
      systemInstruction: `Uri ijwi rya ai.rw. Subiza mu Kinyarwanda gito kandi gishimishije. ${context}\n[RULES]: ${grammar}`,
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK
    }
  });
  return response.text || "";
};

export const generateTextAnalysis = async (prompt: string, type: string, tone: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = getModelConfig();
  const context = getContextForView('CHAT');
  const grammar = getContextForView('GRAMMAR');
  
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: `Igikorwa: ${type}. Umwandiko: ${prompt}. Imvugo: ${tone}\n[RULES]: ${grammar}`,
    config: { 
      systemInstruction: `Uri impuguke mu rurimi rw'Ikinyarwanda kuri ai.rw. ${context}`,
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK
    }
  });
  return response.text || "";
};
