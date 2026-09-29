"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

const CAMBIO_VIVIENDA = [
  "Más espacio y más verde para la familia",
  "Silencio y naturaleza, sin alejarme de la ciudad",
  "Un lugar propio que se quede en la familia",
  "Nada, estoy bien donde vivo",
];

const MOMENTO_PASO = [
  "Este año",
  "El próximo año",
  "Más adelante",
  "Solo estoy mirando",
];

const CON_QUIEN_VIVE = [
  "Solo o en pareja",
  "Con hijos pequeños",
  "Con hijos grandes o adolescentes",
  "Con varias generaciones de la familia",
];

const RANGO_EDAD = [
  "15 a 25",
  "26 a 35",
  "36 a 65",
  "66 o mas",
];

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [barrio, setBarrio] = useState("");
  const [rangoEdad, setRangoEdad] = useState("");
  const [autorizacion, setAutorizacion] = useState(false);
  const [cambioVivienda, setCambioVivienda] = useState("");
  const [momentoPaso, setMomentoPaso] = useState("");
  const [conQuienVive, setConQuienVive] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!nombre.trim()) {
      setError("Por favor, escribe tu nombre y apellidos.");
      return;
    }

    if (!telefono.trim()) {
      setError("Por favor, escribe tu teléfono o WhatsApp.");
      return;
    }

    if (!ciudad.trim()) {
      setError("Por favor, escribe la ciudad donde vives.");
      return;
    }

    if (!barrio.trim()) {
      setError("Por favor, escribe el barrio donde vives.");
      return;
    }

    if (!rangoEdad) {
      setError("Por favor, selecciona tu rango de edad.");
      return;
    }

    if (!autorizacion) {
      setError("Debes autorizar el tratamiento de tus datos personales.");
      return;
    }

    if (!cambioVivienda) {
      setError("Por favor, selecciona una respuesta sobre tu vivienda actual.");
      return;
    }

    if (!momentoPaso) {
      setError("Por favor, selecciona cuándo te gustaría dar ese paso.");
      return;
    }

    if (!conQuienVive) {
      setError("Por favor, selecciona con quién vives actualmente.");
      return;
    }

    setEnviando(true);

    try {
      const { error: supabaseError } = await supabase
        .from("respuestas")
        .insert({
          nombre_apellidos: nombre.trim(),
          telefono_whatsapp: telefono.trim(),
          correo_electronico: correo.trim() || null,
          ciudad: ciudad.trim(),
          barrio: barrio.trim(),
          rango_edad: rangoEdad,
          autorizacion_datos: true,
          fecha_autorizacion: new Date().toISOString(),
          cambio_vivienda: cambioVivienda,
          momento_para_dar_paso: momentoPaso,
          con_quien_vive: conQuienVive,
        });

      if (supabaseError) {
        console.error(supabaseError);

        setError(
          "No fue posible enviar la información. Por favor, inténtalo nuevamente."
        );

        return;
      }

      setMensaje(
        "¡Gracias! Tu información fue registrada correctamente."
      );

      setNombre("");
      setTelefono("");
      setCorreo("");
      setCiudad("");
      setBarrio("");
      setRangoEdad("");
      setAutorizacion(false);
      setCambioVivienda("");
      setMomentoPaso("");
      setConQuienVive("");
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error inesperado. Por favor, inténtalo nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-[#005f73] px-6 py-10 text-center text-white sm:px-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              Queremos conocerte
            </p>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Cuéntanos un poco sobre ti
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
              Tus respuestas nos ayudarán a conocer mejor lo que buscas para
              ti y tu familia.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-8 px-6 py-8 sm:px-10 sm:py-10"
          >
            <section>
              <h2 className="mb-6 border-b-2 border-[#005f73] pb-2 text-xl font-bold text-[#005f73]">
                Tus datos
              </h2>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="nombre"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Nombre y apellidos *
                  </label>

                  <input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    placeholder="Escribe tu nombre completo"
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-[#005f73] focus:ring-2 focus:ring-[#005f73]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Teléfono / WhatsApp *
                  </label>

                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(event) => setTelefono(event.target.value)}
                    placeholder="Escribe tu número de teléfono"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-[#005f73] focus:ring-2 focus:ring-[#005f73]/20"
                  />
                </div>

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
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-[#005f73] focus:ring-2 focus:ring-[#005f73]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ciudad"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Ciudad donde vive *
                  </label>

                  <input
                    id="ciudad"
                    type="text"
                    value={ciudad}
                    onChange={(event) => setCiudad(event.target.value)}
                    placeholder="Escribe la ciudad donde vives"
                    autoComplete="address-level2"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-[#005f73] focus:ring-2 focus:ring-[#005f73]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="barrio"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Barrio *
                  </label>

                  <input
                    id="barrio"
                    type="text"
                    value={barrio}
                    onChange={(event) => setBarrio(event.target.value)}
                    placeholder="Escribe el barrio donde vives"
                    autoComplete="address-level3"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-[#005f73] focus:ring-2 focus:ring-[#005f73]/20"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-6 border-b-2 border-[#005f73] pb-2 text-xl font-bold text-[#005f73]">
                Sobre ti
              </h2>

              <div>
                <p className="mb-4 text-sm font-semibold leading-6 text-gray-800">
                  Rango de Edad *
                </p>

                <div className="space-y-3">
                  {RANGO_EDAD.map((opcion) => (
                    <label
                      key={opcion}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        rangoEdad === opcion
                          ? "border-[#005f73] bg-[#005f73]/5"
                          : "border-gray-200 hover:border-[#005f73]/50 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rangoEdad"
                        value={opcion}
                        checked={rangoEdad === opcion}
                        onChange={(event) =>
                          setRangoEdad(event.target.value)
                        }
                        className="mt-1 h-4 w-4 accent-[#005f73]"
                      />

                      <span className="text-sm leading-6 text-gray-700">
                        {opcion}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-6 border-b-2 border-[#005f73] pb-2 text-xl font-bold text-[#005f73]">
                Sobre lo que buscas
              </h2>

              <div className="space-y-8">
                <div>
                  <p className="mb-4 text-sm font-semibold leading-6 text-gray-800">
                    Si pudiera cambiar algo de donde vive hoy, ¿qué sería? *
                  </p>

                  <div className="space-y-3">
                    {CAMBIO_VIVIENDA.map((opcion) => (
                      <label
                        key={opcion}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          cambioVivienda === opcion
                            ? "border-[#005f73] bg-[#005f73]/5"
                            : "border-gray-200 hover:border-[#005f73]/50 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="cambioVivienda"
                          value={opcion}
                          checked={cambioVivienda === opcion}
                          onChange={(event) =>
                            setCambioVivienda(event.target.value)
                          }
                          className="mt-1 h-4 w-4 accent-[#005f73]"
                        />

                        <span className="text-sm leading-6 text-gray-700">
                          {opcion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-sm font-semibold leading-6 text-gray-800">
                    ¿Cuándo le gustaría dar ese paso? *
                  </p>

                  <div className="space-y-3">
                    {MOMENTO_PASO.map((opcion) => (
                      <label
                        key={opcion}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          momentoPaso === opcion
                            ? "border-[#005f73] bg-[#005f73]/5"
                            : "border-gray-200 hover:border-[#005f73]/50 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="momentoPaso"
                          value={opcion}
                          checked={momentoPaso === opcion}
                          onChange={(event) =>
                            setMomentoPaso(event.target.value)
                          }
                          className="mt-1 h-4 w-4 accent-[#005f73]"
                        />

                        <span className="text-sm leading-6 text-gray-700">
                          {opcion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-sm font-semibold leading-6 text-gray-800">
                    ¿Con quién vive hoy? *
                  </p>

                  <div className="space-y-3">
                    {CON_QUIEN_VIVE.map((opcion) => (
                      <label
                        key={opcion}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          conQuienVive === opcion
                            ? "border-[#005f73] bg-[#005f73]/5"
                            : "border-gray-200 hover:border-[#005f73]/50 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="conQuienVive"
                          value={opcion}
                          checked={conQuienVive === opcion}
                          onChange={(event) =>
                            setConQuienVive(event.target.value)
                          }
                          className="mt-1 h-4 w-4 accent-[#005f73]"
                        />

                        <span className="text-sm leading-6 text-gray-700">
                          {opcion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={autorizacion}
                  onChange={(event) => setAutorizacion(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#005f73]"
                />

                <span className="text-sm leading-6 text-gray-700">
                  Autorizo el tratamiento de mis datos personales para los
                  fines relacionados con este formulario y acepto que la
                  información suministrada sea utilizada para contactarme
                  cuando corresponda. *
                </span>
              </label>
            </section>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            {mensaje && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
              >
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-[#e67e22] px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#d96f13] focus:outline-none focus:ring-4 focus:ring-[#e67e22]/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar información"}
            </button>

            <div className="pt-2 text-center">
              <p className="text-base font-semibold leading-7 text-[#005f73]">
                Este 17 de octubre será de los primeros en conocer un lugar
                para toda la vida.
              </p>
            </div>

            <p className="text-center text-xs text-gray-500">
              Los campos marcados con * son obligatorios.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}