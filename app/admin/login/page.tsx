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
    <main className="min-h-screen bg-[#f5f5f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-[#005f73] px-6 py-10 text-center text-white sm:px-8">
            <div className="mb-4 text-4xl">🔐</div>

            <h1 className="text-3xl font-bold">
              Acceso administrativo
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/85">
              Ingresa con tus credenciales para administrar las respuestas.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-8 sm:px-8"
          >
            <div>
              <label
                htmlFor="correo"
                className="mb-2 block text-sm font-semibold text-gray-700"
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-[#005f73] focus:ring-2 focus:ring-[#005f73]/20 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-24 text-gray-800 outline-none transition focus:border-[#005f73] focus:ring-2 focus:ring-[#005f73]/20 disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  disabled={cargando}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#005f73] hover:underline disabled:opacity-50"
                >
                  {mostrarPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl bg-[#e67e22] px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#d96f13] focus:outline-none focus:ring-4 focus:ring-[#e67e22]/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

            <div className="text-center">
              <a
                href="/"
                className="text-sm font-semibold text-[#005f73] hover:underline"
              >
                Volver al formulario
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}