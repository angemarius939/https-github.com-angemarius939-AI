
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
  image?: string; // Base64 string for displayed images
  timestamp: number;
  reaction?: string; // New field for storing emoji reactions
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
  ADMIN = 'admin'
}

export type KnowledgeScope = 'ALL' | 'RURAL' | 'BUSINESS' | 'COURSE' | 'CHAT' | 'IMAGE_TOOLS' | 'VOICE_TRAINING';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  scope: KnowledgeScope;
  dateAdded: number;
}

export interface AnnotationBox {
  label: string;
  description?: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface ImageTrainingData {
  imageDescription: string;
  annotations: AnnotationBox[];
}

export interface VoiceTrainingData {
  phrase: string;
  phonetic?: string;
  usageContext: string;
}

export interface TextToolResult {
  original: string;
  result: string;
  action: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface DetectedObject {
  label: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax]
}

export interface ImageAnalysisResult {
  description: string;
  confidenceScore: number;
  keyObservations: string[];
  imageType: string;
  detectedObjects?: DetectedObject[]; // New field for object detection
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ChartDataPoint {
  label: string;
  value: number;
  type: string; // Changed from union to string for generic support
}

export interface BusinessAnalysisResult {
  summary: string; // Can contain Markdown tables
  isFinancial: boolean; // Flag to distinguish business vs generic data
  financials?: {
    revenue: number;
    expense: number;
    profit: number;
    currency: string;
  };
  kpiCards?: {
    label: string;
    value: string;
    color?: string;
  }[];
  risks: string[]; // Used as "Challenges" for generic
  advice: string[]; // Used as "Recommendations" for generic
  chartData: ChartDataPoint[];
}

export interface DailyStats {
  date: string;
  count: number;
  countries: Record<string, number>;
}

export interface CountryStats {
  code: string;
  count: number;
  name: string;
  flag: string;
}
