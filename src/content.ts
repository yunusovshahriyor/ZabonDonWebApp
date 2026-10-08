import { useSyncExternalStore } from 'react';
import { bool, listDocuments, num, str } from './firestore';

// ---------- Намудҳо (мувофиқи Android: CategoriesRepository / WordsRepository) ----------
export type Category = {
  id: string;
  titleTg: string;
  titleRu: string;
  order: number;
  imageUrl?: string;
  isPremium: boolean;
  /** Сатҳи душворӣ 1–5 (0 — муайян нашудааст). */
  level: number;
};

export type Word = {
  id: string;
  categoryId: string;
  ru: string;
  tj: string;
  exRu: string;
  exTj: string;
  /** URL-и акси калима (Firebase Storage); агар набошад — ҳарфи аввал нишон дода мешавад. */
  image?: string;
  order: number;
};

export type ContentStatus = 'loading' | 'ready' | 'error';
type State = { status: ContentStatus; categories: Category[]; words: Word[] };

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ---------- Мағоза ----------
let state: State = { status: 'loading', categories: [], words: [] };
let version = 0;
let started = false;
const listeners = new Set<() => void>();
const CACHE_KEY = 'zabondon_content_v1';

function set(next: State) {
  state = next;
  version += 1;
  listeners.forEach((l) => l());
}

/** Баъди ҳар тағйири мундариҷа (барои ҳисоби оморе, ки аз шумораи калимаҳо вобаста аст). */
export function onContentChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useContent(): State {
  useSyncExternalStore(onContentChange, () => version);
  return state;
}

export const getAllWords = () => state.words;
export const getCategories = () => state.categories;
export const getCategory = (id: string) => state.categories.find((c) => c.id === id);
export const getWordsByCategory = (id: string) => state.words.filter((w) => w.categoryId === id);

function readCache(): Pick<State, 'categories' | 'words'> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function fetchAll(): Promise<Pick<State, 'categories' | 'words'>> {
  const [catDocs, wordDocs] = await Promise.all([
    listDocuments('categories', ['id', 'title_tg', 'title', 'title_ru', 'order', 'imageUrl', 'iconUrl', 'isPremium', 'premium', 'isActive', 'level']),
    listDocuments('words', [
      'categoryId', 'category', 'catId', 'russian', 'ru', 'RU', 'tajik', 'tg', 'TJ',
      'exampleRu', 'example_ru', 'sampleRu', 'exampleTg', 'example_tg', 'sampleTg',
      'imageUrl', 'image', 'photoUrl', 'iconUrl', 'order',
    ]),
  ]);

  const categories: Category[] = catDocs
    .filter((d) => bool(d, ['isActive'], true))
    .map((d) => ({
      id: str(d, 'id') || d.id,
      titleTg: str(d, 'title_tg', 'title'),
      titleRu: str(d, 'title_ru'),
      order: num(d, 'order'),
      imageUrl: str(d, 'imageUrl', 'iconUrl') || undefined,
      isPremium: bool(d, ['isPremium', 'premium'], false),
      level: Math.max(0, Math.min(5, num(d, 'level'))),
    }))
    .filter((c) => c.id && (c.titleTg || c.titleRu))
    .sort((a, b) => a.order - b.order);

  const words: Word[] = wordDocs
    .map((d) => ({
      id: d.id,
      categoryId: str(d, 'categoryId', 'category', 'catId'),
      ru: cap(str(d, 'russian', 'ru', 'RU')),
      tj: cap(str(d, 'tajik', 'tg', 'TJ')),
      exRu: cap(str(d, 'exampleRu', 'example_ru', 'sampleRu')),
      exTj: cap(str(d, 'exampleTg', 'example_tg', 'sampleTg')),
      image: str(d, 'imageUrl', 'image', 'photoUrl', 'iconUrl') || undefined,
      order: num(d, 'order'),
    }))
    .filter((w) => w.categoryId && w.ru && w.tj)
    .sort((a, b) => a.order - b.order);

  return { categories, words };
}

/** Мундариҷаро як маротиба аз Firestore мегирад; кэши охирин фавран нишон дода мешавад (stale-while-revalidate). */
export function loadContent(force = false) {
  if (started && !force) return;
  started = true;

  const cached = readCache();
  if (cached && cached.words.length) set({ status: 'ready', ...cached });
  else set({ ...state, status: 'loading' });

  fetchAll()
    .then((fresh) => {
      set({ status: 'ready', ...fresh });
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      } catch {
        /* кэш дастнорас аст */
      }
    })
    .catch(() => {
      // агар кэш бошад — онро нигоҳ медорем, вагарна хато нишон медиҳем
      if (!(cached && cached.words.length)) set({ ...state, status: 'error' });
    });
}

export function retryLoadContent() {
  started = false;
  loadContent(true);
}
