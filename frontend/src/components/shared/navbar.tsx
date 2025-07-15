"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b w-full sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-[100vw] mx-auto flex h-16 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">KILT Attester</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/citizen"
              className={`transition-colors hover:text-foreground/80 ${
                pathname?.startsWith("/citizen")
                  ? "text-foreground"
                  : "text-foreground/60"
              }`}
            >
              Ciudadano
            </Link>
            <Link
              href="/attester"
              className={`transition-colors hover:text-foreground/80 ${
                pathname?.startsWith("/attester")
                  ? "text-foreground"
                  : "text-foreground/60"
              }`}
            >
              Attestant
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
} 