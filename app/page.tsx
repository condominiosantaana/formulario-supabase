"use client";

import {
  ComponentProps,
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
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

// Texto visible de algunas opciones. El valor guardado no cambia para
// mantener la compatibilidad con los registros existentes y el panel.
const ETIQUETAS_EDAD: Record<string, string> = {
  "66 o mas": "66 o más",
};

const IMAGENES = [
  "https://res.cloudinary.com/dv1gz4eqo/image/upload/v1790702743/WhatsApp_Image_2026-09-29_at_11.15.28_AM_1_s0rquj.jpg",
  "https://res.cloudinary.com/dv1gz4eqo/image/upload/v1790702743/WhatsApp_Image_2026-09-29_at_11.15.28_AM_cwzegz.jpg",
];

const INTERVALO_IMAGENES_MS = 5000;

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
    <main className="public-form relative isolate min-h-screen w-full overflow-x-clip bg-[#274150] font-sans text-[#1f3340] [color-scheme:light]">
      <FondoDecorativo />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8 lg:py-20">
        {/* ---------------- Zona editorial ---------------- */}
        <header className="animate-rise text-white lg:self-start lg:[@media(min-height:900px)]:sticky lg:[@media(min-height:900px)]:top-20">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            <span aria-hidden="true" className="h-px w-8 bg-[#e67e22]" />
            Queremos conocerte
          </p>

          <h1 className="mt-8 font-display leading-none">
            <span className="block text-[4.5rem] font-light tracking-tight sm:text-8xl lg:text-[8.5rem]">
              Km 2
            </span>
            <span className="mt-3 block text-3xl font-light italic text-white/85 sm:text-4xl lg:text-5xl">
              Vía Sirivana
            </span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            <span className="font-medium text-[#e67e22]">
              ¡Este 17 de octubre
            </span>{" "}
            podrás ser de los primeros en conocer un lugar para toda la vida.
            Cuéntanos un poco más de ti y lo que imaginas para tu familia!
          </p>

          <Presentacion className="mt-10 w-full max-w-sm sm:max-w-xs lg:max-w-[280px]" />
        </header>

        {/* ---------------- Tarjeta del formulario ---------------- */}
        <div className="animate-rise min-w-0 rounded-[28px] bg-white shadow-2xl shadow-black/25 [animation-delay:120ms]">
          <div className="px-5 pb-2 pt-8 sm:px-10 sm:pt-12">
            <h2 className="font-display text-3xl font-light leading-tight text-[#274150] sm:text-4xl">
              Cuéntanos un poco sobre ti
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-7 text-[#274150]/65">
              Tus respuestas nos ayudarán a conocer mejor lo que buscas para
              ti y tu familia.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-12 px-5 pb-8 pt-8 sm:space-y-14 sm:px-10 sm:pb-12"
          >
            <Seccion numero="01" titulo="Datos de contacto">
              <CampoTexto
                id="nombre"
                etiqueta="Nombre y apellidos"
                obligatorio
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Escribe tu nombre completo"
                autoComplete="name"
              />

              <CampoTexto
                id="telefono"
                etiqueta="Teléfono / WhatsApp"
                obligatorio
                type="tel"
                inputMode="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="Escribe tu número de teléfono"
                autoComplete="tel"
              />

              <CampoTexto
                id="correo"
                etiqueta="Correo electrónico"
                type="email"
                inputMode="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
              />
            </Seccion>

            <Seccion numero="02" titulo="Dónde vives">
              <div className="grid gap-5 sm:grid-cols-2">
                <CampoTexto
                  id="ciudad"
                  etiqueta="Ciudad donde vive"
                  obligatorio
                  type="text"
                  value={ciudad}
                  onChange={(event) => setCiudad(event.target.value)}
                  placeholder="Escribe la ciudad donde vives"
                  autoComplete="address-level2"
                />

                <CampoTexto
                  id="barrio"
                  etiqueta="Barrio"
                  obligatorio
                  type="text"
                  value={barrio}
                  onChange={(event) => setBarrio(event.target.value)}
                  placeholder="Escribe el barrio donde vives"
                  autoComplete="address-level3"
                />
              </div>
            </Seccion>

            <Seccion numero="03" titulo="Sobre ti">
              <GrupoOpciones
                nombre="rangoEdad"
                pregunta="Rango de Edad"
                opciones={RANGO_EDAD}
                etiquetas={ETIQUETAS_EDAD}
                valor={rangoEdad}
                onCambio={setRangoEdad}
                columnas="grid-cols-2 sm:grid-cols-4"
              />
            </Seccion>

            <Seccion numero="04" titulo="Tu momento">
              <GrupoOpciones
                nombre="cambioVivienda"
                pregunta="Si pudiera cambiar algo de donde vive hoy, ¿qué sería?"
                opciones={CAMBIO_VIVIENDA}
                valor={cambioVivienda}
                onCambio={setCambioVivienda}
              />

              <GrupoOpciones
                nombre="momentoPaso"
                pregunta="¿Cuándo le gustaría dar ese paso?"
                opciones={MOMENTO_PASO}
                valor={momentoPaso}
                onCambio={setMomentoPaso}
              />

              <GrupoOpciones
                nombre="conQuienVive"
                pregunta="¿Con quién vive hoy?"
                opciones={CON_QUIEN_VIVE}
                valor={conQuienVive}
                onCambio={setConQuienVive}
              />
            </Seccion>

            <Seccion numero="05" titulo="Autorización">
              <label
                className={`group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors duration-200 has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-[#005f73]/20 sm:p-5 ${
                  autorizacion
                    ? "border-[#005f73] bg-[#005f73]/[0.05]"
                    : "border-[#274150]/10 bg-[#F7F6F1] hover:border-[#274150]/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={autorizacion}
                  onChange={(event) => setAutorizacion(event.target.checked)}
                  aria-required="true"
                  className="sr-only"
                />

                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-200 ${
                    autorizacion
                      ? "border-[#005f73] bg-[#005f73] text-white"
                      : "border-[#274150]/30 bg-white text-transparent"
                  }`}
                >
                  <IconoCheck className="h-3.5 w-3.5" />
                </span>

                <span className="text-sm leading-6 text-[#274150]/80">
                  Autorizo el tratamiento de mis datos personales para los
                  fines relacionados con este formulario y acepto que la
                  información suministrada sea utilizada para contactarme
                  cuando corresponda.{" "}
                  <span aria-hidden="true" className="text-[#e67e22]">
                    *
                  </span>
                </span>
              </label>
            </Seccion>

            <div className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="animate-rise flex items-start gap-3 rounded-2xl bg-[#fdf1ef] px-4 py-3.5 text-sm leading-6 text-[#9b2c1f] ring-1 ring-inset ring-[#9b2c1f]/15"
                >
                  <IconoAlerta className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {mensaje && (
                <div
                  role="status"
                  className="animate-rise flex items-center gap-4 rounded-2xl bg-[#005f73]/[0.06] px-4 py-4 ring-1 ring-inset ring-[#005f73]/20 sm:px-5"
                >
                  <span className="animate-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#005f73] text-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-5 w-5"
                    >
                      <path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        className="animate-draw [stroke-dasharray:24] [stroke-dashoffset:24]"
                      />
                    </svg>
                  </span>
                  <p className="text-[15px] font-semibold leading-6 text-[#00485a]">
                    {mensaje}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                aria-busy={enviando}
                className="group relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#e67e22] px-6 text-base font-semibold tracking-wide text-white shadow-lg shadow-[#e67e22]/25 transition duration-200 hover:bg-[#d96f13] hover:shadow-xl hover:shadow-[#e67e22]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e67e22]/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#e67e22]"
              >
                {enviando ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar información
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#274150]/50">
                Los campos marcados con{" "}
                <span className="text-[#e67e22]">*</span> son obligatorios.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

/* ================================================================
   Componentes de presentación
   ================================================================ */

function Seccion({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`seccion-${numero}`}>
      <h3
        id={`seccion-${numero}`}
        className="mb-6 flex items-baseline gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#274150]"
      >
        <span className="font-display text-sm font-normal tracking-normal text-[#e67e22]">
          {numero}
        </span>
        {titulo}
      </h3>

      <div className="space-y-8">{children}</div>
    </section>
  );
}

function Obligatorio() {
  return (
    <>
      <span aria-hidden="true" className="ml-0.5 text-[#e67e22]">
        *
      </span>
      <span className="sr-only"> (obligatorio)</span>
    </>
  );
}

type CampoTextoProps = ComponentProps<"input"> & {
  id: string;
  etiqueta: string;
  obligatorio?: boolean;
};

function CampoTexto({ id, etiqueta, obligatorio, ...props }: CampoTextoProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium text-[#274150]"
      >
        <span>
          {etiqueta}
          {obligatorio && <Obligatorio />}
        </span>
        {!obligatorio && (
          <span className="text-xs font-normal text-[#274150]/45">
            Opcional
          </span>
        )}
      </label>

      <input
        id={id}
        aria-required={obligatorio || undefined}
        className="h-14 w-full min-w-0 rounded-2xl border border-[#274150]/10 bg-[#F7F6F1] px-4 text-base text-[#1f3340] transition duration-200 placeholder:text-[#274150]/35 hover:border-[#274150]/25 focus:border-[#005f73] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#005f73]/10"
        {...props}
      />
    </div>
  );
}

type GrupoOpcionesProps = {
  nombre: string;
  pregunta: string;
  opciones: readonly string[];
  valor: string;
  onCambio: (valor: string) => void;
  etiquetas?: Record<string, string>;
  columnas?: string;
};

function GrupoOpciones({
  nombre,
  pregunta,
  opciones,
  valor,
  onCambio,
  etiquetas,
  columnas = "sm:grid-cols-2",
}: GrupoOpcionesProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-4 text-[15px] font-medium leading-6 text-[#274150]">
        {pregunta}
        <Obligatorio />
      </legend>

      <div className={`grid gap-3 ${columnas}`}>
        {opciones.map((opcion) => (
          <TarjetaOpcion
            key={opcion}
            nombre={nombre}
            valor={opcion}
            etiqueta={etiquetas?.[opcion] ?? opcion}
            seleccionada={valor === opcion}
            onSeleccionar={onCambio}
          />
        ))}
      </div>
    </fieldset>
  );
}

function TarjetaOpcion({
  nombre,
  valor,
  etiqueta,
  seleccionada,
  onSeleccionar,
}: {
  nombre: string;
  valor: string;
  etiqueta: string;
  seleccionada: boolean;
  onSeleccionar: (valor: string) => void;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition duration-200 has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-[#005f73]/20 ${
        seleccionada
          ? "border-[#005f73] bg-[#005f73]/[0.06] shadow-[inset_0_0_0_1px_#005f73]"
          : "border-[#274150]/10 bg-[#F7F6F1] hover:-translate-y-px hover:border-[#274150]/25 hover:bg-white hover:shadow-sm"
      }`}
    >
      <input
        type="radio"
        name={nombre}
        value={valor}
        checked={seleccionada}
        onChange={(event) => onSeleccionar(event.target.value)}
        className="sr-only"
      />

      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          seleccionada
            ? "border-[#005f73] bg-[#005f73] text-white"
            : "border-[#274150]/25 bg-white text-transparent"
        }`}
      >
        <IconoCheck className="h-3 w-3" />
      </span>

      <span
        className={`min-w-0 text-[15px] leading-6 ${
          seleccionada ? "font-medium text-[#00485a]" : "text-[#274150]/85"
        }`}
      >
        {etiqueta}
      </span>
    </label>
  );
}

function IconoCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function IconoAlerta({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16h.01" />
    </svg>
  );
}

/* Presentación de imágenes con fundido cruzado. Vive en su propio
   componente para que el cambio de imagen no vuelva a renderizar el
   formulario. */
function Presentacion({ className }: { className?: string }) {
  const [indiceImagen, setIndiceImagen] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceImagen((actual) => (actual + 1) % IMAGENES.length);
    }, INTERVALO_IMAGENES_MS);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <figure className={className}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#1f3340] shadow-xl shadow-black/20 ring-1 ring-white/10">
        {IMAGENES.map((src, indice) => {
          const activa = indice === indiceImagen;

          return (
            // Se usa <img> para no configurar dominios externos en next.config.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt="Km 2 Vía Sirivana"
              aria-hidden={!activa}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-in-out ${
                activa ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#274150]/35 via-transparent to-transparent"
        />
      </div>

      <div aria-hidden="true" className="mt-4 flex items-center gap-2">
        {IMAGENES.map((src, indice) => (
          <span
            key={src}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              indice === indiceImagen
                ? "w-6 bg-[#e67e22]"
                : "w-1.5 bg-white/35"
            }`}
          />
        ))}
      </div>
    </figure>
  );
}

function FondoDecorativo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#005f73_0%,transparent_55%)] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,#1b2e39_0%,transparent_60%)]" />
      <svg
        viewBox="0 0 800 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        className="absolute -right-40 top-0 h-[900px] w-[900px] text-white opacity-[0.06]"
      >
        {Array.from({ length: 9 }, (_, i) => (
          <ellipse
            key={i}
            cx="400"
            cy="400"
            rx={120 + i * 38}
            ry={80 + i * 30}
            transform={`rotate(${-18 + i * 3} 400 400)`}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        ))}
      </svg>
    </div>
  );
}
