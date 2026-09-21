import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop, type SvgProps } from "react-native-svg";

// Scene: a phone showing a list of master cards being searched — pairs with
// the "find the right master" onboarding copy. Layered gradients + a drop
// shadow under the phone give it depth instead of the earlier flat-fill pass.
export function BrowseIllustration(props: SvgProps) {
  return (
    <Svg viewBox="0 0 240 240" fill="none" {...props}>
      <Defs>
        <RadialGradient id="browseBg" cx="50%" cy="42%" r="65%">
          <Stop offset="0%" stopColor="#16A34A" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#16A34A" stopOpacity={0.02} />
        </RadialGradient>
        <LinearGradient id="browsePhone" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F3FBF6" />
        </LinearGradient>
        <LinearGradient id="browseGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#22C55E" />
          <Stop offset="100%" stopColor="#15803D" />
        </LinearGradient>
        <LinearGradient id="browseRow1" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#16A34A" stopOpacity={0.5} />
          <Stop offset="100%" stopColor="#16A34A" stopOpacity={0.22} />
        </LinearGradient>
      </Defs>

      <Circle cx="120" cy="112" r="112" fill="url(#browseBg)" />

      {/* Soft ellipse shadow under the phone for lift */}
      <Path d="M74 214C74 206 95 200 122 200C149 200 170 206 170 214C170 222 149 226 122 226C95 226 74 222 74 214Z" fill="#0F172A" fillOpacity={0.06} />

      {/* Phone body */}
      <Rect x="64" y="38" width="112" height="174" rx="22" fill="url(#browsePhone)" stroke="#16A34A" strokeOpacity={0.18} strokeWidth={2} />
      {/* Notch */}
      <Rect x="104" y="46" width="32" height="6" rx="3" fill="#16A34A" fillOpacity={0.2} />

      {/* Search bar */}
      <Rect x="78" y="60" width="84" height="18" rx="9" fill="#16A34A" fillOpacity={0.1} />
      <Circle cx="90" cy="69" r="4" stroke="#16A34A" strokeWidth={1.6} fill="none" />
      <Path d="M93 72L96 75" stroke="#16A34A" strokeWidth={1.6} strokeLinecap="round" />

      {/* List rows (master cards) — richer with a rating pip + accent bar */}
      <Rect x="78" y="88" width="84" height="30" rx="10" fill="#FFFFFF" />
      <Rect x="78" y="88" width="4" height="30" rx="2" fill="url(#browseRow1)" />
      <Circle cx="96" cy="103" r="9" fill="#16A34A" fillOpacity={0.35} />
      <Rect x="112" y="96" width="42" height="5" rx="2.5" fill="#16A34A" fillOpacity={0.45} />
      <Rect x="112" y="106" width="30" height="4" rx="2" fill="#79748A" fillOpacity={0.4} />

      <Rect x="78" y="124" width="84" height="30" rx="10" fill="#FFFFFF" />
      <Rect x="78" y="124" width="4" height="30" rx="2" fill="#059669" fillOpacity={0.45} />
      <Circle cx="96" cy="139" r="9" fill="#059669" fillOpacity={0.35} />
      <Rect x="112" y="132" width="42" height="5" rx="2.5" fill="#059669" fillOpacity={0.45} />
      <Rect x="112" y="142" width="30" height="4" rx="2" fill="#79748A" fillOpacity={0.4} />

      <Rect x="78" y="160" width="84" height="30" rx="10" fill="#FFFFFF" fillOpacity={0.85} />
      <Rect x="78" y="160" width="4" height="30" rx="2" fill="#16A34A" fillOpacity={0.3} />
      <Circle cx="96" cy="175" r="9" fill="#16A34A" fillOpacity={0.22} />
      <Rect x="112" y="168" width="42" height="5" rx="2.5" fill="#16A34A" fillOpacity={0.28} />
      <Rect x="112" y="178" width="30" height="4" rx="2" fill="#79748A" fillOpacity={0.28} />

      {/* Magnifier over the phone, glassy gradient + shadow */}
      <Circle cx="180" cy="164" r="30" fill="#0F172A" fillOpacity={0.08} />
      <Circle cx="178" cy="160" r="28" fill="url(#browseGlass)" />
      <Circle cx="172" cy="153" r="13" stroke="#FFFFFF" strokeWidth={4} fill="none" />
      <Path d="M182 163L192 173" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx="167" cy="148" r="3" fill="#FFFFFF" fillOpacity={0.6} />

      {/* Floating accents */}
      <Circle cx="46" cy="64" r="6" fill="#059669" fillOpacity={0.4} />
      <Circle cx="200" cy="52" r="4" fill="#16A34A" fillOpacity={0.4} />
      <Circle cx="40" cy="172" r="5" fill="#16A34A" fillOpacity={0.3} />
      <Path d="M28 120L34 114M34 120L28 114" stroke="#16A34A" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
      <Path d="M206 190L212 184M212 190L206 184" stroke="#059669" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
