
import { KnowledgeItem, KnowledgeScope } from '../types';

const STORAGE_KEY = 'ai_rw_knowledge_base';

const SEED_DATA: KnowledgeItem[] = [
  {
    id: 'seed-voice-1',
    title: 'Voice Rule: Amakuru',
    scope: 'VOICE_TRAINING',
    content: 'Phrase: "Amakuru"\nPhonetic: [A-ma-ku-ru]\nContext: Rikoreshwa mu kubaza uko umuntu ameze. AI igomba kuvuga ijwi ririmo urugwiro.',
    dateAdded: Date.now()
  }
];

export const getKnowledgeItems = (): KnowledgeItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(stored);
};

export const saveKnowledgeItem = (item: Omit<KnowledgeItem, 'id' | 'dateAdded'>) => {
  const items = getKnowledgeItems();
  const newItem: KnowledgeItem = {
    ...item,
    id: Date.now().toString(),
    dateAdded: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...items]));
  return newItem;
};

export const deleteKnowledgeItem = (id: string) => {
  const items = getKnowledgeItems();
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getContextForView = (scope: KnowledgeScope | 'generic'): string => {
  const items = getKnowledgeItems();
  
  // Filter items that match the requested scope or are global ('ALL')
  const relevantItems = items.filter(i => i.scope === 'ALL' || i.scope === scope);
  
  if (relevantItems.length === 0) return "";

  const contextString = relevantItems.map(i => `[INFO: ${i.title}]\n${i.content}`).join("\n\n");
  
  return `\n\nIMPORTANT CONTEXT FROM ADMIN KNOWLEDGE BASE:\n${contextString}\n\nUse this information to answer if relevant.`;
};
