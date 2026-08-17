import {
  LayoutDashboard,
  Filter,
  Sparkles,
  LayoutTemplate,
  Users,
  BarChart3,
  Plug,
  Palette,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Secciones fuera del MVP actual que se muestran como "Próximamente". */
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Mis Funnels", href: "/funnels", icon: Filter },
  { title: "Crear con IA", href: "/create-ai", icon: Sparkles },
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Integraciones", href: "/integrations", icon: Plug, comingSoon: true },
  { title: "Mi Marca", href: "/brand", icon: Palette },
  { title: "Configuración", href: "/settings", icon: Settings },
];
