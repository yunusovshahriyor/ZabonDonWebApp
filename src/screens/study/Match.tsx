import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tap } from '../../components/Tap';
import { Word } from '../../data';
import { colors } from '../../theme';

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

type Sel = { side: 'ru' | 'tj'; id: number } | null;

/** Ҷуфтёбӣ: калимаи русӣ ↔ тарҷумаи тоҷикӣ. Пас аз ёфтани ҳамаи ҷуфтҳо onFinish(калимаҳои хатогидошта) даъват мешавад. */
export function MatchBoard({ pairs, onFinish }: { pairs: Word[]; onFinish: (wrongIds: number[]) => void }) {
  const left = useMemo(() => shuffle(pairs), [pairs]);
  const right = useMemo(() => shuffle(pairs), [pairs]);
  const [matched, setMatched] = useState<number[]>([]);
  const [sel, setSel] = useState<Sel>(null);
  const [bad, setBad] = useState<{ ru: number; tj: number } | null>(null);
  const wrong = useRef<Set<number>>(new Set());
  const done = useRef(false);

  useEffect(() => {
    if (matched.length === pairs.length && !done.current) {
      done.current = true;
      onFinish([...wrong.current]);
    }
  }, [matched, pairs.length, onFinish]);

  const press = (side: 'ru' | 'tj', id: number) => {
    if (bad || matched.includes(id)) return;
    if (!sel || sel.side === side) {
      setSel({ side, id });
      return;
    }
    const ruId = side === 'ru' ? id : sel.id;
    const tjId = side === 'tj' ? id : sel.id;
    if (ruId === tjId) {
      setMatched((m) => [...m, ruId]);
      setSel(null);
    } else {
      wrong.current.add(ruId).add(tjId);
      setBad({ ru: ruId, tj: tjId });
      setSel(null);
      setTimeout(() => setBad(null), 600);
    }
  };

  const style = (side: 'ru' | 'tj', id: number) => {
    if (matched.includes(id)) return [m.item, m.right];
    if (bad && bad[side] === id) return [m.item, m.wrong];
    if (sel && sel.side === side && sel.id === id) return [m.item, m.selected];
    return [m.item];
  };

  return (
    <View style={m.row}>
      <View style={m.col}>
        {left.map((w) => (
          <Tap key={w.id} style={style('ru', w.id)} onPress={() => press('ru', w.id)}>
            <Text style={m.text}>{w.ru}</Text>
          </Tap>
        ))}
      </View>
      <View style={m.col}>
        {right.map((w) => (
          <Tap key={w.id} style={style('tj', w.id)} onPress={() => press('tj', w.id)}>
            <Text style={m.text}>{w.tj}</Text>
          </Tap>
        ))}
      </View>
    </View>
  );
}

const m = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginTop: 18 },
  col: { flex: 1, gap: 10 },
  item: {
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    justifyContent: 'center',
  },
  selected: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  right: { backgroundColor: '#DCF3E5', borderColor: colors.green, opacity: 0.55 },
  wrong: { backgroundColor: '#FBE0DD', borderColor: '#D8483B' },
  text: { fontSize: 17, fontWeight: '600', color: colors.text },
});
