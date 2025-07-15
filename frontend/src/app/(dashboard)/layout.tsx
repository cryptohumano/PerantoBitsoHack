import { JetBrains_Mono } from "next/font/google"
import React, { ReactNode } from "react"
import { DashboardLayout } from "@/components/dashboard/shared/dashboard-layout"

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={`${jetbrains.className} min-h-screen w-full max-w-[100vw] overflow-x-hidden`}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </div>
  )
} 