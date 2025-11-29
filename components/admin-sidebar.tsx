import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package2, Receipt, Users, Settings, type LucideIcon } from "lucide-react"

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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  disabled?: boolean
}

const items: NavItem[] = [
  {
    title: "Overview",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Package2,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: Receipt,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

interface AdminSidebarProps {
  userName: string
  email?: string
  onLogout: () => void
}

export function AdminSidebar({ userName, email, onLogout }: AdminSidebarProps) {
  const pathname = usePathname()
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-base font-semibold">Admin Panel</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.url === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.url.replace("#", ""))

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={!item.disabled}
                      isActive={isActive}
                      disabled={item.disabled}
                      tooltip={item.title}
                    >
                      {item.disabled ? (
                        <div className="flex items-center gap-2 opacity-60">
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-xs font-medium">
                {initials || "AD"}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{userName}</span>
                {email && (
                  <span className="truncate text-[11px] text-sidebar-foreground/70">
                    {email}
                  </span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Signed in as
              <div className="truncate text-[11px] font-medium text-foreground">
                {email || userName}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">App settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}


