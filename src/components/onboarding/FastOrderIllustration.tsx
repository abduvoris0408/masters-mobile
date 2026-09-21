import Svg, { Circle, Path, Rect, type SvgProps } from "react-native-svg";

// Scene: an order/receipt sheet with a checkmark and a lightning bolt badge —
// pairs with the "fast and easy ordering" onboarding copy.
export function FastOrderIllustration(props: SvgProps) {
  return (
    <Svg viewBox="0 0 240 240" fill="none" {...props}>
      <Circle cx="120" cy="120" r="110" fill="#16A34A" fillOpacity={0.08} />

      {/* Order sheet, slightly rotated for depth */}
      <Rect x="58" y="52" width="120" height="150" rx="16" fill="#FFFFFF" stroke="#16A34A" strokeOpacity={0.12} strokeWidth={2} transform="rotate(-4 118 127)" />
      <Rect x="64" y="58" width="120" height="150" rx="16" fill="#FFFFFF" stroke="#16A34A" strokeOpacity={0.18} strokeWidth={2} />

      {/* Sheet header */}
      <Rect x="80" y="76" width="60" height="7" rx="3.5" fill="#171421" fillOpacity={0.55} />
      <Rect x="80" y="90" width="40" height="5" rx="2.5" fill="#79748A" fillOpacity={0.5} />

      {/* Line items */}
      <Circle cx="84" cy="114" r="3.5" fill="#16A34A" />
      <Rect x="94" y="111" width="70" height="5" rx="2.5" fill="#79748A" fillOpacity={0.45} />
      <Circle cx="84" cy="130" r="3.5" fill="#16A34A" />
      <Rect x="94" y="127" width="56" height="5" rx="2.5" fill="#79748A" fillOpacity={0.45} />
      <Circle cx="84" cy="146" r="3.5" fill="#16A34A" />
      <Rect x="94" y="143" width="64" height="5" rx="2.5" fill="#79748A" fillOpacity={0.45} />

      {/* Dashed divider */}
      <Path d="M80 164H168" stroke="#E8E6F0" strokeWidth={2} strokeDasharray="4 5" />

      {/* Confirm button */}
      <Rect x="80" y="176" width="88" height="24" rx="12" fill="#16A34A" />
      <Path d="M112 188L119 195L136 178" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Lightning badge, floating top-right */}
      <Circle cx="182" cy="70" r="26" fill="#059669" />
      <Path d="M186 56L172 78H182L178 92L196 68H184L186 56Z" fill="#FFFFFF" />

      {/* Floating accents */}
      <Circle cx="48" cy="88" r="5" fill="#16A34A" fillOpacity={0.35} />
      <Circle cx="200" cy="150" r="4" fill="#059669" fillOpacity={0.35} />
    </Svg>
  );
}
