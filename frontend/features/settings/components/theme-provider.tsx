"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Light/dark theme via a `.dark` class on <html> (what globals.css expects).
 * Starts by following the OS setting; the choice is remembered in this browser.
 * No disableTransitionOnChange: it would cut the theme switch's own animation.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
