import { UserRole } from "@/src/modules/auth/rbac";

export interface NavItem {
  title: string;
  href: string;
  iconName?: string;
  allowedRoles: (UserRole | "VIEWER")[];
  badge?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    iconName: "LayoutDashboard",
    allowedRoles: ["ADMIN", "ORGANIZER", "STUDENT", "VIEWER"],
  },
  {
    title: "Campus Calendar",
    href: "/calendar",
    iconName: "Calendar",
    allowedRoles: ["ADMIN", "ORGANIZER", "STUDENT", "VIEWER"],
  },
  {
    title: "Create Event",
    href: "/events/new",
    iconName: "PlusCircle",
    allowedRoles: ["ADMIN", "ORGANIZER"],
  },
  {
    title: "My Submissions",
    href: "/events/my-submissions",
    iconName: "FolderKanban",
    allowedRoles: ["ADMIN", "ORGANIZER"],
  },
  {
    title: "Verification Queue",
    href: "/verification",
    iconName: "CheckSquare",
    allowedRoles: ["ADMIN", "HOD"],
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "User Management",
    href: "/admin/users",
    iconName: "Users",
    allowedRoles: ["ADMIN"],
  },
  {
    title: "Semester Lifecycle",
    href: "/admin/semesters",
    iconName: "CalendarRange",
    allowedRoles: ["ADMIN"],
  },
  {
    title: "Department Budgets",
    href: "/admin/budgets",
    iconName: "PieChart",
    allowedRoles: ["ADMIN"],
  },
];
