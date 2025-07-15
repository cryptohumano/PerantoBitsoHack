import { ReactNode } from "react"

export function SidebarMenuItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer">
      {children}
    </div>
  )
} 