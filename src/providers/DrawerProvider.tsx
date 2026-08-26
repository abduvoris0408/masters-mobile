import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

interface IDrawerContext {
  visible: boolean;
  open: () => void;
  close: () => void;
}

const DrawerContext = createContext<IDrawerContext | null>(null);

// Lets any tab screen's Header open the shared sidebar without each screen
// owning its own open/close state — one Drawer instance lives in the tabs
// layout (see app/(app)/(tabs)/_layout.tsx), every screen just calls open().
export function DrawerProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const value = useMemo(() => ({ visible, open: () => setVisible(true), close: () => setVisible(false) }), [visible]);
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useAppDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useAppDrawer must be used within DrawerProvider");
  return ctx;
}
