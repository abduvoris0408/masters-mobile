import Svg, { Circle, Path, Rect, type SvgProps } from "react-native-svg";

// Shared "nothing here yet" scene — a lightly tilted empty tray/folder with
// a soft accent-tinted backdrop circle, matching the onboarding
// illustrations' restrained line-art style instead of a solid loud color
// block. Reused across every EmptyState instead of a filled Ionicons badge.
export function EmptyStateIllustration(props: SvgProps) {
  return (
    <Svg viewBox="0 0 200 200" fill="none" {...props}>
      <Circle cx="100" cy="100" r="92" fill="#16A34A" fillOpacity={0.06} />

      {/* Back folder, slightly rotated for depth */}
      <Rect x="46" y="68" width="108" height="78" rx="14" fill="#16A34A" fillOpacity={0.08} transform="rotate(-3 100 107)" />

      {/* Front tray */}
      <Path
        d="M52 96C52 91.5817 55.5817 88 60 88H80.5C82.3699 88 84.1467 88.8117 85.3679 90.2237L90.6321 96.3763C91.8533 97.7883 93.6301 98.6 95.5 98.6H140C144.418 98.6 148 102.182 148 106.6V138C148 142.418 144.418 146 140 146H60C55.5817 146 52 142.418 52 138V96Z"
        fill="#FFFFFF"
        stroke="#16A34A"
        strokeOpacity={0.35}
        strokeWidth={2.5}
      />
      <Path d="M52 112H148" stroke="#16A34A" strokeOpacity={0.2} strokeWidth={2} />

      {/* Floating dashed-outline sheet, empty state's "nothing to show" cue */}
      <Rect x="80" y="42" width="52" height="66" rx="10" fill="#FFFFFF" stroke="#79748A" strokeOpacity={0.3} strokeWidth={2} strokeDasharray="5 5" />
      <Path d="M92 60H120" stroke="#79748A" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
      <Path d="M92 72H112" stroke="#79748A" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />

      {/* Floating accents */}
      <Circle cx="44" cy="60" r="4" fill="#16A34A" fillOpacity={0.3} />
      <Circle cx="156" cy="126" r="5" fill="#059669" fillOpacity={0.25} />
      <Circle cx="150" cy="70" r="3" fill="#16A34A" fillOpacity={0.35} />
    </Svg>
  );
}
