import { AppFooter } from "@/components/app-footer"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <AppFooter />
    </div>
  )
}

