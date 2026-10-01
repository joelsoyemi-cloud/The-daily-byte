import type { Metadata } from "next";
export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };
export default function AuthLayout({ children }: { children: React.ReactNode }) { return children; }
