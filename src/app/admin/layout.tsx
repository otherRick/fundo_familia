import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/");
  }

  return <>{children}</>;
}
