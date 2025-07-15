import { ReactNode } from "react"

export function SidebarGroup({ children }: { children: ReactNode }) {
  return (
    <div className="py-2 px-2">
      {children}
    </div>
  )
} 