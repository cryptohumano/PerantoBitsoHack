import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ProgressProvider } from "@/context/progress-context";
import { GlobalProgressBar } from "@/components/global-progress-bar";
import { KiltProvider } from "@/components/KiltProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={jetbrains.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProgressProvider>
            <GlobalProgressBar />
            <AuthProvider>
              <KiltProvider>
                {children}
                <Toaster />
              </KiltProvider>
            </AuthProvider>
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}