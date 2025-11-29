export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  image?: string; // Base64 string for displayed images
  timestamp: number;
}

export enum AppView {
  CHAT = 'chat',
  TEXT_TOOLS = 'text_tools',
  IMAGE_TOOLS = 'image_tools',
  RURAL_SUPPORT = 'rural_support',
  COURSE_GENERATOR = 'course_generator',
  VOICE_CONVERSATION = 'voice_conversation',
  TEXT_TO_SPEECH = 'text_to_speech'
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

export interface ImageAnalysisResult {
  description: string;
  confidenceScore: number;
  keyObservations: string[];
  imageType: string; // New field for automatic classification
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';