import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tap } from '../../components/Tap';
import { Word } from '../../data';
import { colors } from '../../theme';

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

// Ранги ҷуфтҳои интихобшуда (то корбар бинад кадом калима бо кадом пайваст аст).
const LINK_COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

type Sel = { side: 'ru' | 'tj'; id: number } | null;

/**
 * Ҷуфтёбӣ: калимаи русӣ ↔ тарҷумаи тоҷикӣ.
 * Ҷуфтҳо бе санҷиши фаврӣ гузошта мешаванд (пахши такрорӣ ҷуфтро бекор мекунад).
 * Вақте ҳамаи калимаҳо пайваст шуданд, дурустӣ як бор санҷида мешавад ва onFinish(калимаҳои хатогидошта) даъват мешавад.
 */
export function MatchBoard({ pairs, onFinish }: { pairs: Word[]; onFinish: (wrongIds: number[]) => void }) {
  const left = useMemo(() => shuffle(pairs), [pairs]);
  const right = useMemo(() => shuffle(pairs), [pairs]);
  const [links, setLinks] = useState<Record<number, number>>({}); // id-и русӣ → id-и тоҷикӣ
  const [sel, setSel] = useState<Sel>(null);
  const [finished, setFinished] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (Object.keys(links).length !== pairs.length || done.current) return;
    done.current = true;
    setFinished(true);
    const wrong = new Set<number>();
    for (const [ru, tj] of Object.entries(links)) {
      if (Number(ru) !== tj) wrong.add(Number(ru)).add(tj);
    }
    onFinish([...wrong]);
  }, [links, pairs.length, onFinish]);

  const press = (side: 'ru' | 'tj', id: number) => {
    if (finished) return;
    const linkedTj = side === 'ru' ? links[id] : undefined;
    const linkedRu = side === 'tj' ? Number(Object.keys(links).find((k) => links[Number(k)] === id)) : undefined;
    // Пахши калимаи аллакай пайвастшуда — пайвастро бекор мекунад.
    if (linkedTj !== undefined || (linkedRu !== undefined && !Number.isNaN(linkedRu))) {
      const ruId = side === 'ru' ? id : (linkedRu as number);
      setLinks((l) => {
        const { [ruId]: _, ...rest } = l;
        return rest;
      });
      setSel(null);
      return;
    }
    if (!sel || sel.side === side) {
      setSel({ side, id });
      return;
    }
    const ruId = side === 'ru' ? id : sel.id;
    const tjId = side === 'tj' ? id : sel.id;
    setLinks((l) => ({ ...l, [ruId]: tjId }));
    setSel(null);
  };

  const ruIds = pairs.map((p) => p.id);
  const colorOf = (ruId: number) => LINK_COLORS[ruIds.indexOf(ruId) % LINK_COLORS.length];

  const style = (side: 'ru' | 'tj', id: number) => {
    const ruId = side === 'ru' ? id : Number(Object.keys(links).find((k) => links[Number(k)] === id));
    const linked = side === 'ru' ? id in links : !Number.isNaN(ruId);
    if (linked) {
      if (finished) return [m.item, links[ruId] === ruId ? m.right : m.wrong];
      const c = colorOf(ruId);
      return [m.item, { borderColor: c, backgroundColor: `${c}22` }];
    }
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
  right: { backgroundColor: '#DCF3E5', borderColor: colors.green },
  wrong: { backgroundColor: '#FBE0DD', borderColor: '#D8483B' },
  text: { fontSize: 17, fontWeight: '600', color: colors.text },
});
