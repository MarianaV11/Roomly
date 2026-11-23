import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthHydration } from "@/features/auth";
import { ThemeProvider } from "@/features/settings";
import { cn } from "@/lib/utils";

const montserratHeading = Montserrat({ subsets: ["latin"], variable: "--font-heading" });

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roomly",
  description: "Converse com qualquer pessoa, em conversas diretas ou grupos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-mono",
        jetbrainsMono.variable,
        montserratHeading.variable,
      )}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <AuthHydration />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
