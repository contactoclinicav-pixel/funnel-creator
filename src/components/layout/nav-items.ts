export interface NavItem {
  title: string;
  href: string;
  /** Secciones fuera del MVP actual que se muestran como "pronto". */
  comingSoon?: boolean;
}

/** Los 9 ítems del handoff, en su orden. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Mis Funnels", href: "/funnels" },
  { title: "Crear con IA", href: "/create-ai" },
  { title: "Templates", href: "/templates" },
  { title: "Leads", href: "/leads" },
  { title: "Analytics", href: "/analytics" },
  { title: "Integraciones", href: "/integrations", comingSoon: true },
  { title: "Mi Marca", href: "/brand" },
  { title: "Configuración", href: "/settings" },
];
