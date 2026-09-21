import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop, type SvgProps } from "react-native-svg";

// Scene: a verified master profile card with a rating row and a shield/check
// badge — pairs with the "work with trusted masters" onboarding copy. Layered
// gradients + a drop shadow under the card give it depth instead of the
// earlier flat-fill pass.
export function TrustIllustration(props: SvgProps) {
  return (
    <Svg viewBox="0 0 240 240" fill="none" {...props}>
      <Defs>
        <RadialGradient id="trustBg" cx="50%" cy="42%" r="65%">
          <Stop offset="0%" stopColor="#059669" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
        </RadialGradient>
        <LinearGradient id="trustCard" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F2FBF6" />
        </LinearGradient>
        <LinearGradient id="trustAvatar" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#22C55E" stopOpacity={0.28} />
          <Stop offset="100%" stopColor="#16A34A" stopOpacity={0.16} />
        </LinearGradient>
        <LinearGradient id="trustShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#22C55E" />
          <Stop offset="100%" stopColor="#15803D" />
        </LinearGradient>
        <LinearGradient id="trustStat" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#16A34A" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#16A34A" stopOpacity={0.1} />
        </LinearGradient>
      </Defs>

      <Circle cx="120" cy="120" r="112" fill="url(#trustBg)" />

      {/* Soft ellipse shadow under the card */}
      <Path d="M52 190C52 182 82 176 122 176C162 176 192 182 192 190C192 198 162 202 122 202C82 202 52 198 52 190Z" fill="#0F172A" fillOpacity={0.06} />

      {/* Profile card */}
      <Rect x="44" y="66" width="152" height="118" rx="20" fill="url(#trustCard)" stroke="#16A34A" strokeOpacity={0.16} strokeWidth={2} />

      {/* Avatar */}
      <Circle cx="84" cy="102" r="22" fill="url(#trustAvatar)" />
      <Circle cx="84" cy="96" r="9" fill="#16A34A" />
      <Path d="M64 118C64 106 73 101 84 101C95 101 104 106 104 118" fill="#16A34A" />
      <Circle cx="84" cy="102" r="22" stroke="#16A34A" strokeOpacity={0.25} strokeWidth={1.5} fill="none" />

      {/* Name + role lines */}
      <Rect x="116" y="88" width="66" height="7" rx="3.5" fill="#171421" fillOpacity={0.6} />
      <Rect x="116" y="100" width="46" height="5" rx="2.5" fill="#79748A" fillOpacity={0.5} />

      {/* Star rating row */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Path
          key={i}
          d="M0 -7.5L2.3 -2.6L7.5 -1.8L3.8 1.8L4.6 7L0 4.5L-4.6 7L-3.8 1.8L-7.5 -1.8L-2.3 -2.6Z"
          transform={`translate(${120 + i * 14.5}, 124)`}
          fill="#F59E0B"
        />
      ))}
      <Rect x="188" y="119" width="1" height="1" fill="none" />

      {/* Divider + footer stat */}
      <Path d="M60 146H180" stroke="#E8E6F0" strokeWidth={1.5} strokeDasharray="3 4" />
      <Rect x="60" y="158" width="60" height="6" rx="3" fill="#79748A" fillOpacity={0.5} />
      <Rect x="60" y="168" width="42" height="5" rx="2.5" fill="#79748A" fillOpacity={0.32} />
      <Rect x="140" y="154" width="40" height="20" rx="10" fill="url(#trustStat)" />
      <Path d="M148 164L153 169L163 157" stroke="#16A34A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="167" y="161" width="10" height="4" rx="2" fill="#16A34A" fillOpacity={0.55} />

      {/* Verified shield badge, floating top-right of the card */}
      <Circle cx="188" cy="70" r="27" fill="#0F172A" fillOpacity={0.08} />
      <Circle cx="186" cy="66" r="26" fill="url(#trustShield)" />
      <Path d="M186 51L197 55.5V65C197 74 191 81 186 83C181 81 175 74 175 65V55.5L186 51Z" fill="#FFFFFF" />
      <Path d="M181 65L184.5 68.5L192 59" stroke="#16A34A" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Floating accents */}
      <Circle cx="40" cy="184" r="5" fill="#059669" fillOpacity={0.35} />
      <Circle cx="204" cy="176" r="4" fill="#16A34A" fillOpacity={0.35} />
      <Circle cx="30" cy="86" r="4" fill="#16A34A" fillOpacity={0.3} />
      <Path d="M212 116L217 111M217 116L212 111" stroke="#059669" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
