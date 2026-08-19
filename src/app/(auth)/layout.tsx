import { TooltipProvider } from '@/components/ui'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-discord-bg">
        {children}
      </div>
    </TooltipProvider>
  )
}
