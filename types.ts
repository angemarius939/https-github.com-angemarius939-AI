
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error'
}

export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  image?: string; 
  timestamp: number;
  reaction?: string; 
  sources?: Source[];
  isSourcesVisible?: boolean;
}

export enum AppView {
  LANDING = 'landing',
  CHAT = 'chat',
  TEXT_TOOLS = 'text_tools',
  IMAGE_TOOLS = 'image_tools',
  RURAL_SUPPORT = 'rural_support',
  COURSE_GENERATOR = 'course_generator',
  VOICE_CONVERSATION = 'voice_conversation',
  TEXT_TO_SPEECH = 'text_to_speech',
  DECISION_ASSISTANT = 'decision_assistant',
  TWIGE_IKINYARWANDA = 'twige_ikinyarwanda',
  ADMIN = 'admin'
}

export type KnowledgeScope = 'ALL' | 'RURAL' | 'BUSINESS' | 'COURSE' | 'CHAT' | 'IMAGE_TOOLS' | 'VOICE_TRAINING' | 'LEGAL' | 'TECHNICAL' | 'LEARN_KINYARWANDA' | 'GRAMMAR' | 'VOCABULARY';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  scope: KnowledgeScope;
  dateAdded: number;
  fileType?: string;
  wordCount?: number;
}

export interface ModelConfig {
  systemInstruction: string;
  temperature: number;
  topP: number;
  topK: number;
  thinkingBudget: number;
  maxOutputTokens?: number;
  seed?: number;
  isTwigePublic?: boolean;
}

// Fix: Add missing DailyStats interface
export interface DailyStats {
  date: string;
  count: number;
  countries: Record<string, number>;
}

// Fix: Add missing CountryStats interface
export interface CountryStats {
  code: string;
  count: number;
  name: string;
  flag: string;
}

export interface ImageAnalysisResult {
  description: string;
  confidenceScore: number;
  keyObservations: string[];
  imageType: string;
  detectedObjects?: { label: string; box_2d: number[] }[];
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface BusinessAnalysisResult {
  summary: string;
  isFinancial: boolean;
  financials?: {
    revenue: number;
    expense: number;
    profit: number;
    currency: string;
  };
  risks: string[];
  advice: string[];
  chartData: {label: string; value: number; type: string}[];
}