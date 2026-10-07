import { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
  color: string;
  trackColor: string;
  children?: ReactNode;
};

/** Даврашакл прогресс-бар. */
export function ProgressRing({ size = 44, stroke = 5, progress, color, trackColor, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const m = size / 2;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={m} cy={m} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={m}
          cy={m}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${m} ${m})`}
        />
      </Svg>
      {children}
    </View>
  );
}
