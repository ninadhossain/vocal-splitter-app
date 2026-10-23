import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AI Audio Stem Separator — Studio DAW & Demucs v4 Vocal Remover",
  description: "State-of-the-art AI stem separation engine. Extract vocals, drums, bass, and instrumental tracks with Meta Demucs v4 neural architecture and synchronized multi-track Wavesurfer player.",
  keywords: ["vocal remover", "stem separator", "demucs v4", "splitter ai", "audio mastering", "multitrack player"],
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <body className="min-h-full bg-[#080B14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
