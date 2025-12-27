import { redirect } from "next/navigation"

export default function Home() {
  // TODO: Check authentication status
  // For now, redirect to dashboard
  redirect("/dashboard")
}
