"use client";
import { usePathname } from "next/navigation";
// Workspaces provide their own navigation; public markup remains unchanged.
export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (["/dashboard", "/editor", "/admin"].some(path => pathname === path || pathname.startsWith(path + "/"))) return null;
  return <>{children}</>;
}
