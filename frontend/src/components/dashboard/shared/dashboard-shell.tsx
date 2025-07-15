"use client"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col w-full">
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  )
} 