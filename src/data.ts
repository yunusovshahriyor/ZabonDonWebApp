import { useSyncExternalStore } from 'react';
import { getAllWords, getCategories, getWordsByCategory, onContentChange, type Word } from './content';
import { bestStreak, currentStreak, recordActivity, resetStreak, totalActiveDays } from './streak';
import { t } from './strings';
import type { IconName } from './components/Icon';

export type { Word } from './content';
export type WordStatus = 'new' | 'repeat' | 'known';

export const COINS_PER_WORD = 5;
export const SESSION_SIZE = 10;
export const GOAL_MIN = 1;
export const GOAL_MAX = 50;

// ---------- Ҳолати пешравӣ (мағозаи оддӣ + localStorage) ----------
const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ | /g, ' ');

const BASE = { coinsNum: 1240, daily: 0, goal: 5 };

// Объекти зинда: компонентҳо онро мехонанд, пас аз тағйир useProgress() онҳоро аз нав мекашад.
// total/repeat/learned аз ҳолати калимаҳои воқеии база ҳисоб мешаванд (recount).
export const demo = {
  // Рӯзҳои фаъол: ҳисоб ва нигоҳдорӣ дар streak.ts (мантиқи Android); ин ҷо танҳо нусхаи зинда барои UI.
  streak: 0,
  bestStreak: 0,
  activeDays: 0,
  coinsNum: BASE.coinsNum,
  coins: fmt(BASE.coinsNum),
  daily: BASE.daily,
  goal: BASE.goal,
  total: 0,
  repeat: 0,
  learned: 0,
  achievement: { current: 3, target: 5 },
};

let statuses: Record<string, WordStatus> = {};
let version = 0;
const listeners = new Set<() => void>();
const KEY = 'zabondon_progress_v2';

function save() {
  try {
    const { coinsNum, daily, goal } = demo;
    localStorage.setItem(KEY, JSON.stringify({ d: { coinsNum, daily, goal }, statuses }));
  } catch {
    /* localStorage дастнорас аст */
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const { d, statuses: st } = JSON.parse(raw);
    Object.assign(demo, d);
    demo.coins = fmt(demo.coinsNum);
    statuses = st ?? {};
  } catch {
    /* маълумоти вайрон — аз нав оғоз */
  }
}

/** Нусхаи зиндаи рӯзҳои фаъолро аз streak.ts нав мекунад. */
function syncStreak() {
  demo.streak = currentStreak();
  demo.bestStreak = bestStreak();
  demo.activeDays = totalActiveDays();
}

// Рӯзи нави фаъол сабт шуд — табрик (диалог) пас аз анҷоми бозӣ нишон дода мешавад (мисли ResultActivity дар Android).
let celebrationPending = false;
export function takeStreakCelebration(): boolean {
  const v = celebrationPending;
  celebrationPending = false;
  return v;
}

/** Фаъолияти рӯз: омӯзиши калима ё анҷоми бозӣ. */
function noteActivity() {
  if (recordActivity()) celebrationPending = true;
  syncStreak();
}

/** Оморро аз рӯи калимаҳои воқеии база ва ҳолати онҳо аз нав ҳисоб мекунад. */
function recount() {
  const words = getAllWords();
  let known = 0;
  let repeat = 0;
  for (const w of words) {
    const s = statuses[w.id];
    if (s === 'known') known += 1;
    else if (s === 'repeat') repeat += 1;
  }
  demo.learned = known;
  demo.repeat = repeat;
  demo.total = Math.max(0, words.length - known - repeat);
}

load();
syncStreak();
recount();

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

// Вақте мундариҷа аз база омад — оморро нав мекунем
onContentChange(() => {
  recount();
  emit();
});

/** Компонентро ҳангоми тағйири пешравӣ аз нав мекашад. */
export function useProgress() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
  );
  return demo;
}

export const statusOf = (id: string): WordStatus => statuses[id] ?? 'new';

/**
 * Калимаҳои ҷаласа (то 10): ҳанӯз омӯхта нашуда.
 * Бо categoryId — аз ҳамон категория; бе он — аз категорияҳои ройгон мувофиқи тартиби категорияҳо.
 */
export function getSessionWords(categoryId?: string): Word[] {
  let pool: Word[];
  if (categoryId) {
    pool = getWordsByCategory(categoryId);
  } else {
    pool = getCategories()
      .filter((c) => !c.isPremium)
      .flatMap((c) => getWordsByCategory(c.id));
  }
  return pool.filter((w) => statusOf(w.id) !== 'known').slice(0, SESSION_SIZE);
}

/** "Медонам" дар карти шиносӣ: калима бевосита ба рӯйхати омӯхташудаҳо мегузарад (бе танга ва бе ҳадафи рӯз). */
export function markKnown(id: string) {
  if (statusOf(id) === 'known') return;
  statuses[id] = 'known';
  noteActivity();
  recount();
  save();
  emit();
}

/** Ҷавоби корбар: known=true — калима аз худ шуд; false — ба омӯзиш фиристода шуд. */
export function answer(id: string, known: boolean) {
  const prev = statusOf(id);
  if (prev === 'known') return;
  if (known) {
    statuses[id] = 'known';
    demo.daily += 1;
    demo.coinsNum += COINS_PER_WORD;
    demo.coins = fmt(demo.coinsNum);
    noteActivity();
  } else if (prev === 'new') {
    statuses[id] = 'repeat';
  }
  recount();
  save();
  emit();
}

/** Мақсади рӯзона (чанд калима дар як рӯз): дар localStorage нигоҳ дошта мешавад. */
export function setDailyGoal(n: number) {
  const v = Math.max(GOAL_MIN, Math.min(GOAL_MAX, Math.round(n) || GOAL_MIN));
  if (v === demo.goal) return;
  demo.goal = v;
  save();
  emit();
}

export function resetProgress() {
  statuses = {};
  resetStreak();
  celebrationPending = false;
  Object.assign(demo, {
    coinsNum: BASE.coinsNum,
    coins: fmt(BASE.coinsNum),
    daily: BASE.daily,
    goal: BASE.goal,
  });
  syncStreak();
  recount();
  save();
  emit();
}

export const scenarios: { icon: IconName; label: string }[] = [
  { icon: 'plane', label: t.scAirport },
  { icon: 'bag', label: t.scShop },
  { icon: 'car', label: t.scTaxi },
];
