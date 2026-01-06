
import { KnowledgeItem, KnowledgeScope } from '../types';

const STORAGE_KEY = 'ai_rw_knowledge_base';

const SEED_DATA: KnowledgeItem[] = [
  {
    id: 'seed-voice-1',
    title: 'Voice Rule: Amakuru',
    scope: 'VOICE_TRAINING',
    content: 'Phrase: "Amakuru"\nPhonetic: [A-ma-ku-ru]\nContext: Rikoreshwa mu kubaza uko umuntu ameze.',
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
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    dateAdded: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...items]));
  return newItem;
};

export const saveBulkKnowledgeItems = (newItems: Omit<KnowledgeItem, 'id' | 'dateAdded'>[]) => {
  const items = getKnowledgeItems();
  const timestamp = Date.now();
  const formatted = newItems.map((item, idx) => ({
    ...item,
    id: (timestamp + idx).toString() + Math.random().toString(36).substr(2, 5),
    dateAdded: timestamp,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...formatted, ...items]));
  return formatted;
};

export const deleteKnowledgeItem = (id: string) => {
  const items = getKnowledgeItems();
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const deleteBulkKnowledgeItems = (ids: string[]) => {
  const items = getKnowledgeItems();
  const filtered = items.filter(i => !ids.includes(i.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getContextForView = (scope: KnowledgeScope | 'CHAT' | 'VOICE_TRAINING' | 'IMAGE_TOOLS'): string => {
  const items = getKnowledgeItems();
  const relevantItems = items.filter(i => i.scope === 'ALL' || i.scope === scope);
  if (relevantItems.length === 0) return "";
  const contextString = relevantItems.map(i => `[INFO: ${i.title}]\n${i.content}`).join("\n\n");
  return `\n\nIMPORTANT CONTEXT FROM ADMIN KNOWLEDGE BASE:\n${contextString}\n\n`;
};
