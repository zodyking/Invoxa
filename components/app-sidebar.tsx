"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  User,
  Shield,
  Package,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Vehicles",
    icon: Car,
    href: "/vehicles",
  },
  {
    title: "Service Logs",
    icon: FileText,
    href: "/service-logs",
  },
  {
    title: "Invoices",
    icon: Receipt,
    href: "/invoices",
  },
  {
    title: "Payments",
    icon: CreditCard,
    href: "/payments",
  },
  {
    title: "Parts & Services",
    icon: Package,
    href: "/parts-services",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  image?: string | null
  status: string
  roles: Array<{
    id: string
    name: string
    description: string
  }>
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = () => {
    if (!profile) return "U"
    return `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "U"
  }

  const getUserName = () => {
    if (!profile) return "User"
    return `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User"
  }

  const getRoleName = () => {
    if (!profile || !profile.roles || profile.roles.length === 0) return "User"
    return profile.roles[0].name || "User"
  }

  const handleSignOut = async () => {
    try {
      // Call logout API to clear active login
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      // Ignore errors
    }
    await signOut({ redirect: false })
    router.push("/login")
    router.refresh()
  }

  return (
    <Sidebar variant="sidebar" className="">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center justify-center px-2">
          <div className="relative h-10 w-full max-w-[180px] flex-shrink-0">
            <Image
              src="/branding/Invoxa-Logo.svg"
              alt="Invoxa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} className="rounded-lg">
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-0">
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 p-4 cursor-pointer hover:bg-accent transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.image || ""} alt={getUserName()} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isLoading ? "Loading..." : getUserName()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isLoading ? "..." : getRoleName()}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/security" className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-3 p-4 cursor-pointer hover:bg-accent transition-colors text-left"
            disabled
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Loading...</p>
              <p className="text-xs text-muted-foreground truncate">...</p>
            </div>
          </button>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

