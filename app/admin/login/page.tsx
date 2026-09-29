"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const FONDO_LOGIN = [
  // Fondo principal azul petróleo
  "linear-gradient(135deg, #0f5363 0%, #174f5e 45%, #243f4b 100%)",

  // Grandes líneas circulares decorativas a la derecha
  "repeating-radial-gradient(circle at 88% 50%, transparent 0px, transparent 58px, rgba(174, 208, 211, 0.10) 59px, rgba(174, 208, 211, 0.10) 60px, transparent 61px, transparent 82px)",

  // Líneas orgánicas suaves en la parte inferior izquierda
  "radial-gradient(ellipse 42% 15% at 25% 82%, transparent 0%, transparent 54%, rgba(164, 204, 207, 0.12) 55%, rgba(164, 204, 207, 0.12) 56%, transparent 57%)",

  "radial-gradient(ellipse 42% 15% at 25% 86%, transparent 0%, transparent 54%, rgba(164, 204, 207, 0.09) 55%, rgba(164, 204, 207, 0.09) 56%, transparent 57%)",

  "radial-gradient(ellipse 42% 15% at 25% 90%, transparent 0%, transparent 54%, rgba(164, 204, 207, 0.07) 55%, rgba(164, 204, 207, 0.07) 56%, transparent 57%)",

  // Luz ambiental
  "radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0) 45%)",
].join(", ");

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
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
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
    <main
      style={{
        backgroundImage: FONDO_LOGIN,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-4 py-10 font-sans text-[#263238] [color-scheme:light] sm:px-6"
    >
      {/* Capa decorativa superior derecha */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full border border-white/[0.035]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-[430px] w-[430px] rounded-full border border-white/[0.035]"
      />

      {/* Capa decorativa inferior izquierda */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-[520px] w-[700px] rounded-[50%] border border-white/[0.035]"
      />

      {/* Tarjeta de acceso */}
      <div className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-[28px] border border-white/60 bg-[#fffefa] px-6 py-9 shadow-[0_30px_80px_rgba(5,35,43,0.28)] sm:px-10 sm:py-11">
        {/* Marca */}
        <header className="text-center">
          <div className="font-display text-[#173f4a]">
            <span className="block text-[46px] font-light leading-none tracking-[-0.04em] sm:text-[52px]">
              Km 2
            </span>

            <span className="mt-2 block text-[18px] font-light italic leading-none text-[#173f4a]/75">
              Vía Sirivana
            </span>
          </div>

          {/* Línea naranja */}
          <span
            aria-hidden="true"
            className="mx-auto mt-6 block h-px w-10 bg-[#e67e22]"
          />

          {/* Título */}
          <h1 className="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#173f4a]">
            Acceso administrativo
          </h1>

          <p className="mx-auto mt-3 max-w-[285px] text-[13px] leading-6 text-[#718096]">
            Ingresa con tus credenciales para administrar las respuestas.
          </p>
        </header>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          {/* Correo */}
          <div>
            <label
              htmlFor="correo"
              className="mb-2 block text-[13px] font-medium text-[#263238]"
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
              className="h-[50px] w-full rounded-xl border border-[#d9ddd9] bg-[#f8f7f3] px-4 text-[14px] text-[#263238] outline-none transition-all duration-200 placeholder:text-[#9aa5a8] focus:border-[#005f73] focus:bg-white focus:ring-4 focus:ring-[#005f73]/10 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-[13px] font-medium text-[#263238]"
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
                className="h-[50px] w-full rounded-xl border border-[#d9ddd9] bg-[#f8f7f3] pl-4 pr-24 text-[14px] text-[#263238] outline-none transition-all duration-200 placeholder:text-[#9aa5a8] focus:border-[#005f73] focus:bg-white focus:ring-4 focus:ring-[#005f73]/10 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarPassword(!mostrarPassword)
                }
                disabled={cargando}
                aria-pressed={mostrarPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#005f73] transition-colors duration-200 hover:bg-[#005f73]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005f73]/30 disabled:opacity-50 motion-reduce:transition-none"
              >
                {mostrarPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border-l-2 border-[#e67e22] bg-[#e67e22]/[0.07] px-4 py-3 text-[13px] leading-5 text-[#173f4a]"
            >
              {error}
            </div>
          )}

          {/* Botón */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={cargando}
              aria-busy={cargando}
              className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#e67e22] px-6 text-[14px] font-semibold tracking-wide text-white shadow-[0_6px_18px_rgba(230,126,34,0.18)] transition-all duration-200 hover:bg-[#d97316] hover:shadow-[0_8px_22px_rgba(230,126,34,0.24)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e67e22]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#e67e22] motion-reduce:transition-none"
            >
              {cargando && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                />
              )}

              {cargando
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </button>
          </div>

          {/* Volver */}
          <div className="pt-1 text-center">
            <a
              href="/"
              className="text-[13px] font-medium text-[#005f73] underline-offset-4 transition-colors duration-200 hover:text-[#173f4a] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005f73]/30"
            >
              Volver al formulario
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}