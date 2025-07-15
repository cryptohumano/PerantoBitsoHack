import { JetBrains_Mono } from "next/font/google"
import "../globals.css"

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jetbrains.className} min-h-screen w-full max-w-[100vw] overflow-x-hidden`}>
      {children}
    </div>
  )
} 