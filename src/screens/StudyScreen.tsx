import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Tap } from '../components/Tap';
import { WordThumb } from '../components/WordThumb';
import { getAllWords, retryLoadContent, useContent } from '../content';
import { COINS_PER_WORD, Word, answer, demo, getSessionWords, markKnown, resetProgress, useProgress } from '../data';
import { STUDY_KEY, getSession, setSession } from '../session';
import { t } from '../strings';
import { colors, glass, softShadow } from '../theme';
import { Games } from './study/Games';
import { Intro, QUEUE_SIZE } from './study/Intro';
import { PrimaryBtn, StudyHeader, c } from './study/common';

type Phase = 'cards' | 'games' | 'roundDone' | 'finish';

/**
 * Ҷаласаи омӯзиш:
 *  • Карт-ҳо яккабора: "Медонам" → калима ба рӯйхати омӯхташудаҳо мегузарад;
 *    "Такрор" → ба навбати омӯзиш меравад.
 *  • Вақте навбат ба 5 калима расид (ё карт-ҳо тамом шуданд) — бозиҳо бо ҳамон калимаҳо то аз худ шудан.
 *  • Баъд карт-ҳои навбатӣ.
 */
type Saved = { deck: string[]; pos: number; queue: string[]; gameWords: string[]; phase: Phase; stats: { known: number; mastered: number; mistakes: number } };
const byIds = (ids: string[]) => {
  const all = getAllWords();
  return ids.map((id) => all.find((w) => w.id === id)).filter((w): w is Word => !!w);
};

/** Ҳолати нигоҳдошташудаи ҷаласа (пас аз навсозии саҳифа); агар вайрон бошад — null. */
function readSaved(): { deck: Word[]; pos: number; queue: Word[]; gameWords: Word[]; phase: Phase; stats: Saved['stats'] } | null {
  const sv = getSession<Saved>(STUDY_KEY);
  if (!sv) return null;
  const deck = byIds(sv.deck);
  const queue = byIds(sv.queue);
  const gameWords = byIds(sv.gameWords);
  if (deck.length !== sv.deck.length || queue.length !== sv.queue.length || gameWords.length !== sv.gameWords.length) return null;
  if (sv.phase === 'games' && gameWords.length === 0) return null;
  return { deck, pos: sv.pos, queue, gameWords, phase: sv.phase, stats: sv.stats };
}

export function StudyScreen({ onClose, categoryId }: { onClose: () => void; categoryId?: string }) {
  useProgress();
  const { status } = useContent();
  const [init] = useState(readSaved);
  const [deck, setDeck] = useState<Word[]>(() => init?.deck ?? getSessionWords(categoryId));
  const [pos, setPos] = useState(init?.pos ?? 0);
  const [queue, setQueue] = useState<Word[]>(init?.queue ?? []);
  const [gameWords, setGameWords] = useState<Word[]>(init?.gameWords ?? []);
  const [phase, setPhase] = useState<Phase>(init?.phase ?? 'cards');
  const [stats, setStats] = useState(init?.stats ?? { known: 0, mastered: 0, mistakes: 0 });

  useEffect(() => {
    setSession(STUDY_KEY, {
      deck: deck.map((w) => w.id),
      pos,
      queue: queue.map((w) => w.id),
      gameWords: gameWords.map((w) => w.id),
      phase,
      stats,
    } satisfies Saved);
  }, [deck, pos, queue, gameWords, phase, stats]);

  // Агар мундариҷа ҳанӯз бор нашуда буд ва ҳозир омад — тахтаро месозем
  useEffect(() => {
    if (status === 'ready' && pos === 0 && phase === 'cards' && deck.length === 0) setDeck(getSessionWords(categoryId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const restart = () => {
    setDeck(getSessionWords(categoryId));
    setPos(0);
    setQueue([]);
    setGameWords([]);
    setPhase('cards');
    setStats({ known: 0, mastered: 0, mistakes: 0 });
  };

  const decide = (w: Word, isKnown: boolean) => {
    const nextPos = pos + 1;
    let q = queue;
    if (isKnown) {
      markKnown(w.id);
      setStats((s) => ({ ...s, known: s.known + 1 }));
    } else {
      answer(w.id, false); // калима ба омӯзиш фиристода шуд (ҳолат: "барои такрор")
      q = [...queue, w];
    }
    setPos(nextPos);
    if (q.length >= QUEUE_SIZE || (nextPos >= deck.length && q.length > 0)) {
      setGameWords(q);
      setQueue([]);
      setPhase('games');
    } else {
      setQueue(q);
      if (nextPos >= deck.length) setPhase('finish');
    }
  };

  // Мундариҷа аз база бор мешавад / хато
  if (deck.length === 0 && status !== 'ready') {
    return (
      <View style={{ flex: 1 }}>
        <StudyHeader onClose={onClose} progress={0} label="" />
        <View style={s.center}>
          <Text style={s.title}>{status === 'error' ? t.loadError : t.loading}</Text>
          {status === 'error' ? (
            <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
              <PrimaryBtn label={t.retry} onPress={retryLoadContent} />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // Ҳама калимаҳо омӯхта шудаанд
  if (deck.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <StudyHeader onClose={onClose} progress={1} label="" />
        <View style={s.center}>
          <View style={s.bigIcon}>
            <Icon name="check" size={36} color={colors.green} strokeWidth={2.4} />
          </View>
          <Text style={s.title}>{t.allDone}</Text>
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <PrimaryBtn
              label={t.resetProgress}
              onPress={() => {
                resetProgress();
                restart();
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'cards') {
    const w = deck[pos];
    return (
      <Intro
        key={w.id}
        word={w}
        pos={pos}
        total={deck.length}
        queue={queue.length}
        onClose={onClose}
        onKnow={() => decide(w, true)}
        onRepeat={() => decide(w, false)}
      />
    );
  }

  if (phase === 'games') {
    return (
      <Games
        key={gameWords.map((w) => w.id).join('-')}
        words={gameWords}
        onClose={onClose}
        onDone={(m) => {
          setStats((x) => ({ ...x, mastered: x.mastered + gameWords.length, mistakes: x.mistakes + m }));
          setPhase(pos >= deck.length ? 'finish' : 'roundDone');
        }}
      />
    );
  }

  if (phase === 'roundDone') {
    return (
      <View style={{ flex: 1 }}>
        <StudyHeader onClose={onClose} progress={pos / deck.length} label={`${pos}/${deck.length}`} />
        <View style={s.center}>
          <View style={s.bigIcon}>
            <Icon name="award" size={36} color={colors.green} strokeWidth={2} />
          </View>
          <Text style={s.title}>{t.roundDone(gameWords.length)}</Text>
          <View style={s.chips}>
            {gameWords.map((w) => (
              <View key={w.id} style={s.wordChip}>
                <WordThumb image={w.image} letter={w.ru} size={34} radius={10} />
                <Text style={s.wordChipText}>
                  {w.ru} — {w.tj}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <PrimaryBtn label={t.nextRound} onPress={() => setPhase('cards')} />
          </View>
        </View>
      </View>
    );
  }

  // Натиҷаи ниҳоӣ
  const pct = Math.min(100, Math.round((demo.daily / demo.goal) * 100));
  const results = [
    { n: stats.mastered, l: t.masteredStat, color: colors.green },
    { n: stats.known, l: t.alreadyKnown, color: '#2F6FD6' },
    { n: stats.mistakes, l: t.mistakes, color: '#B96A00' },
    { n: `+${stats.mastered * COINS_PER_WORD}`, l: t.finishCoins, color: colors.text },
  ];
  return (
    <View style={{ flex: 1 }}>
      <StudyHeader onClose={onClose} progress={1} label={`${deck.length}/${deck.length}`} />
      <ScrollView contentContainerStyle={s.finishWrap} showsVerticalScrollIndicator={false}>
        <View style={s.bigIcon}>
          <Icon name="award" size={36} color={colors.green} strokeWidth={2} />
        </View>
        <Text style={s.title}>{t.finishTitle}</Text>
        <View style={s.grid}>
          {results.map((r) => (
            <View key={r.l} style={[s.resultCard, softShadow, glass]}>
              <Text style={[s.resultNum, { color: r.color }]}>{r.n}</Text>
              <Text style={s.resultLbl}>{r.l}</Text>
            </View>
          ))}
        </View>
        <View style={[s.goalBox, softShadow, glass]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[s.resultLbl, { flex: 1, fontSize: 14, marginTop: 0, textAlign: 'left' }]}>{t.studiedToday}</Text>
            <Text style={s.goalNum}>
              {demo.daily} / {demo.goal}
            </Text>
          </View>
          <View style={[c.track, { marginTop: 10, flex: 0, width: '100%' }]}>
            <View style={[c.fill, { width: `${pct}%` }]} />
          </View>
        </View>
        <View style={{ alignSelf: 'stretch', marginTop: 20 }}>
          <PrimaryBtn label={t.backHome} onPress={onClose} />
        </View>
        <Tap
          style={{ marginTop: 16, padding: 8 }}
          onPress={() => {
            resetProgress();
            restart();
          }}
        >
          <Text style={s.resetLink}>{t.resetProgress}</Text>
        </Tap>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  finishWrap: { alignItems: 'center', padding: 24, paddingTop: 36 },
  bigIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 18, fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  chips: { alignSelf: 'stretch', marginTop: 20, gap: 8 },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  wordChipText: { fontSize: 16, fontWeight: '600', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24, alignSelf: 'stretch' },
  resultCard: { width: '48%', flexGrow: 1, padding: 14, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center' },
  resultNum: { fontSize: 28, fontWeight: '800', color: colors.text },
  resultLbl: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  goalBox: { alignSelf: 'stretch', marginTop: 12, padding: 16, borderRadius: 20, backgroundColor: colors.card },
  goalNum: { fontSize: 20, fontWeight: '800', color: colors.green },
  resetLink: { fontSize: 12, color: colors.textTertiary, textDecorationLine: 'underline' },
});
