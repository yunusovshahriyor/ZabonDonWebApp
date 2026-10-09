// Рӯзҳои фаъол (streak). Мантиқ айнан аз Android: stats/LearningStreakHelper.kt.
//
//  • Рӯзи фаъол сабт мешавад ҳангоми омӯзиши калима ("Медонам" / аз худ шуд) ё анҷоми бозӣ.
//  • Агар имрӯз аллакай сабт шуда бошад — ҳеҷ чиз тағйир намеёбад.
//  • Агар охирин рӯзи фаъол ДИРӮЗ ё ПАРИРӮЗ буд — серия +1 (як рӯзи бахшиш: як рӯзи аздастрафта занҷираро намешиканад);
//    дар ҳолати дигар — серия аз 1 оғоз мешавад.
//  • Беҳтарин серия, рӯйхати рӯзҳои фаъол (охирин 84 рӯз) ва ҷамъи рӯзҳои фаъол нигоҳ дошта мешавад.
//  • Серияи гумшуда: агар аз охирин рӯзи фаъол ≥ 3 рӯз гузашта бошад (барои ёдрас — ҳамон қоида).

const KEY = 'zabondon_streak_v1';
const RETAIN_ACTIVE_DAYS = 84;

type State = {
  last: string; // охирин рӯзи фаъол, yyyy-MM-dd
  current: number;
  best: number;
  dates: string[]; // рӯзҳои фаъол (охирин 84 рӯз)
  total: number; // ҷамъи рӯзҳои фаъол дар тамоми давра
};

const EMPTY: State = { last: '', current: 0, best: 0, dates: [], total: 0 };

// ---------- Санаҳо (вақти маҳаллӣ, мисли Calendar.getInstance() дар Android) ----------
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysAgo = (n: number, from = new Date()) => {
  const d = midnight(from);
  d.setDate(d.getDate() - n);
  return d;
};
export const todayKey = () => ymd(new Date());

// ---------- Нигоҳдорӣ ----------
function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, dates: [] };
    const p = JSON.parse(raw) as Partial<State>;
    return {
      last: typeof p.last === 'string' ? p.last : '',
      current: Math.max(0, Number(p.current) || 0),
      best: Math.max(0, Number(p.best) || 0),
      dates: Array.isArray(p.dates) ? p.dates.filter((x) => typeof x === 'string') : [],
      total: Math.max(0, Number(p.total) || 0),
    };
  } catch {
    return { ...EMPTY, dates: [] };
  }
}

function write(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* localStorage дастнорас аст */
  }
}

// ---------- Хондан ----------
export const currentStreak = () => read().current;
export const bestStreak = () => read().best;
export const totalActiveDays = () => read().total;
export const wasActiveDay = (dateKey: string) => !!dateKey && read().dates.includes(dateKey);
export const isActiveToday = () => wasActiveDay(todayKey());

/** Чанд рӯз пеш аз имрӯз охирин рӯзи фаъол буд (0 — имрӯз, -1 — ҳанӯз фаъол набудааст). */
export function daysSinceLastActive(): number {
  const { last } = read();
  if (!last) return -1;
  const [y, m, d] = last.split('-').map(Number);
  if (!y || !m || !d) return -1;
  const diff = midnight(new Date()).getTime() - new Date(y, m - 1, d).getTime();
  return Math.round(diff / 86_400_000);
}

/** Серия гум шудааст, агар ≥ 3 рӯз аз охирин рӯзи фаъол гузашта бошад. */
export const isStreakLost = () => daysSinceLastActive() >= 3;

// ---------- Сабт ----------
/** Рӯзи фаъолро сабт мекунад. Бармегардонад: true — ин рӯзи нави фаъол буд (барои табрик). */
export function recordActivity(): boolean {
  const s = read();
  const today = todayKey();
  if (s.last === today) return false;

  const yesterday = ymd(daysAgo(1));
  const dayBefore = ymd(daysAgo(2));
  const next = s.last === yesterday || s.last === dayBefore ? s.current + 1 : 1;

  const isNewDay = !s.dates.includes(today);
  const dates = isNewDay ? [...s.dates, today] : s.dates;
  const cutoff = ymd(daysAgo(RETAIN_ACTIVE_DAYS));

  write({
    last: today,
    current: next,
    best: Math.max(s.best, next),
    dates: dates.filter((d) => d >= cutoff),
    total: isNewDay ? s.total + 1 : s.total,
  });
  return true;
}

export function resetStreak() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* localStorage дастнорас аст */
  }
}

// ---------- Ҳафта ----------
export type StreakWeekDay = { dayLabel: string; dayOfMonth: number; isToday: boolean; isActive: boolean };

const DAY_LABELS = ['Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шн', 'Яш'];

/** Рӯзҳои ҳафтаи ҷорӣ (Душанбе → Якшанбе). */
export function currentWeekDays(): StreakWeekDay[] {
  const { dates } = read();
  const now = new Date();
  const today = ymd(now);
  const sinceMonday = (now.getDay() + 6) % 7; // Якшанбе (0) → 6, Душанбе (1) → 0
  const monday = daysAgo(sinceMonday, now);
  return DAY_LABELS.map((dayLabel, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const key = ymd(day);
    return { dayLabel, dayOfMonth: day.getDate(), isToday: key === today, isActive: dates.includes(key) };
  });
}
