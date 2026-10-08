import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { TabKey } from './components/BottomNav';
import { isStandalone } from './pwa';

/** category — категорияи кушодашуда дар «Луғатҳо»; studyCategory — омӯзиши ҳамон категория (бе он — омӯзиши умумӣ). */
export type Nav = { tab: TabKey; studying: boolean; category: string | null; studyCategory?: string };

type HState = { zd: 1; tab: TabKey; studying: boolean; cat?: string | null; sc?: string } | { zd: 'exit' };

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const depthOf = (n: Nav) => (n.tab !== 'home' ? 1 : 0) + (n.category ? 1 : 0) + (n.studying ? 1 : 0);
const fromState = (st: Extract<HState, { zd: 1 }>): Nav => ({ tab: st.tab, studying: st.studying, category: st.cat ?? null, studyCategory: st.sc });

/**
 * Навигатсия бо History API, то тугмаи "Назад"-и телефон/браузер кор кунад:
 *  • дар саҳифаҳои дигар — як қадам ба қафо (омӯзиш → саҳифаи пештара → асосӣ);
 *  • дар саҳифаи асосӣ — диалоги пурсиши баромад.
 *
 * Стек: [сентинел "exit"] → [асосӣ] → [таб] → [омӯзиш]. Сентинел ва "асосӣ" танҳо бо аввалин ламс сохта мешаванд:
 * Chrome вуруди таърихеро, ки бе амали корбар илова шудааст, ҳангоми "Назад" мегузаронад.
 * Пас аз навсозии саҳифа стек ва ҳолат аз history.state барқарор мешаванд.
 */
export function useNav() {
  const [nav, setNavState] = useState<Nav>(() => {
    const st = isWeb ? (history.state as HState | null) : null;
    return st && st.zd === 1 ? fromState(st) : { tab: 'home', studying: false, category: null };
  });
  const [exitOpen, setExitOpen] = useState(false);
  const [exited, setExited] = useState(false); // баромад имконнопазир буд (таб бе таърихи пештара) — экрани «баста шуд»
  const navRef = useRef(nav);
  navRef.current = nav;
  const afterPop = useRef<(() => void) | null>(null);
  const exitOpenRef = useRef(false);
  exitOpenRef.current = exitOpen;
  // Агар навсозӣ дар миёнаи стек бошад, стек аллакай ҳаст.
  const stackReady = useRef(isWeb && (history.state as HState | null)?.zd === 1);

  const ensureStack = useCallback(() => {
    if (!isWeb || stackReady.current) return;
    stackReady.current = true;
    history.replaceState({ zd: 'exit' } satisfies HState, '');
    history.pushState({ zd: 1, tab: 'home', studying: false, cat: null } satisfies HState, '');
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    // Аввалин ламс: стекро месозад (бояд дар доираи амали корбар бошад).
    const onFirstTouch = () => ensureStack();
    window.addEventListener('pointerup', onFirstTouch, { once: true, capture: true });
    const onPop = (e: PopStateEvent) => {
      const st = e.state as HState | null;
      if (st?.zd === 'exit') {
        // Ба сентинел расидем: дафъаи аввал — диалоги баромад, дафъаи дуюм — баромад.
        if (exitOpenRef.current) confirmExit();
        else setExitOpen(true);
      } else if (st?.zd === 1) {
        setExitOpen(false);
        const next = fromState(st);
        const after = afterPop.current;
        afterPop.current = null;
        if (after) after(); // гузариш ба таби дигар аз категория: пас аз бозгашт ҳолати нав ҷойгир мешавад
        else setNavState(next);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('pointerup', onFirstTouch, true);
      window.removeEventListener('popstate', onPop);
    };
  }, [ensureStack]);

  const goTab = useCallback(
    (tab: TabKey) => {
      const cur = navRef.current;
      if (tab === cur.tab) {
        // Пахши такрории «Луғатҳо» дар дохили категория — ба рӯйхати категорияҳо
        if (tab === 'dict' && cur.category) closeCategory();
        return;
      }
      const fresh: Nav = { tab, studying: false, category: null };
      if (!isWeb) return setNavState(fresh);
      ensureStack();
      if (tab === 'home') {
        const d = depthOf(cur);
        if (d > 0) history.go(-d); // popstate ҳолатро ба "асосӣ" бармегардонад
        else setNavState(fresh);
        return;
      }
      const s: HState = { zd: 1, tab, studying: false, cat: null };
      if (cur.tab === 'home') {
        history.pushState(s, '');
        setNavState(fresh);
      } else if (depthOf(cur) === 1) {
        history.replaceState(s, '');
        setNavState(fresh);
      } else {
        // Аз категория ба таби дигар: аввал ба қабати таб бармегардем, баъд онро иваз мекунем.
        afterPop.current = () => {
          history.replaceState(s, '');
          setNavState(fresh);
        };
        history.go(-(depthOf(cur) - 1));
      }
    },
    [ensureStack],
  );

  const openCategory = useCallback(
    (id: string) => {
      const cur = navRef.current;
      if (isWeb) {
        ensureStack();
        history.pushState({ zd: 1, tab: cur.tab, studying: false, cat: id } satisfies HState, '');
      }
      setNavState({ tab: cur.tab, studying: false, category: id });
    },
    [ensureStack],
  );

  const closeCategory = useCallback(() => {
    if (isWeb && stackReady.current) history.back();
    else setNavState({ tab: navRef.current.tab, studying: false, category: null });
  }, []);

  const openStudy = useCallback(
    (categoryId?: string) => {
      const cur = navRef.current;
      if (isWeb) {
        ensureStack();
        history.pushState({ zd: 1, tab: cur.tab, studying: true, cat: cur.category, sc: categoryId } satisfies HState, '');
      }
      setNavState({ tab: cur.tab, studying: true, category: cur.category, studyCategory: categoryId });
    },
    [ensureStack],
  );

  const closeStudy = useCallback(() => {
    if (isWeb && stackReady.current) history.back(); // popstate ҳолатро барқарор мекунад
    else setNavState({ ...navRef.current, studying: false, studyCategory: undefined });
  }, []);

  const cancelExit = useCallback(() => {
    if (isWeb) history.go(1); // ба вуруди "асосӣ" бармегардем
    setExitOpen(false);
  }, []);

  /**
   * Баромад (таби браузер): (1) "Назад" ба саҳифаи пеш; (2) window.close();
   * (3) агар ҳеҷ кадом кор накард (таби браузер бе таърих) — экрани «Барнома баста шуд».
   */
  const confirmExit = useCallback(() => {
    // PWA: браузер ба сайт бастани барномаро намедиҳад (window.close() танҳо бо таърихи як вуруд кор мекунад).
    // Дар ин ҳолат баромад — "Назад"-и системавӣ аз вуруди аввал; диалог инро ба корбар мегӯяд.
    if (!isWeb || isStandalone()) return;
    let left = false;
    const mark = () => {
      left = true;
    };
    window.addEventListener('pagehide', mark, { once: true });
    document.addEventListener('visibilitychange', () => document.hidden && mark(), { once: true });
    history.back();
    setTimeout(() => {
      if (left) return;
      window.close();
      setTimeout(() => {
        if (!left) setExited(true);
      }, 300);
    }, 300);
  }, []);

  const reopen = useCallback(() => {
    setExited(false);
    setExitOpen(false);
    if (isWeb) history.go(1);
  }, []);

  return { ...nav, exitOpen, exited, goTab, openStudy, closeStudy, openCategory, closeCategory, cancelExit, confirmExit, reopen };
}
