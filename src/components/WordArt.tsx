import { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

// Иллюстратсияҳои вектории калимаҳои намунавӣ (viewBox 200×130). Дар барномаи воқеӣ ба ҷои онҳо акси калима (image URL) истифода мешавад.
const SKIN = '#F5C9A0';
const SKIN_D = '#E8A877';
const RED = '#E4574B';
const INK = '#2B3445';

export const ART_BG: Record<number, string> = {
  1: '#FFE9CF',
  2: '#FFDFE5',
  3: '#E7E0FF',
  4: '#FFF0D4',
  5: '#DDF1FF',
  6: '#E3F5E1',
  7: '#FFE8F1',
  8: '#E5EBFF',
  9: '#E1F0FA',
  10: '#ECECF4',
};

const art: Record<number, () => ReactNode> = {
  // привет — рафи даст
  1: () => (
    <>
      <Path d="M152 30 Q167 46 152 62" stroke="#F0A04B" strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M164 18 Q188 46 164 74" stroke="#F0A04B" strokeWidth={5} fill="none" strokeLinecap="round" />
      <G transform="rotate(-12 95 80)">
        <Rect x={70} y={46} width={15} height={46} rx={7.5} fill={SKIN} />
        <Rect x={87} y={36} width={15} height={56} rx={7.5} fill={SKIN} />
        <Rect x={104} y={40} width={15} height={52} rx={7.5} fill={SKIN} />
        <Rect x={121} y={52} width={14} height={40} rx={7} fill={SKIN} />
        <Rect x={66} y={68} width={72} height={48} rx={24} fill={SKIN} />
        <Ellipse cx={64} cy={90} rx={9} ry={17} fill={SKIN_D} transform="rotate(-25 64 90)" />
      </G>
    </>
  ),
  // спасибо — дил
  2: () => (
    <>
      <Path d="M100 112 C42 74 50 26 100 54 C150 26 158 74 100 112 Z" fill={RED} />
      <Path d="M70 48 q6 -9 17 -5" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.55} />
      <Path d="M32 34 v14 M25 41 h14" stroke="#F0A04B" strokeWidth={4} strokeLinecap="round" />
      <Path d="M166 38 v12 M160 44 h12" stroke="#F0A04B" strokeWidth={4} strokeLinecap="round" />
      <Path d="M158 100 v10 M153 105 h10" stroke="#F0A04B" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  // пожалуйста — тӯҳфа
  3: () => (
    <>
      <Ellipse cx={100} cy={118} rx={54} ry={5} fill="rgba(0,0,0,0.07)" />
      <Rect x={56} y={64} width={88} height={52} rx={6} fill="#8C6BE8" />
      <Rect x={48} y={50} width={104} height={18} rx={5} fill="#A68BF2" />
      <Rect x={92} y={50} width={16} height={66} fill="#FFD66B" />
      <Path d="M100 50 C78 18 56 38 78 50 Z" fill="#FFD66B" />
      <Path d="M100 50 C122 18 144 38 122 50 Z" fill="#FFC53D" />
    </>
  ),
  // хлеб — нон
  4: () => (
    <>
      <Ellipse cx={100} cy={112} rx={64} ry={6} fill="rgba(0,0,0,0.08)" />
      <Path d="M38 86 C28 54 60 32 100 32 C140 32 172 54 162 86 C160 101 151 106 141 106 L59 106 C49 106 40 101 38 86 Z" fill="#D9984F" />
      <Path d="M52 66 C56 48 76 40 100 40 C124 40 144 48 148 66" stroke="#E9B472" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M72 52 l12 22 M98 50 l12 24 M124 52 l12 22" stroke="#F6DDB0" strokeWidth={8} strokeLinecap="round" />
    </>
  ),
  // вода — об
  5: () => (
    <>
      <Path d="M62 28 L138 28 L128 112 Q127 119 120 119 L80 119 Q73 119 72 112 Z" fill="#CFEAFF" stroke="#8CC4F5" strokeWidth={3} />
      <Path d="M66 54 L134 54 L128 112 Q127 119 120 119 L80 119 Q73 119 72 112 Z" fill="#5BB5FF" />
      <Rect x={77} y={40} width={6} height={62} rx={3} fill="#fff" opacity={0.55} />
      <Path d="M168 22 C160 38 154 45 154 54 a14 14 0 0 0 28 0 C182 45 176 38 168 22 Z" fill="#5BB5FF" />
    </>
  ),
  // дом — хона
  6: () => (
    <>
      <Rect x={0} y={108} width={200} height={22} fill="#BFE5B5" />
      <Rect x={55} y={62} width={90} height={52} fill="#F6D7A7" />
      <Polygon points="44,66 100,20 156,66" fill={RED} />
      <Rect x={90} y={84} width={20} height={30} rx={3} fill="#8A5A2B" />
      <Rect x={64} y={74} width={18} height={18} rx={2} fill="#CFEAFF" />
      <Rect x={118} y={74} width={18} height={18} rx={2} fill="#CFEAFF" />
      <Rect x={168} y={88} width={6} height={26} fill="#8A5A2B" />
      <Circle cx={171} cy={80} r={17} fill="#5CB85C" />
    </>
  ),
  // друг — дӯст
  7: () => (
    <>
      <Circle cx={70} cy={50} r={17} fill={SKIN} />
      <Path d="M40 116 C40 80 100 80 100 116 Z" fill="#4DA3FF" />
      <Circle cx={130} cy={50} r={17} fill={SKIN_D} />
      <Path d="M100 116 C100 80 160 80 160 116 Z" fill="#FF8FB1" />
      <Path d="M100 40 C88 28 90 14 100 20 C110 14 112 28 100 40 Z" fill={RED} />
    </>
  ),
  // книга — китоб
  8: () => (
    <>
      <Path d="M100 40 C80 30 55 30 38 38 L38 102 C55 94 80 94 100 104 Z" fill="#fff" stroke="#6C8CE8" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M100 40 C120 30 145 30 162 38 L162 102 C145 94 120 94 100 104 Z" fill="#fff" stroke="#6C8CE8" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M50 52 q22 -4 40 4 M50 66 q22 -4 40 4 M50 80 q22 -4 40 4" stroke="#B9C8F5" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M110 56 q18 -8 40 -4 M110 70 q18 -8 40 -4 M110 84 q18 -8 40 -4" stroke="#B9C8F5" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M32 106 C55 99 80 99 100 111 C120 99 145 99 168 106" stroke="#6C8CE8" strokeWidth={4} fill="none" strokeLinecap="round" />
    </>
  ),
  // город — шаҳр
  9: () => (
    <>
      <Circle cx={162} cy={32} r={14} fill="#FFD66B" />
      <Rect x={28} y={62} width={34} height={54} fill="#7C93C9" />
      <Rect x={66} y={36} width={38} height={80} fill="#5E78B8" />
      <Rect x={108} y={70} width={30} height={46} fill="#7C93C9" />
      <Rect x={142} y={52} width={32} height={64} fill="#5E78B8" />
      {[
        [34, 70], [46, 70], [34, 84], [46, 84], [34, 98], [46, 98],
        [74, 46], [88, 46], [74, 62], [88, 62], [74, 78], [88, 78], [74, 94], [88, 94],
        [114, 78], [126, 78], [114, 92], [126, 92],
        [149, 60], [161, 60], [149, 76], [161, 76], [149, 92], [161, 92],
      ].map(([x, y]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={7} height={8} rx={1} fill="#fff" opacity={0.75} />
      ))}
      <Rect x={0} y={114} width={200} height={16} fill="#3E4F7A" />
    </>
  ),
  // работа — кор
  10: () => (
    <>
      <Rect x={20} y={106} width={160} height={8} rx={4} fill="#C98A4B" />
      <Rect x={50} y={36} width={100} height={64} rx={7} fill={INK} />
      <Rect x={56} y={42} width={88} height={52} rx={3} fill="#8FD0FF" />
      <Rect x={63} y={52} width={42} height={5} rx={2.5} fill="#fff" />
      <Rect x={63} y={63} width={62} height={5} rx={2.5} fill="#fff" opacity={0.8} />
      <Rect x={63} y={74} width={30} height={5} rx={2.5} fill="#fff" opacity={0.8} />
      <Path d="M38 100 H162 L155 108 H45 Z" fill="#9AA5B8" />
      <Rect x={164} y={86} width={18} height={20} rx={3} fill={RED} />
      <Path d="M182 91 h3 a5 5 0 0 1 0 10 h-3" stroke={RED} strokeWidth={3} fill="none" />
    </>
  ),
};

export function WordArt({ id, height = 160 }: { id: number; height?: number }) {
  const draw = art[id];
  return (
    <Svg width="100%" height={height} viewBox="0 0 200 130" preserveAspectRatio="xMidYMid meet">
      {draw ? draw() : null}
    </Svg>
  );
}
