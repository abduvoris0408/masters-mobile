import Svg, { Circle, Path, Rect, type SvgProps } from "react-native-svg";

// Scene: a verified master profile card with a rating row and a shield/check
// badge — pairs with the "work with trusted masters" onboarding copy.
export function TrustIllustration(props: SvgProps) {
  return (
    <Svg viewBox="0 0 240 240" fill="none" {...props}>
      <Circle cx="120" cy="120" r="110" fill="#059669" fillOpacity={0.08} />

      {/* Profile card */}
      <Rect x="46" y="70" width="148" height="112" rx="18" fill="#FFFFFF" stroke="#16A34A" strokeOpacity={0.15} strokeWidth={2} />

      {/* Avatar */}
      <Circle cx="82" cy="104" r="20" fill="#16A34A" fillOpacity={0.18} />
      <Circle cx="82" cy="98" r="8" fill="#16A34A" />
      <Path d="M64 118C64 108 72 104 82 104C92 104 100 108 100 118" fill="#16A34A" />

      {/* Name + role lines */}
      <Rect x="112" y="92" width="64" height="6" rx="3" fill="#171421" fillOpacity={0.55} />
      <Rect x="112" y="104" width="44" height="5" rx="2.5" fill="#79748A" fillOpacity={0.5} />

      {/* Star rating row */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Path
          key={i}
          d="M0 -7L2.1 -2.4L7 -1.7L3.5 1.7L4.3 6.5L0 4.2L-4.3 6.5L-3.5 1.7L-7 -1.7L-2.1 -2.4Z"
          transform={`translate(${118 + i * 14}, 128)`}
          fill="#F59E0B"
        />
      ))}

      {/* Divider + footer stat */}
      <Rect x="62" y="150" width="116" height="1.5" fill="#E8E6F0" />
      <Rect x="62" y="162" width="54" height="5" rx="2.5" fill="#79748A" fillOpacity={0.5} />
      <Rect x="146" y="158" width="32" height="14" rx="7" fill="#16A34A" fillOpacity={0.15} />
      <Rect x="151" y="163" width="22" height="4" rx="2" fill="#16A34A" />

      {/* Verified shield badge, floating top-right of the card */}
      <Circle cx="184" cy="76" r="24" fill="#16A34A" />
      <Path
        d="M184 62L194 66V74C194 82 189 88 184 90C179 88 174 82 174 74V66L184 62Z"
        fill="#FFFFFF"
      />
      <Path d="M180 75L183 78L189 71" stroke="#16A34A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Floating accents */}
      <Circle cx="44" cy="180" r="5" fill="#059669" fillOpacity={0.35} />
      <Circle cx="200" cy="176" r="4" fill="#16A34A" fillOpacity={0.35} />
    </Svg>
  );
}
