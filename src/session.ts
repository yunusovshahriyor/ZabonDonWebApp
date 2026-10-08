// Ҳолати ҷаласа (sessionStorage): пас аз навсозии саҳифа корбар дар ҳамон саҳифа мемонад.
// Бо пӯшидани таб/барнома нест мешавад, пас кушодани нав ҳамеша аз саҳифаи асосӣ оғоз мешавад.
export const NAV_KEY = 'zd-nav'; // { tab, studying }
export const STUDY_KEY = 'zd-study'; // ҳолати ҷаласаи омӯзиш (карт-ҳо, навбат, марҳала)
export const GAMES_KEY = 'zd-games'; // ҳолати бозиҳои раунди ҷорӣ (зинаҳо, хатогиҳо)

export function getSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sessionStorage дастнорас аст */
  }
}

export function clearSession(...keys: string[]) {
  try {
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* sessionStorage дастнорас аст */
  }
}
