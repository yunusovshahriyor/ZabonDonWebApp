import { useSyncExternalStore } from 'react';
import { t } from './strings';
import type { IconName } from './components/Icon';

// ---------- Калимаҳои намунавӣ барои санҷиши мантиқи омӯзиш ----------
/** image — URL-и акси калима (дар барномаи воқеӣ аз база); агар набошад, иллюстратсияи WordArt нишон дода мешавад. */
export type Word = { id: number; emoji: string; image?: string; ipa: string; ru: string; tj: string; exRu: string; exTj: string };
export type WordStatus = 'new' | 'repeat' | 'known';

export const WORDS: Word[] = [
  { id: 1, ipa: '/prʲɪˈvʲet/', emoji: '👋', ru: 'привет', tj: 'салом', exRu: 'Привет, как дела?', exTj: 'Салом, корҳо чӣ тавр?' },
  { id: 2, ipa: '/spɐˈsʲibə/', emoji: '🙏', ru: 'спасибо', tj: 'ташаккур', exRu: 'Большое спасибо!', exTj: 'Ташаккури калон!' },
  { id: 3, ipa: '/ˈpoʐəlstə/', emoji: '🤝', ru: 'пожалуйста', tj: 'марҳамат', exRu: 'Пожалуйста, садитесь.', exTj: 'Марҳамат, шинед.' },
  { id: 4, ipa: '/xlʲep/', emoji: '🍞', ru: 'хлеб', tj: 'нон', exRu: 'Я купил хлеб.', exTj: 'Ман нон харидам.' },
  { id: 5, ipa: '/vɐˈda/', emoji: '💧', ru: 'вода', tj: 'об', exRu: 'Дайте воды, пожалуйста.', exTj: 'Лутфан об диҳед.' },
  { id: 6, ipa: '/dom/', emoji: '🏠', ru: 'дом', tj: 'хона', exRu: 'Это мой дом.', exTj: 'Ин хонаи ман аст.' },
  { id: 7, ipa: '/druk/', emoji: '🧑‍🤝‍🧑', ru: 'друг', tj: 'дӯст', exRu: 'Он мой друг.', exTj: 'Ӯ дӯсти ман аст.' },
  { id: 8, ipa: '/ˈknʲigə/', emoji: '📖', ru: 'книга', tj: 'китоб', exRu: 'Я читаю книгу.', exTj: 'Ман китоб мехонам.' },
  { id: 9, ipa: '/ˈɡorət/', emoji: '🏙️', ru: 'город', tj: 'шаҳр', exRu: 'Душанбе — красивый город.', exTj: 'Душанбе шаҳри зебо аст.' },
  { id: 10, ipa: '/rɐˈbotə/', emoji: '💼', ru: 'работа', tj: 'кор', exRu: 'Я иду на работу.', exTj: 'Ман ба кор меравам.' },
];

export const COINS_PER_WORD = 5;
export const SESSION_SIZE = 10;

// ---------- Ҳолати пешравӣ (мағозаи оддӣ + localStorage) ----------
const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ | /g, ' ');

const BASE = { streak: 3, coinsNum: 1240, daily: 2, goal: 5, total: 58, repeat: 1, learned: 1 };

// Объекти зинда: компонентҳо онро мехонанд, пас аз тағйир useProgress() онҳоро аз нав мекашад.
export const demo = {
  streak: BASE.streak,
  coinsNum: BASE.coinsNum,
  coins: fmt(BASE.coinsNum),
  daily: BASE.daily,
  goal: BASE.goal,
  total: BASE.total,
  repeat: BASE.repeat,
  learned: BASE.learned,
  achievement: { current: 3, target: 5 },
};

let statuses: Record<number, WordStatus> = {};
let version = 0;
const listeners = new Set<() => void>();
const KEY = 'zabondon_progress_v1';

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ d: { ...demo }, statuses }));
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
    statuses = st ?? {};
  } catch {
    /* маълумоти вайрон — аз нав оғоз */
  }
}
load();

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

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

export const statusOf = (id: number): WordStatus => statuses[id] ?? 'new';

/** Калимаҳои ҷаласа: ҳанӯз омӯхта нашуда (нав + барои такрор), то 10 адад. */
export function getSessionWords(): Word[] {
  return WORDS.filter((w) => statusOf(w.id) !== 'known').slice(0, SESSION_SIZE);
}

/** "Медонам" дар карти шиносӣ: калима бевосита ба рӯйхати омӯхташудаҳо мегузарад (бе танга ва бе ҳадафи рӯз). */
export function markKnown(id: number) {
  const prev = statusOf(id);
  if (prev === 'known') return;
  statuses[id] = 'known';
  demo.learned += 1;
  if (prev === 'new') demo.total -= 1;
  else demo.repeat -= 1;
  save();
  emit();
}

/** Ҷавоби корбар: "Медонам" (known) ё "Такрор мекунам". */
export function answer(id: number, known: boolean) {
  const prev = statusOf(id);
  if (prev === 'known') return;
  if (known) {
    statuses[id] = 'known';
    demo.learned += 1;
    demo.daily += 1;
    demo.coinsNum += COINS_PER_WORD;
    demo.coins = fmt(demo.coinsNum);
    if (prev === 'new') demo.total -= 1;
    else demo.repeat -= 1;
  } else if (prev === 'new') {
    statuses[id] = 'repeat';
    demo.total -= 1;
    demo.repeat += 1;
  }
  save();
  emit();
}

export function resetProgress() {
  statuses = {};
  Object.assign(demo, {
    streak: BASE.streak,
    coinsNum: BASE.coinsNum,
    coins: fmt(BASE.coinsNum),
    daily: BASE.daily,
    goal: BASE.goal,
    total: BASE.total,
    repeat: BASE.repeat,
    learned: BASE.learned,
  });
  save();
  emit();
}

export const scenarios: { icon: IconName; label: string }[] = [
  { icon: 'plane', label: t.scAirport },
  { icon: 'bag', label: t.scShop },
  { icon: 'car', label: t.scTaxi },
];
