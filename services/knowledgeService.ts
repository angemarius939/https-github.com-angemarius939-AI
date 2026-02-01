
import { KnowledgeItem, KnowledgeScope } from '../types';

const STORAGE_KEY = 'ai_rw_knowledge_base';

const SEED_DATA: KnowledgeItem[] = [
  {
    id: 'seed-grammar-1',
    title: 'Imyandikire y\'Inyandiko',
    scope: 'GRAMMAR',
    content: 'Kurikiza imyandikire yemejwe n\'inteko y\'umuco. Ntukigere na rimwe ukoresha imvugo nk\'izikoreshwa kuri SMS (Shorthand). Buri nteruro igomba gutangirwa n\'inyuguti nkuru.',
    dateAdded: Date.now()
  },
  {
    id: 'seed-voice-1',
    title: 'Amategeko y\'Imivugire',
    scope: 'VOICE_TRAINING',
    content: 'Ijambo "Amakuru" rivugwa nka [A-ma-ku-ru]. Ntugatindure inyuguti ya nyuma. Igihe cyose ubajije amakuru, ubanze usuhuze uwo muganira.',
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

export const deleteKnowledgeItem = (id: string) => {
  const items = getKnowledgeItems();
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const clearAllKnowledge = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
};

export const importKnowledgeBase = (data: KnowledgeItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const exportKnowledgeBase = (): string => {
  return localStorage.getItem(STORAGE_KEY) || '[]';
};

/**
 * Retrieves context strings for the model based on the active tool/view.
 */
export const getContextForView = (scope: KnowledgeScope | 'CHAT' | 'VOICE_TRAINING' | 'IMAGE_TOOLS'): string => {
  const items = getKnowledgeItems();
  
  // Mandatory linguistic rules always included if relevant
  const linguisticItems = items.filter(i => i.scope === 'GRAMMAR' || i.scope === 'VOCABULARY');
  const globalItems = items.filter(i => i.scope === 'ALL');
  const localItems = items.filter(i => i.scope === scope && i.scope !== 'ALL' && i.scope !== 'GRAMMAR' && i.scope !== 'VOCABULARY');
  
  const formatItem = (i: KnowledgeItem) => `- [${i.scope}] ${i.title.toUpperCase()}: ${i.content}`;

  let contextString = `\n\n### MANDATORY TRAINING DATA FROM ADMIN ###\n`;
  
  if (linguisticItems.length > 0) {
    contextString += `\n[LINGUISTIC RULES - CRITICAL]:\n${linguisticItems.map(formatItem).join('\n')}\n`;
  }

  if (globalItems.length > 0) {
    contextString += `\n[GLOBAL RULES]:\n${globalItems.map(formatItem).join('\n')}\n`;
  }
  
  if (localItems.length > 0) {
    contextString += `\n[CONTEXT RULES FOR ${scope}]:\n${localItems.map(formatItem).join('\n')}\n`;
  }
  
  contextString += `\n### END OF TRAINING DATA ###\n\n`;

  return contextString;
};
