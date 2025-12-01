
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
  CHAT = 'chat',
  TEXT_TOOLS = 'text_tools',
  IMAGE_TOOLS = 'image_tools',
  RURAL_SUPPORT = 'rural_support',
  COURSE_GENERATOR = 'course_generator',
  VOICE_CONVERSATION = 'voice_conversation',
  TEXT_TO_SPEECH = 'text_to_speech',
  DECISION_ASSISTANT = 'decision_assistant'
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
  type: 'revenue' | 'expense' | 'profit';
}

export interface BusinessAnalysisResult {
  summary: string;
  financials: {
    revenue: number;
    expense: number;
    profit: number;
    currency: string;
  };
  risks: string[];
  advice: string[];
  chartData: ChartDataPoint[];
}
