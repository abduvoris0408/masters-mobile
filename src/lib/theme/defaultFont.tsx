import { useContext, type ComponentProps, type ComponentType } from "react";

// The real exports object every `import { Text } from "react-native"` reads
// from (`import * as` could hand back an interop copy instead).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactNative: typeof import("react-native") = require("react-native");

const REGULAR = { fontFamily: "GolosText_400Regular" };

// A `font-*` class (tailwind.config.js maps them to Golos weight files)
// already picks the family; adding the default as an inline style would
// override it, since NativeWind ranks inline styles above classes.
const FONT_CLASS = /(?:^|\s)font-(?:regular|medium|semibold|bold)(?:\s|$)/;

let applied = false;

// Makes Golos the app-wide default font for <Text>/<TextInput>.
//
// The old `Text.defaultProps.style` trick stopped working: React 19 resolves
// defaultProps for class components only, and RN's Text/TextInput are
// function components — so every text without an explicit fontFamily fell
// back to SF Pro / Roboto next to Golos text. Instead, swap the `Text` and
// `TextInput` exports of the react-native module (plain configurable getters)
// for thin wrappers. Call sites read `ReactNative.Text` at render time, so
// running this before the first render covers the whole app.
//
// The wrappers render the original components through NativeWind's JSX
// runtime (this is a .tsx file), so `className` still works.
export function applyGolosAsDefaultFont() {
  if (applied) return;
  applied = true;

  const BaseText = ReactNative.Text;
  const BaseTextInput = ReactNative.TextInput;
  const TextAncestor = ReactNative.unstable_TextAncestorContext;

  function GolosText(props: ComponentProps<typeof BaseText>) {
    // Nested <Text> inherits its parent's font — forcing regular here would
    // break e.g. a semibold sentence with a colored inline span.
    const nested = useContext(TextAncestor);
    const className = (props as { className?: string }).className;
    if (nested || (className && FONT_CLASS.test(className))) return <BaseText {...props} />;
    return <BaseText {...props} style={[REGULAR, props.style]} />;
  }
  GolosText.displayName = "Text";

  function GolosTextInput(props: ComponentProps<typeof BaseTextInput>) {
    const className = (props as { className?: string }).className;
    if (className && FONT_CLASS.test(className)) return <BaseTextInput {...props} />;
    return <BaseTextInput {...props} style={[REGULAR, props.style]} />;
  }
  GolosTextInput.displayName = "TextInput";

  // Keep statics (e.g. TextInput.State) reachable through the wrappers.
  Object.assign(GolosText, BaseText);
  Object.assign(GolosTextInput, BaseTextInput);

  const override = (name: "Text" | "TextInput", value: ComponentType<never>) =>
    Object.defineProperty(ReactNative, name, { value, configurable: true, enumerable: true, writable: true });
  try {
    override("Text", GolosText as ComponentType<never>);
    override("TextInput", GolosTextInput as unknown as ComponentType<never>);
  } catch {
    // Module namespace not patchable — fall back to the system font rather than crash.
  }
}
