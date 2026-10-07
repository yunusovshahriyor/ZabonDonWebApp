import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

export function Coin({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill={colors.coinOuter} />
      <Circle cx="12" cy="12" r="8" fill={colors.coinInner} />
      <Path
        d="M11.2,7.5h1.6v1.2c1.4,0.2 2.3,1 2.4,2.3h-1.7c-0.1,-0.7 -0.6,-1.1 -1.5,-1.1 -0.9,0 -1.4,0.4 -1.4,1 0,0.6 0.5,0.9 1.8,1.2 1.9,0.4 3,1.1 3,2.7 0,1.4 -1,2.3 -2.6,2.5v1.2h-1.6v-1.2c-1.7,-0.2 -2.7,-1.2 -2.8,-2.7h1.7c0.1,0.9 0.7,1.4 1.7,1.4 1,0 1.6,-0.4 1.6,-1.1 0,-0.6 -0.4,-0.9 -1.7,-1.2 -2,-0.5 -3.1,-1.1 -3.1,-2.7 0,-1.3 0.9,-2.2 2.5,-2.4z"
        fill={colors.coinDetail}
      />
    </Svg>
  );
}
