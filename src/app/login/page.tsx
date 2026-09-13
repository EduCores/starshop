"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setErr("Email o clave incorrectos");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {registered && <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded p-3">¡Cuenta creada! Ahora inicia sesión.</div>}

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="mt-6 w-full flex items-center justify-center gap-2 border rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
      >
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuar con Google
      </button>
      <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400"><span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"/><span>o</span><span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"/></div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 bg-white dark:bg-zinc-900 border rounded-lg p-6">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input name="email" type="email" required className="mt-1" placeholder="empresa@correo.cl" />
        </div>
        <div>
          <label className="text-sm font-medium">Clave</label>
          <Input name="password" type="password" required className="mt-1" />
        </div>

        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>

        <p className="text-sm text-center text-zinc-500">
          ¿No tienes cuenta? <Link href="/registro" className="text-[#FF3B30] hover:underline">Crear cuenta</Link>
        </p>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="container py-10 max-w-md">
      <h1 className="text-2xl font-black">Iniciar sesión</h1>
      <p className="text-sm text-zinc-500 mt-1">Los usuarios quedan en <code>data/users.json</code> (ver respuesta anterior).</p>

      <Suspense fallback={<div className="mt-6 text-sm text-zinc-500">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
