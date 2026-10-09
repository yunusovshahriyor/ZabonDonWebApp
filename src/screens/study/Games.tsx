import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { ProgressRing } from '../../components/ProgressRing';
import { Tap } from '../../components/Tap';
import { getAllWords } from '../../content';
import { Coin } from '../../components/Coin';
import { InfoDialog } from '../../components/InfoDialog';
import { COIN_PENALTY_WRONG, COIN_REWARD_CORRECT, Word, answer, commitSessionCoins, demo, penalizeCoins, useProgress } from '../../data';
import { GAMES_KEY, clearSession, getSession, setSession } from '../../session';
import { t } from '../../strings';
import { colors, glass, softShadow } from '../../theme';
import { MatchBoard } from './Match';
import { PrimaryBtn, StudyHeader, c, haptic, speak } from './common';

// Зинаҳои азхудкунӣ: 0 → интихоби тарҷума, 1 → интихоби русӣ, 2 → навиштан,
// 3 → ҷуфтёбӣ, 4 → пур кардани ҷойи холӣ дар ҷумла, 5 → ҷамъ кардан аз ҳарфҳо, 6 → аз худ шуд.
type QType = 'pickTj' | 'pickRu' | 'type' | 'match' | 'cloze' | 'scramble';
const TYPES: QType[] = ['pickTj', 'pickRu', 'type', 'match', 'cloze', 'scramble'];
const MASTERED = TYPES.length;
const MATCH_PAIRS = 5;
const AUTO_NEXT_MS = 2000; // пас аз ҷавоби дуруст ба саволи навбатӣ худкор мегузарад

type Question = {
  word: Word;
  type: QType;
  options: string[];
  pairs?: Word[]; // match
  sentence?: string; // cloze: ҷумла бо "____" ба ҷои калима
  letters?: string[]; // scramble
};

/** Ҷумлаи мисолро бо ҷойи холӣ месозад (шакли тағйирёфтаи калима низ ёфта мешавад: вода → воды). */
function blankSentence(word: Word): string | null {
  const base = norm(word.ru);
  const stem = base.length >= 4 ? base.slice(0, -1) : base;
  let found = false;
  const out = word.exRu
    .split(/(\s+)/)
    .map((tok) => {
      const m = tok.match(/^([^\p{L}]*)(\p{L}+)(.*)$/u);
      if (!found && m && norm(m[2]).startsWith(stem)) {
        found = true;
        return `${m[1]}____${m[3]}`;
      }
      return tok;
    })
    .join('');
  return found ? out : null;
}

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

function makeQuestion(words: Word[], stage: Record<string, number>, lastSeen: Record<string, number>, lastId: string | null): Question | null {
  const open = words.filter((w) => stage[w.id] < MASTERED);
  if (open.length === 0) return null;
  let pool = open.length > 1 ? open.filter((w) => w.id !== lastId) : open;
  // Калимаи дертар пурсидашуда пештар меояд; хатогӣ зинаро паст мекунад, калима зудтар бармегардад.
  const minSeen = Math.min(...pool.map((w) => lastSeen[w.id] ?? -1));
  pool = pool.filter((w) => (lastSeen[w.id] ?? -1) === minSeen);
  const word = pool[Math.floor(Math.random() * pool.length)];
  let type = TYPES[stage[word.id]];
  const sentence = type === 'cloze' ? blankSentence(word) : null;
  if (type === 'cloze' && !sentence) type = 'pickRu'; // ҷумла нест ё калима дар он нест
  if (type === 'match') {
    const others = shuffle(words.filter((w) => w.id !== word.id)).sort((a, b) => Number(stage[b.id] === 3) - Number(stage[a.id] === 3));
    let pairs = [word, ...others].slice(0, MATCH_PAIRS);
    if (pairs.length < 3) {
      const extra = shuffle(getAllWords().filter((x) => !pairs.some((p) => p.id === x.id))).slice(0, 3 - pairs.length);
      pairs = [...pairs, ...extra];
    }
    return { word, type, options: [], pairs };
  }
  if (type === 'scramble') return { word, type, options: [], letters: scrambleLetters(word.ru) };
  let options: string[] = [];
  if (type === 'pickTj' || type === 'pickRu' || type === 'cloze') {
    const key = type === 'pickTj' ? 'tj' : 'ru';
    // Хатоҳо аввал аз ҳамон категория, баъд аз дигарон
    const others = getAllWords().filter((x) => x.id !== word.id && x[key] !== word[key]);
    const pool = [...shuffle(others.filter((x) => x.categoryId === word.categoryId)), ...shuffle(others.filter((x) => x.categoryId !== word.categoryId))];
    const wrong = [...new Set(pool.map((x) => x[key]))].slice(0, 3);
    options = shuffle([word[key], ...wrong]);
  }
  return { word, type, options, sentence: sentence ?? undefined };
}

const PROMPTS: Record<QType, string> = {
  pickTj: t.pickTjPrompt,
  pickRu: t.pickRuPrompt,
  type: t.typePrompt,
  match: t.matchPrompt,
  cloze: t.clozePrompt,
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
  const [typed, setTyped] = useState('');
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
        if (stage[w.id] !== TYPES.indexOf('match')) continue; // танҳо калимаҳои дар ин зина буда пеш меравад
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
  const correct = q.type === 'pickTj' ? q.word.tj : q.word.ru;
  const scrambleAnswer = q.letters ? built.map((i) => q.letters![i]).join('') : '';

  const submit = (value: string) => {
    if (result !== 'idle') return;
    const ok = q.type === 'type' || q.type === 'scramble' ? norm(value) === norm(q.word.ru.replace(/\s+/g, '')) : value === correct;
    setPicked(value);
    setResult(ok ? 'right' : 'wrong');
    setEarned(ok ? earnedRef.current + COIN_REWARD_CORRECT : penalizeCoins(earnedRef.current, 1));
    const cur = stage[q.word.id];
    const next = ok ? cur + 1 : Math.max(0, cur - 1);
    if (ok && next >= MASTERED) answer(q.word.id, true); // калима "омӯхташуда" мешавад (+ танга)
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
    setTyped('');
    setBuilt([]);
    setResult('idle');
  };

  advanceRef.current = advance;

  const optionStyle = (opt: string) => {
    if (result === 'idle') return [g.option];
    if (opt === correct) return [g.option, g.optionRight];
    if (opt === picked) return [g.option, g.optionWrong];
    return [g.option, { opacity: 0.45 }];
  };

  const showSpeaker = q.type === 'pickTj';
  const prompt = q.type === 'pickTj' ? q.word.ru : q.word.tj;

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
            {/* Прогреси худи ҳамин калима (зинаҳо: 0 → 3) */}
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
          {q.type === 'match' ? (
            <MatchBoard key={`${q.word.id}-${tick.current}`} pairs={q.pairs!} onFinish={finishMatch} />
          ) : null}
          {q.type !== 'match' && (
          <View style={g.promptRow}>
            <Text style={g.prompt}>{q.type === 'cloze' ? q.sentence : prompt}</Text>
            {showSpeaker ? (
              <Tap style={g.speak} onPress={() => speak(q.word.ru)}>
                <Icon name="volume" size={16} color={colors.green} />
              </Tap>
            ) : null}
          </View>
          )}
          {q.type === 'cloze' ? <Text style={g.hint}>{q.word.exTj}</Text> : null}

          {q.type === 'match' ? null : q.type === 'scramble' ? (
            <View style={{ marginTop: 12, gap: 12 }}>
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
          ) : q.type === 'type' ? (
            <View style={{ marginTop: 12 }}>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                editable={result === 'idle'}
                placeholder={t.typePlaceholder}
                placeholderTextColor={colors.textTertiary}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => typed.trim() && submit(typed)}
                style={[g.input, result === 'right' && g.optionRight, result === 'wrong' && g.optionWrong] as object}
              />
            </View>
          ) : (
            <View style={{ marginTop: 12, gap: 8 }}>
              {q.options.map((opt) => (
                <Tap key={opt} style={optionStyle(opt)} onPress={() => submit(opt)}>
                  <Text style={g.optionText}>{opt}</Text>
                </Tap>
              ))}
            </View>
          )}
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
          q.type === 'type' ? (
            <PrimaryBtn label={t.check} onPress={() => submit(typed)} disabled={!typed.trim()} />
          ) : q.type === 'scramble' ? (
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
  hint: { marginTop: 6, fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
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
  input: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: colors.greenLine,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    ...({ outlineStyle: 'none' } as object),
  },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  feedbackRight: { backgroundColor: '#DCF3E5', borderColor: '#A9DDBF' },
  feedbackWrong: { backgroundColor: '#FBE0DD', borderColor: '#F0B3AC' },
  feedbackTitle: { fontSize: 14, fontWeight: '800' },
  feedbackSub: { fontSize: 13, color: colors.text, marginTop: 1, fontWeight: '600' },
});
