import Svg, { Circle, Path, Rect, type SvgProps } from "react-native-svg";

// Scene: a phone showing a list of master cards being searched — pairs with
// the "find the right master" onboarding copy.
export function BrowseIllustration(props: SvgProps) {
  return (
    <Svg viewBox="0 0 240 240" fill="none" {...props}>
      <Circle cx="120" cy="120" r="110" fill="#16A34A" fillOpacity={0.08} />

      {/* Phone body */}
      <Rect x="66" y="44" width="108" height="168" rx="20" fill="#FFFFFF" stroke="#16A34A" strokeOpacity={0.15} strokeWidth={2} />
      <Rect x="66" y="44" width="108" height="168" rx="20" fill="#16A34A" fillOpacity={0.06} />

      {/* List rows (master cards) */}
      <Rect x="80" y="66" width="80" height="26" rx="8" fill="#FFFFFF" />
      <Circle cx="93" cy="79" r="7" fill="#16A34A" fillOpacity={0.35} />
      <Rect x="106" y="74" width="42" height="4" rx="2" fill="#16A34A" fillOpacity={0.35} />
      <Rect x="106" y="82" width="28" height="4" rx="2" fill="#79748A" fillOpacity={0.35} />

      <Rect x="80" y="98" width="80" height="26" rx="8" fill="#FFFFFF" />
      <Circle cx="93" cy="111" r="7" fill="#059669" fillOpacity={0.35} />
      <Rect x="106" y="106" width="42" height="4" rx="2" fill="#059669" fillOpacity={0.35} />
      <Rect x="106" y="114" width="28" height="4" rx="2" fill="#79748A" fillOpacity={0.35} />

      <Rect x="80" y="130" width="80" height="26" rx="8" fill="#FFFFFF" />
      <Circle cx="93" cy="143" r="7" fill="#16A34A" fillOpacity={0.35} />
      <Rect x="106" y="138" width="42" height="4" rx="2" fill="#16A34A" fillOpacity={0.35} />
      <Rect x="106" y="146" width="28" height="4" rx="2" fill="#79748A" fillOpacity={0.35} />

      {/* Magnifier over the phone */}
      <Circle cx="176" cy="168" r="26" fill="#16A34A" />
      <Circle cx="176" cy="168" r="26" fill="#FFFFFF" fillOpacity={0.001} />
      <Circle cx="170" cy="162" r="12" stroke="#FFFFFF" strokeWidth={4} fill="none" />
      <Path d="M179 171L188 180" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />

      {/* Floating accents */}
      <Circle cx="52" cy="70" r="6" fill="#059669" fillOpacity={0.4} />
      <Circle cx="196" cy="60" r="4" fill="#16A34A" fillOpacity={0.4} />
      <Circle cx="46" cy="176" r="5" fill="#16A34A" fillOpacity={0.3} />
    </Svg>
  );
}
