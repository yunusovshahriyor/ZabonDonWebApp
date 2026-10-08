import { Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { PullToRefresh } from '../../components/PullToRefresh';
import { Tap } from '../../components/Tap';
import { WordArt, ART_BG } from '../../components/WordArt';
import type { Word } from '../../data';
import { t } from '../../strings';
import { colors } from '../../theme';
import { StudyHeader, c, speak } from './common';

export const QUEUE_SIZE = 5;
const IMAGE_H = 128;

type Props = {
  word: Word;
  pos: number; // индекси калима дар тахта
  total: number; // шумораи калимаҳои тахта
  queue: number; // чанд калима ба омӯзиш фиристода шудааст
  onKnow: () => void;
  onRepeat: () => void;
  onClose: () => void;
};

/** Корти шиносӣ: расм (боло) + калима, транскрипсия ва тарҷума (поён, дар марказ); поён: "Медонам" / "Такрор". */
export function Intro({ word: w, pos, total, queue, onKnow, onRepeat, onClose }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <StudyHeader onClose={onClose} progress={pos / total} label={`${pos + 1}/${total}`} />

      <PullToRefresh contentContainerStyle={{ padding: 20, paddingBottom: 110, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Навбати омӯзиш: 5 ҷой */}
        <View style={s.queueRow}>
          <Text style={s.queueLabel}>{t.queueLabel}</Text>
          <View style={s.slots}>
            {Array.from({ length: QUEUE_SIZE }).map((_, i) => (
              <View key={i} style={[s.slot, i < queue && s.slotOn]} />
            ))}
          </View>
          <Text style={s.queueCount}>
            {queue}/{QUEUE_SIZE}
          </Text>
        </View>

        {/* Корт дар мобайни экран */}
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 30 }}>
        <View key={w.id} style={s.card}>
          {/* Расм */}
          <View style={[s.imageBox, { backgroundColor: ART_BG[w.id] ?? '#F3F6FB' }]}>
            {w.image ? <Image source={{ uri: w.image }} style={s.photo} resizeMode="cover" /> : <WordArt id={w.id} height={IMAGE_H - 10} />}
            <Tap style={s.speak} onPress={() => speak(w.ru)}>
              <Icon name="volume" size={22} color={colors.green} strokeWidth={2} />
            </Tap>
          </View>

          {/* Калима (боло) ва тарҷума (поён) */}
          <View style={s.text}>
            <View style={s.pair}>
              <Text style={s.ru}>{w.ru}</Text>
              <Text style={s.tj}>{w.tj}</Text>
            </View>

            {/* Ҷумлаи намунавӣ */}
            <View style={s.example}>
              <View style={s.exBar} />
              <View style={{ flex: 1 }}>
                <Text style={s.exRu}>{w.exRu}</Text>
                <Text style={s.exTj}>{w.exTj}</Text>
              </View>
              <Tap style={s.exSpeak} onPress={() => speak(w.exRu)}>
                <Icon name="volume" size={16} color={colors.green} />
              </Tap>
            </View>
          </View>
        </View>
        </View>
      </PullToRefresh>

      <View style={[c.actions, { flexDirection: 'row', gap: 12 }]}>
        <Tap style={[s.btn, s.btnKnow]} onPress={onKnow}>
          <Icon name="check" size={20} color="#fff" strokeWidth={2.6} />
          <Text style={s.btnText}>{t.know}</Text>
        </Tap>
        <Tap style={[s.btn, s.btnRepeat]} onPress={onRepeat}>
          <Icon name="cap" size={20} color="#B96A00" strokeWidth={2} />
          <Text style={[s.btnText, { color: '#B96A00' }]}>{t.dontKnow}</Text>
        </Tap>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  queueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  queueLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  slots: { flex: 1, flexDirection: 'row', gap: 5 },
  slot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.track },
  slotOn: { backgroundColor: '#E8A33A' },
  queueCount: { fontSize: 12, fontWeight: '800', color: colors.text },

  card: { borderRadius: 24, backgroundColor: '#fff', overflow: 'hidden', boxShadow: '0px 14px 34px rgba(20, 60, 40, 0.14)' },
  imageBox: { height: IMAGE_H, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  speak: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 10px rgba(20, 30, 50, 0.15)',
  },
  text: { padding: 12, gap: 10 },
  pair: { alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#F3F8F5' },
  ru: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3, textAlign: 'center' },
  tj: { fontSize: 16, fontWeight: '700', color: colors.green, marginTop: 0, textAlign: 'center' },
  example: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingRight: 8, paddingLeft: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.hairline },
  exBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.greenLine },
  exRu: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 19 },
  exTj: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  exSpeak: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },

  btn: { flex: 1, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnKnow: { backgroundColor: colors.green, boxShadow: '0px 8px 20px rgba(30, 127, 85, 0.28)' },
  btnRepeat: { backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1.5, borderColor: '#E8B35A' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
