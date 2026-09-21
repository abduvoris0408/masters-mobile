import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop, type SvgProps } from "react-native-svg";

// Scene: an order/receipt sheet with a checkmark and a lightning bolt badge —
// pairs with the "fast and easy ordering" onboarding copy. Layered gradients
// + a drop shadow under the sheet give it depth instead of the earlier
// flat-fill pass.
export function FastOrderIllustration(props: SvgProps) {
  return (
    <Svg viewBox="0 0 240 240" fill="none" {...props}>
      <Defs>
        <RadialGradient id="fastBg" cx="50%" cy="42%" r="65%">
          <Stop offset="0%" stopColor="#16A34A" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#16A34A" stopOpacity={0.02} />
        </RadialGradient>
        <LinearGradient id="fastSheet" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F3FBF6" />
        </LinearGradient>
        <LinearGradient id="fastButton" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#22C55E" />
          <Stop offset="100%" stopColor="#15803D" />
        </LinearGradient>
        <LinearGradient id="fastBolt" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#34D399" />
          <Stop offset="100%" stopColor="#059669" />
        </LinearGradient>
      </Defs>

      <Circle cx="120" cy="120" r="112" fill="url(#fastBg)" />

      {/* Soft ellipse shadow under the sheet */}
      <Path d="M56 208C56 200 84 194 122 194C160 194 188 200 188 208C188 216 160 220 122 220C84 220 56 216 56 208Z" fill="#0F172A" fillOpacity={0.06} />

      {/* Order sheet, slightly rotated for depth */}
      <Rect x="56" y="48" width="122" height="154" rx="18" fill="#FFFFFF" stroke="#16A34A" strokeOpacity={0.1} strokeWidth={2} transform="rotate(-5 117 125)" />
      <Rect x="62" y="54" width="122" height="154" rx="18" fill="url(#fastSheet)" stroke="#16A34A" strokeOpacity={0.2} strokeWidth={2} />

      {/* Sheet header with category chip */}
      <Rect x="78" y="72" width="62" height="8" rx="4" fill="#171421" fillOpacity={0.6} />
      <Rect x="78" y="86" width="42" height="5" rx="2.5" fill="#79748A" fillOpacity={0.5} />
      <Rect x="150" y="70" width="20" height="20" rx="8" fill="#16A34A" fillOpacity={0.14} />
      <Path d="M156 80H164M160 76V84" stroke="#16A34A" strokeWidth={1.8} strokeLinecap="round" />

      {/* Line items with checked pips */}
      <Circle cx="82" cy="112" r="6" fill="#16A34A" />
      <Path d="M79.3 112L81.2 114L84.8 110" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="94" y="109" width="72" height="5.5" rx="2.75" fill="#79748A" fillOpacity={0.5} />

      <Circle cx="82" cy="130" r="6" fill="#16A34A" />
      <Path d="M79.3 130L81.2 132L84.8 128" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="94" y="127" width="58" height="5.5" rx="2.75" fill="#79748A" fillOpacity={0.5} />

      <Circle cx="82" cy="148" r="6" fill="#16A34A" fillOpacity={0.35} />
      <Rect x="94" y="145" width="66" height="5.5" rx="2.75" fill="#79748A" fillOpacity={0.32} />

      {/* Dashed divider */}
      <Path d="M78 168H168" stroke="#E8E6F0" strokeWidth={2} strokeDasharray="4 5" />

      {/* Price row */}
      <Rect x="78" y="176" width="36" height="5" rx="2.5" fill="#79748A" fillOpacity={0.4} />
      <Rect x="130" y="174" width="38" height="8" rx="4" fill="#16A34A" fillOpacity={0.5} />

      {/* Confirm button, glassy gradient */}
      <Rect x="78" y="192" width="90" height="26" rx="13" fill="url(#fastButton)" />
      <Path d="M110 205L117.5 212.5L136 194" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Lightning badge, floating top-right, glassy + shadow */}
      <Circle cx="188" cy="66" r="29" fill="#0F172A" fillOpacity={0.08} />
      <Circle cx="186" cy="62" r="28" fill="url(#fastBolt)" />
      <Path d="M190 46L174 72H186L181 88L202 60H188L190 46Z" fill="#FFFFFF" />
      <Circle cx="175" cy="48" r="3" fill="#FFFFFF" fillOpacity={0.55} />

      {/* Floating accents */}
      <Circle cx="44" cy="90" r="5" fill="#16A34A" fillOpacity={0.35} />
      <Circle cx="204" cy="150" r="4" fill="#059669" fillOpacity={0.35} />
      <Circle cx="36" cy="186" r="4" fill="#16A34A" fillOpacity={0.28} />
      <Path d="M212 104L217 99M217 104L212 99" stroke="#059669" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
