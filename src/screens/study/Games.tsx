import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { ProgressRing } from '../../components/ProgressRing';
import { Tap } from '../../components/Tap';
import { WordThumb } from '../../components/WordThumb';
import { getAllWords } from '../../content';
import { Coin } from '../../components/Coin';
import { InfoDialog } from '../../components/InfoDialog';
import { COIN_PENALTY_WRONG, COIN_REWARD_CORRECT, Word, answer, commitSessionCoins, demo, penalizeCoins, useProgress } from '../../data';
import { GAMES_KEY, clearSession, getSession, setSession } from '../../session';
import { t } from '../../strings';
import { colors, glass, softShadow } from '../../theme';
import { MatchBoard } from './Match';
import { PrimaryBtn, StudyHeader, c, haptic, speak } from './common';

// Зинаҳои азхудкунӣ (4 бозӣ, бо ҳамин тартиб):
//   0 → интихоби калимаи русӣ (pickRu), 1 → ҷуфтёбӣ (match), 2 → дуруст / нодуруст (trueFalse, мисли TrueFalseActivity дар Android),
//   3 → ҷамъ кардан аз ҳарфҳо (scramble), 4 → аз худ шуд.
type QType = 'pickRu' | 'match' | 'trueFalse' | 'scramble';
const TYPES: QType[] = ['pickRu', 'match', 'trueFalse', 'scramble'];
const MASTERED = TYPES.length;
const MATCH_STAGE = TYPES.indexOf('match');
const MATCH_PAIRS = 5;
const AUTO_NEXT_MS = 2000; // пас аз ҷавоби дуруст ба саволи навбатӣ худкор мегузарад

type Question = {
  word: Word;
  type: QType;
  options: string[];
  pairs?: Word[]; // match
  letters?: string[]; // scramble
  shown?: string; // trueFalse: тарҷумае, ки нишон дода мешавад (дуруст ё хато)
  isTrue?: boolean; // trueFalse: оё тарҷумаи нишондодашуда дуруст аст
};

/** Ҳарфҳои омехта; ҳамеша аз тартиби аслӣ фарқ мекунад (агар имкон бошад). */
function scrambleLetters(ru: string): string[] {
  const chars = [...ru.replace(/\s+/g, '')];
  if (new Set(chars).size < 2) return chars;
  let s = shuffle(chars);
  while (s.join('') === chars.join('')) s = shuffle(chars);
  return s;
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const norm = (s: string) => s.trim().toLowerCase().replace(/ё/g, 'е');

/** Калимаҳои дигар: аввал аз ҳамон категория, баъд аз дигарон (барои вариантҳои хато). */
function distractors(word: Word, key: 'ru' | 'tj', n: number): string[] {
  const others = getAllWords().filter((x) => x.id !== word.id && x[key] !== word[key]);
  const pool = [...shuffle(others.filter((x) => x.categoryId === word.categoryId)), ...shuffle(others.filter((x) => x.categoryId !== word.categoryId))];
  return [...new Set(pool.map((x) => x[key]))].slice(0, n);
}

function makeQuestion(words: Word[], stage: Record<string, number>, lastSeen: Record<string, number>, lastId: string | null): Question | null {
  const open = words.filter((w) => stage[w.id] < MASTERED);
  if (open.length === 0) return null;
  let pool = open.length > 1 ? open.filter((w) => w.id !== lastId) : open;
  // Калимаи дертар пурсидашуда пештар меояд; хатогӣ зинаро паст мекунад, калима зудтар бармегардад.
  const minSeen = Math.min(...pool.map((w) => lastSeen[w.id] ?? -1));
  pool = pool.filter((w) => (lastSeen[w.id] ?? -1) === minSeen);
  const word = pool[Math.floor(Math.random() * pool.length)];
  const type = TYPES[stage[word.id]];

  if (type === 'match') {
    // Дар ҷуфтёбӣ аввал калимаҳое меоянд, ки худашон дар ҳамин зинаанд
    const others = shuffle(words.filter((w) => w.id !== word.id)).sort((a, b) => Number(stage[b.id] === MATCH_STAGE) - Number(stage[a.id] === MATCH_STAGE));
    let pairs = [word, ...others].slice(0, MATCH_PAIRS);
    if (pairs.length < 3) {
      const extra = shuffle(getAllWords().filter((x) => !pairs.some((p) => p.id === x.id))).slice(0, 3 - pairs.length);
      pairs = [...pairs, ...extra];
    }
    return { word, type, options: [], pairs };
  }
  if (type === 'scramble') return { word, type, options: [], letters: scrambleLetters(word.ru) };
  if (type === 'trueFalse') {
    // Мисли Android (buildQuestion): 50% — тарҷумаи дуруст, 50% — тарҷумаи калимаи дигар
    const wrong = distractors(word, 'tj', 1)[0];
    const showCorrect = Math.random() < 0.5 || !wrong;
    return { word, type, options: [], shown: showCorrect ? word.tj : wrong, isTrue: showCorrect };
  }
  // pickRu: тарҷума нишон дода мешавад, аз 4 вариант калимаи русӣ интихоб мешавад
  return { word, type, options: shuffle([word.ru, ...distractors(word, 'ru', 3)]) };
}

const PROMPTS: Record<QType, string> = {
  pickRu: t.pickRuPrompt,
  match: t.matchPrompt,
  trueFalse: t.trueFalsePrompt,
  scramble: t.scramblePrompt,
};

/** Бозиҳо: ҳамон 5 калима то ҳар кадом ба зинаи "аз худ шуд" расад. */
export function Games({ words, onDone, onClose }: { words: Word[]; onDone: (mistakes: number, coins: number) => void; onClose: () => void }) {
  useProgress(); // тангаи умумӣ ҳангоми ҷарима нав мешавад
  // Пас аз навсозии саҳифа зинаҳо ва хатогиҳои ҳамин раунд барқарор мешаванд.
  const roundKey = words.map((w) => w.id).join('-');
  const [init] = useState(() => {
    const sv = getSession<{ key: string; stage: Record<string, number>; mistakes: number; earned?: number }>(GAMES_KEY);
    return sv && sv.key === roundKey && words.every((w) => typeof sv.stage[w.id] === 'number') ? sv : null;
  });
  const [stage, setStage] = useState<Record<string, number>>(() => init?.stage ?? Object.fromEntries(words.map((w) => [w.id, 0])));
  const lastSeen = useRef<Record<string, number>>({});
  const lastId = useRef<string | null>(null);
  const tick = useRef(0);
  const [mistakes, setMistakes] = useState(init?.mistakes ?? 0);
  // Тангаҳои ҳамин бозӣ ("ҳозира"): +1 барои дуруст, −5 барои нодуруст; ба умумӣ баъди анҷом илова мешавад.
  const earnedRef = useRef(init?.earned ?? 0);
  const [earned, setEarnedState] = useState(earnedRef.current);
  const setEarned = (v: number) => {
    earnedRef.current = v;
    setEarnedState(v);
  };
  const [rulesOpen, setRulesOpen] = useState(false);
  useEffect(() => {
    setSession(GAMES_KEY, { key: roundKey, stage, mistakes, earned });
  }, [roundKey, stage, mistakes, earned]);
  const [q, setQ] = useState<Question | null>(() => {
    const first = makeQuestion(words, init?.stage ?? Object.fromEntries(words.map((w) => [w.id, 0])), {}, null);
    if (first) {
      lastSeen.current[first.word.id] = 0;
      lastId.current = first.word.id;
    }
    return first;
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<number[]>([]); // scramble: индекси ҳарфҳои интихобшуда
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');

  const advanceRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (result === 'idle') return;
    haptic(result);
    // Ҷавоби дуруст ва ҳар натиҷаи ҷуфтёбӣ пас аз 2 сония худкор мегузаранд.
    if (result !== 'right' && q?.type !== 'match') return;
    const id = setTimeout(() => advanceRef.current(), AUTO_NEXT_MS);
    return () => clearTimeout(id);
  }, [result]);

  const finishMatch = useCallback(
    (wrongIds: string[]) => {
      if (!q?.pairs) return;
      const upd: Record<string, number> = {};
      for (const w of q.pairs) {
        if (stage[w.id] !== MATCH_STAGE) continue; // танҳо калимаҳои дар ин зина буда пеш меравад
        upd[w.id] = wrongIds.includes(w.id) ? Math.max(0, stage[w.id] - 1) : stage[w.id] + 1;
      }
      setStage((st) => ({ ...st, ...upd }));
      // Тангаҳо барои ҳар ҷуфт: дуруст +1, нодуруст −5 (мисли MatchPairsActivity)
      const wrongN = wrongIds.length;
      const rightN = Math.max(0, q.pairs.length - wrongN);
      let e = earnedRef.current + rightN * COIN_REWARD_CORRECT;
      if (wrongN > 0) e = penalizeCoins(e, wrongN);
      setEarned(e);
      if (wrongIds.length) setMistakes((n) => n + 1);
      setResult(wrongIds.length ? 'wrong' : 'right');
    },
    [q, stage],
  );

  if (!q) return null;

  const mastered = words.filter((w) => stage[w.id] >= MASTERED).length;
  // Ҷавоби дуруст (барои нишон додан ҳангоми хато)
  const correct = q.type === 'trueFalse' ? `${q.word.ru} — ${q.word.tj}` : q.word.ru;
  const scrambleAnswer = q.letters ? built.map((i) => q.letters![i]).join('') : '';

  const submit = (value: string) => {
    if (result !== 'idle') return;
    let ok: boolean;
    if (q.type === 'trueFalse') ok = (value === 'true') === q.isTrue;
    else if (q.type === 'scramble') ok = norm(value) === norm(q.word.ru.replace(/\s+/g, ''));
    else ok = value === q.word.ru; // pickRu
    setPicked(value);
    setResult(ok ? 'right' : 'wrong');
    setEarned(ok ? earnedRef.current + COIN_REWARD_CORRECT : penalizeCoins(earnedRef.current, 1));
    const cur = stage[q.word.id];
    const next = ok ? cur + 1 : Math.max(0, cur - 1);
    if (ok && next >= MASTERED) answer(q.word.id, true); // калима "омӯхташуда" мешавад
    if (!ok) setMistakes((m) => m + 1);
    setStage((st) => ({ ...st, [q.word.id]: next }));
  };

  const advance = () => {
    const nextStage = stage; // дар submit навсозӣ шудааст
    if (words.every((w) => nextStage[w.id] >= MASTERED)) {
      clearSession(GAMES_KEY);
      const gained = commitSessionCoins(earnedRef.current); // тангаҳои бозӣ ба умумӣ илова мешаванд
      onDone(mistakes, gained);
      return;
    }
    tick.current += 1;
    const nq = makeQuestion(words, nextStage, lastSeen.current, q.word.id);
    if (nq) {
      lastSeen.current[nq.word.id] = tick.current;
      lastId.current = nq.word.id;
    }
    setQ(nq);
    setPicked(null);
    setBuilt([]);
    setResult('idle');
  };

  advanceRef.current = advance;

  const optionStyle = (opt: string) => {
    if (result === 'idle') return [g.option];
    if (opt === q.word.ru) return [g.option, g.optionRight];
    if (opt === picked) return [g.option, g.optionWrong];
    return [g.option, { opacity: 0.45 }];
  };

  // Тугмаи дуруст/нодуруст пас аз ҷавоб: интихобшуда сабз (дуруст) ё сурх (хато), дигар кам-равшан (мисли Android)
  const tfButtonStyle = (which: 'true' | 'false') => {
    const base = [g.tfBtn, which === 'true' ? g.tfTrue : g.tfFalse];
    if (result === 'idle') return base;
    if (picked === which) return [...base, result === 'right' ? g.tfPickedRight : g.tfPickedWrong];
    return [...base, { opacity: 0.35 }];
  };

  const showPrompt = q.type === 'pickRu'; // дар trueFalse калима дар корти худаш аст, дар match/scramble — ҷои дигар
  const prompt = q.word.tj;

  return (
    <View style={{ flex: 1 }}>
      <StudyHeader onClose={onClose} progress={mastered / words.length} label={`${t.masteredLabel} ${mastered}/${words.length}`} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 150 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Тангаҳо: ҳозира / умумӣ (пахш — қоидаҳо) */}
        <View style={g.coinRow}>
          <Tap style={g.coinChip} onPress={() => setRulesOpen(true)} accessibilityLabel={t.coinRulesTitle}>
            <Coin size={16} />
            <Text style={g.coinText}>
              {earned} / {demo.coins}
            </Text>
          </Tap>
        </View>
        <View style={[g.card, softShadow, glass]}>
          <View style={g.cardTop}>
            <View style={c.chip}>
              <Text style={c.chipText}>{PROMPTS[q.type]}</Text>
            </View>
            <View style={{ flex: 1 }} />
            {/* Прогреси худи ҳамин калима (зинаҳо: 0 → 4) */}
            <ProgressRing size={38} stroke={4} progress={stage[q.word.id] / MASTERED} color={colors.green} trackColor={colors.track}>
              {stage[q.word.id] >= MASTERED ? (
                <Icon name="check" size={15} color={colors.green} strokeWidth={3} />
              ) : (
                <Text style={g.ringText}>
                  {stage[q.word.id]}/{MASTERED}
                </Text>
              )}
            </ProgressRing>
          </View>

          {q.type === 'match' ? <MatchBoard key={`${q.word.id}-${tick.current}`} pairs={q.pairs!} onFinish={finishMatch} /> : null}

          {showPrompt ? (
            <View style={g.promptRow}>
              <Text style={g.prompt}>{prompt}</Text>
            </View>
          ) : null}

          {q.type === 'pickRu' ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              {q.options.map((opt) => (
                <Tap key={opt} style={optionStyle(opt)} onPress={() => submit(opt)}>
                  <Text style={g.optionText}>{opt}</Text>
                </Tap>
              ))}
            </View>
          ) : null}

          {q.type === 'trueFalse' ? (
            <View style={{ marginTop: 12, gap: 12 }}>
              {/* Корти калима: акс + русӣ + тарҷумаи нишондодашуда (дуруст ё хато) */}
              <View style={g.tfCard}>
                <WordThumb image={q.word.image} letter={q.word.ru} size={84} radius={16} />
                <View style={{ flex: 1 }}>
                  <Text style={g.tfRu}>{q.word.ru}</Text>
                  <Text style={g.tfTj}>{q.shown}</Text>
                </View>
                <Tap style={g.speak} onPress={() => speak(q.word.ru)}>
                  <Icon name="volume" size={16} color={colors.green} />
                </Tap>
              </View>
              <View style={g.tfRow}>
                <Tap style={tfButtonStyle('true')} onPress={() => submit('true')}>
                  <Icon name="check" size={18} color="#fff" strokeWidth={2.8} />
                  <Text style={g.tfText}>{t.correct}</Text>
                </Tap>
                <Tap style={tfButtonStyle('false')} onPress={() => submit('false')}>
                  <Icon name="close" size={18} color="#fff" strokeWidth={2.8} />
                  <Text style={g.tfText}>{t.wrong}</Text>
                </Tap>
              </View>
            </View>
          ) : null}

          {q.type === 'scramble' ? (
            <View style={{ marginTop: 12, gap: 12 }}>
              <View style={g.promptRow}>
                <Text style={g.prompt}>{prompt}</Text>
              </View>
              <View style={[g.slots, result === 'right' && g.optionRight, result === 'wrong' && g.optionWrong]}>
                {built.map((i, pos) => (
                  <Tap key={pos} style={g.tile} onPress={() => result === 'idle' && setBuilt((b) => b.filter((_, k) => k !== pos))}>
                    <Text style={g.tileText}>{q.letters![i]}</Text>
                  </Tap>
                ))}
              </View>
              <View style={g.pool}>
                {q.letters!.map((ch, i) => (
                  <Tap
                    key={i}
                    style={[g.tile, built.includes(i) && { opacity: 0.2 }]}
                    onPress={() => result === 'idle' && !built.includes(i) && setBuilt((b) => [...b, i])}
                  >
                    <Text style={g.tileText}>{ch}</Text>
                  </Tap>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {result !== 'idle' && (
          <View style={[g.feedback, result === 'right' ? g.feedbackRight : g.feedbackWrong]}>
            <Icon name={result === 'right' ? 'check' : 'close'} size={20} color={result === 'right' ? colors.green : '#C0392B'} strokeWidth={2.6} />
            <View style={{ flex: 1 }}>
              <Text style={[g.feedbackTitle, { color: result === 'right' ? colors.green : '#C0392B' }]}>{result === 'right' ? t.correct : t.wrong}</Text>
              {result === 'wrong' && q.type !== 'match' ? (
                <Text style={g.feedbackSub}>
                  {t.rightAnswer} {correct}
                </Text>
              ) : null}
              {result === 'wrong' && q.type === 'match' ? (
                <Text style={g.feedbackSub}>
                  {t.rightAnswer}
                  {'\n'}
                  {q.pairs!.map((w) => `${w.ru} — ${w.tj}`).join('\n')}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={c.actions}>
        {result === 'idle' ? (
          q.type === 'scramble' ? (
            <PrimaryBtn label={t.check} onPress={() => submit(scrambleAnswer)} disabled={built.length !== q.letters!.length} />
          ) : null
        ) : (
          <PrimaryBtn label={t.next} onPress={advance} tone={result === 'right' ? 'green' : 'red'} />
        )}
      </View>
      {rulesOpen ? (
        <InfoDialog title={t.coinRulesTitle} message={t.coinRules(COIN_REWARD_CORRECT, COIN_PENALTY_WRONG)} onClose={() => setRulesOpen(false)} />
      ) : null}
    </View>
  );
}

const g = StyleSheet.create({
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  coinRow: { alignItems: 'flex-end', marginBottom: 8 },
  coinChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: colors.hairline },
  coinText: { fontSize: 13, fontWeight: '800', color: '#5C4A00' },
  ringText: { fontSize: 10, fontWeight: '800', color: colors.text },
  card: { borderRadius: 22, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  prompt: { flex: 1, fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  slots: {
    minHeight: 56,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.greenLine,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tile: {
    minWidth: 42,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { fontSize: 20, fontWeight: '700', color: colors.text },
  speak: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    justifyContent: 'center',
  },
  optionRight: { backgroundColor: '#DCF3E5', borderColor: colors.green },
  optionWrong: { backgroundColor: '#FBE0DD', borderColor: '#D8483B' },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  // Дуруст / нодуруст
  tfCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: colors.hairline },
  tfRu: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  tfTj: { fontSize: 18, fontWeight: '700', color: colors.green, marginTop: 2 },
  tfRow: { flexDirection: 'row', gap: 10 },
  tfBtn: { flex: 1, height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tfTrue: { backgroundColor: colors.green, boxShadow: '0px 6px 16px rgba(30, 127, 85, 0.28)' },
  tfFalse: { backgroundColor: '#D8483B', boxShadow: '0px 6px 16px rgba(216, 72, 59, 0.28)' },
  tfPickedRight: { outlineStyle: 'solid', outlineWidth: 3, outlineColor: '#A9DDBF' } as object,
  tfPickedWrong: { outlineStyle: 'solid', outlineWidth: 3, outlineColor: '#F0B3AC' } as object,
  tfText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  feedbackRight: { backgroundColor: '#DCF3E5', borderColor: '#A9DDBF' },
  feedbackWrong: { backgroundColor: '#FBE0DD', borderColor: '#F0B3AC' },
  feedbackTitle: { fontSize: 14, fontWeight: '800' },
  feedbackSub: { fontSize: 13, color: colors.text, marginTop: 1, fontWeight: '600' },
});
