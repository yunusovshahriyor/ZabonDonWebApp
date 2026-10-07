import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { ProgressRing } from '../../components/ProgressRing';
import { Tap } from '../../components/Tap';
import { WORDS, Word, answer } from '../../data';
import { t } from '../../strings';
import { colors, glass, softShadow } from '../../theme';
import { PrimaryBtn, StudyHeader, c, speak } from './common';

// Зинаҳои азхудкунӣ: 0 → интихоби тарҷума, 1 → интихоби русӣ, 2 → навиштан, 3 → аз худ шуд.
type QType = 'pickTj' | 'pickRu' | 'type';
const TYPES: QType[] = ['pickTj', 'pickRu', 'type'];
const MASTERED = 3;

type Question = { word: Word; type: QType; options: string[] };

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const norm = (s: string) => s.trim().toLowerCase().replace(/ё/g, 'е');

function makeQuestion(words: Word[], stage: Record<number, number>, lastSeen: Record<number, number>, lastId: number | null): Question | null {
  const open = words.filter((w) => stage[w.id] < MASTERED);
  if (open.length === 0) return null;
  let pool = open.length > 1 ? open.filter((w) => w.id !== lastId) : open;
  // Калимаи дертар пурсидашуда пештар меояд; хатогӣ зинаро паст мекунад, калима зудтар бармегардад.
  const minSeen = Math.min(...pool.map((w) => lastSeen[w.id] ?? -1));
  pool = pool.filter((w) => (lastSeen[w.id] ?? -1) === minSeen);
  const word = pool[Math.floor(Math.random() * pool.length)];
  const type = TYPES[stage[word.id]];
  let options: string[] = [];
  if (type !== 'type') {
    const key = type === 'pickTj' ? 'tj' : 'ru';
    const wrong = shuffle(WORDS.filter((x) => x.id !== word.id && x[key] !== word[key]).map((x) => x[key])).slice(0, 3);
    options = shuffle([word[key], ...wrong]);
  }
  return { word, type, options };
}

const promptText = (q: QType) => (q === 'pickTj' ? t.pickTjPrompt : q === 'pickRu' ? t.pickRuPrompt : t.typePrompt);

/** Бозиҳо: ҳамон 5 калима то ҳар кадом ба зинаи "аз худ шуд" расад. */
export function Games({ words, onDone, onClose }: { words: Word[]; onDone: (mistakes: number) => void; onClose: () => void }) {
  const [stage, setStage] = useState<Record<number, number>>(() => Object.fromEntries(words.map((w) => [w.id, 0])));
  const lastSeen = useRef<Record<number, number>>({});
  const lastId = useRef<number | null>(null);
  const tick = useRef(0);
  const [mistakes, setMistakes] = useState(0);
  const [q, setQ] = useState<Question | null>(() => {
    const first = makeQuestion(words, Object.fromEntries(words.map((w) => [w.id, 0])), {}, null);
    if (first) {
      lastSeen.current[first.word.id] = 0;
      lastId.current = first.word.id;
    }
    return first;
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');

  if (!q) return null;

  const mastered = words.filter((w) => stage[w.id] >= MASTERED).length;
  const correct = q.type === 'pickTj' ? q.word.tj : q.word.ru;

  const submit = (value: string) => {
    if (result !== 'idle') return;
    const ok = q.type === 'type' ? norm(value) === norm(q.word.ru) : value === correct;
    setPicked(value);
    setResult(ok ? 'right' : 'wrong');
    const cur = stage[q.word.id];
    const next = ok ? cur + 1 : Math.max(0, cur - 1);
    if (ok && next >= MASTERED) answer(q.word.id, true); // калима "омӯхташуда" мешавад (+ танга)
    if (!ok) setMistakes((m) => m + 1);
    setStage((st) => ({ ...st, [q.word.id]: next }));
  };

  const advance = () => {
    const nextStage = stage; // дар submit навсозӣ шудааст
    if (words.every((w) => nextStage[w.id] >= MASTERED)) {
      onDone(mistakes);
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
    setResult('idle');
  };

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 200 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[g.card, softShadow, glass]}>
          <View style={g.cardTop}>
            <View style={c.chip}>
              <Text style={c.chipText}>{promptText(q.type)}</Text>
            </View>
            <View style={{ flex: 1 }} />
            {/* Прогреси худи ҳамин калима (зинаҳо: 0 → 3) */}
            <ProgressRing size={46} stroke={5} progress={stage[q.word.id] / MASTERED} color={colors.green} trackColor={colors.track}>
              {stage[q.word.id] >= MASTERED ? (
                <Icon name="check" size={18} color={colors.green} strokeWidth={3} />
              ) : (
                <Text style={g.ringText}>
                  {stage[q.word.id]}/{MASTERED}
                </Text>
              )}
            </ProgressRing>
          </View>
          <View style={g.promptRow}>
            <Text style={g.prompt}>{prompt}</Text>
            {showSpeaker ? (
              <Tap style={g.speak} onPress={() => speak(q.word.ru)}>
                <Icon name="volume" size={18} color={colors.green} />
              </Tap>
            ) : null}
          </View>

          {q.type === 'type' ? (
            <View style={{ marginTop: 18 }}>
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
            <View style={{ marginTop: 18, gap: 10 }}>
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
              {result === 'wrong' ? (
                <Text style={g.feedbackSub}>
                  {t.rightAnswer} {correct}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={c.actions}>
        {result === 'idle' ? (
          q.type === 'type' ? <PrimaryBtn label={t.check} onPress={() => submit(typed)} disabled={!typed.trim()} /> : null
        ) : (
          <PrimaryBtn label={t.next} onPress={advance} tone={result === 'right' ? 'green' : 'red'} />
        )}
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  ringText: { fontSize: 11, fontWeight: '800', color: colors.text },
  card: { borderRadius: 28, padding: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  prompt: { flex: 1, fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  speak: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  option: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    justifyContent: 'center',
  },
  optionRight: { backgroundColor: '#DCF3E5', borderColor: colors.green },
  optionWrong: { backgroundColor: '#FBE0DD', borderColor: '#D8483B' },
  optionText: { fontSize: 18, fontWeight: '600', color: colors.text },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: colors.greenLine,
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    ...({ outlineStyle: 'none' } as object),
  },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1 },
  feedbackRight: { backgroundColor: '#DCF3E5', borderColor: '#A9DDBF' },
  feedbackWrong: { backgroundColor: '#FBE0DD', borderColor: '#F0B3AC' },
  feedbackTitle: { fontSize: 16, fontWeight: '800' },
  feedbackSub: { fontSize: 14, color: colors.text, marginTop: 2, fontWeight: '600' },
});
