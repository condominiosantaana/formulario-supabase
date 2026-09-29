"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!correo.trim()) {
      setError("Por favor, escribe el correo electrónico.");
      return;
    }

    if (!password) {
      setError("Por favor, escribe la contraseña.");
      return;
    }

    setCargando(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password,
      });

      if (loginError) {
        console.error(loginError);
        setError("Correo o contraseña incorrectos.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-x-clip bg-[#f5f5f2] px-4 py-12 font-sans text-[#263238] [color-scheme:light]">
      <div className="w-full max-w-[420px] rounded-[24px] border border-[#173f4a]/[0.07] bg-white px-6 py-10 shadow-[0_1px_2px_rgba(23,63,74,0.04),0_12px_40px_-12px_rgba(23,63,74,0.12)] motion-safe:animate-rise sm:px-10 sm:py-12">
        <header className="text-center">
          <p className="font-display leading-none text-[#173f4a]">
            <span className="block text-5xl font-light tracking-tight">
              Km 2
            </span>
            <span className="mt-2 block text-lg font-light italic text-[#173f4a]/75">
              Vía Sirivana
            </span>
          </p>

          <span
            aria-hidden="true"
            className="mx-auto mt-6 block h-px w-10 bg-[#e67e22]"
          />

          <h1 className="mt-8 text-xs font-semibold uppercase tracking-[0.26em] text-[#173f4a]">
            Acceso administrativo
          </h1>

          <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-6 text-[#718096]">
            Ingresa con tus credenciales para administrar las respuestas.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="correo"
              className="mb-2 block text-sm font-medium text-[#263238]"
            >
              Correo electrónico
            </label>

            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              disabled={cargando}
              className="h-12 w-full min-w-0 rounded-xl border border-[#d9ddd9] bg-[#f8f7f3] px-4 text-base text-[#263238] outline-none transition duration-200 placeholder:text-[#718096]/70 focus:border-[#005f73] focus:bg-white focus:ring-4 focus:ring-[#005f73]/10 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#263238]"
            >
              Contraseña
            </label>

            <div className="relative">
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Escribe tu contraseña"
                autoComplete="current-password"
                disabled={cargando}
                className="h-12 w-full min-w-0 rounded-xl border border-[#d9ddd9] bg-[#f8f7f3] pl-4 pr-24 text-base text-[#263238] outline-none transition duration-200 placeholder:text-[#718096]/70 focus:border-[#005f73] focus:bg-white focus:ring-4 focus:ring-[#005f73]/10 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                disabled={cargando}
                aria-pressed={mostrarPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#005f73] transition-colors duration-200 hover:bg-[#005f73]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005f73]/30 disabled:opacity-50 motion-reduce:transition-none"
              >
                {mostrarPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border-l-2 border-[#e67e22] bg-[#e67e22]/[0.07] px-4 py-3 text-sm leading-6 text-[#173f4a] motion-safe:animate-rise"
            >
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={cargando}
              aria-busy={cargando}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#e67e22] px-6 text-[15px] font-semibold tracking-wide text-white shadow-sm shadow-[#e67e22]/20 transition duration-200 hover:bg-[#d97316] hover:shadow-md hover:shadow-[#e67e22]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e67e22]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#e67e22] motion-reduce:transition-none"
            >
              {cargando && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                />
              )}
              {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>

          <div className="pt-2 text-center">
            <a
              href="/"
              className="text-sm font-medium text-[#005f73] underline-offset-4 transition-colors duration-200 hover:text-[#173f4a] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005f73]/30"
            >
              Volver al formulario
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}