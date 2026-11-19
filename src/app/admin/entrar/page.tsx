import Link from "next/link";

import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto my-4 w-full max-w-sm rounded-2xl border bg-white/85 px-4 py-8 backdrop-blur-md sm:my-8 sm:px-8 sm:py-10">
      <h1 className="text-xl font-semibold tracking-tight">Acesso administrativo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Digite a senha de administrador para continuar.
      </p>
      <AdminLoginForm />
      <Link
        href="/dashboard"
        className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Voltar ao dashboard
      </Link>
    </main>
  );
}
