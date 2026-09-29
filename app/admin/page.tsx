"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";

type Respuesta = {
  id: number;
  nombre_apellidos: string;
  telefono_whatsapp: string;
  correo_electronico: string | null;
  ciudad: string;
  barrio: string;
  rango_edad: string;
  autorizacion_datos: boolean;
  fecha_autorizacion: string | null;
  cambio_vivienda: string;
  momento_para_dar_paso: string;
  con_quien_vive: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoRespuestas, setCargandoRespuestas] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      setCorreo(user.email ?? "");

      await cargarRespuestas();

      setCargando(false);
    }

    iniciar();
  }, [router]);

  async function cargarRespuestas() {
    setCargandoRespuestas(true);
    setError("");

    const { data, error } = await supabase
      .from("respuestas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando respuestas:", error);

      setError(`No fue posible cargar las respuestas: ${error.message}`);

      setRespuestas([]);
    } else {
      setRespuestas((data ?? []) as Respuesta[]);
    }

    setCargandoRespuestas(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  function formatearFecha(fecha: string | null) {
    if (!fecha) {
      return "-";
    }

    return new Date(fecha).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function formatearFechaPdf(fecha: string | null) {
    if (!fecha) {
      return "-";
    }

    return new Date(fecha).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function exportarPDF() {
    if (respuestas.length === 0) {
      setError("No hay respuestas para exportar.");
      return;
    }

    try {
      setGenerandoPdf(true);
      setError("");

      const documento = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const fechaGeneracion = new Date().toLocaleString("es-CO", {
        dateStyle: "long",
        timeStyle: "short",
      });

      const anchoPagina = documento.internal.pageSize.getWidth();

      documento.setFillColor(0, 95, 115);
      documento.rect(0, 0, anchoPagina, 32, "F");

      documento.setTextColor(255, 255, 255);
      documento.setFont("helvetica", "bold");
      documento.setFontSize(18);
      documento.text("Panel administrativo", 14, 12);

      documento.setFont("helvetica", "normal");
      documento.setFontSize(9);
      documento.text(
        "Registro de respuestas del formulario",
        14,
        19
      );

      documento.text(
        `Total de respuestas: ${respuestas.length}`,
        14,
        25
      );

      documento.text(
        `Generado: ${fechaGeneracion}`,
        anchoPagina - 14,
        25,
        {
          align: "right",
        }
      );

      const filas = respuestas.map((respuesta, indice) => [
        String(indice + 1),
        respuesta.nombre_apellidos || "-",
        respuesta.telefono_whatsapp || "-",
        respuesta.correo_electronico || "-",
        respuesta.ciudad || "-",
        respuesta.barrio || "-",
        respuesta.rango_edad || "-",
        respuesta.cambio_vivienda || "-",
        respuesta.momento_para_dar_paso || "-",
        respuesta.con_quien_vive || "-",
        respuesta.autorizacion_datos ? "Autorizado" : "No autorizado",
        formatearFechaPdf(respuesta.fecha_autorizacion),
        formatearFechaPdf(respuesta.created_at),
      ]);

      autoTable(documento, {
        startY: 38,
        head: [
          [
            "N.º",
            "Nombre y apellidos",
            "Teléfono / WhatsApp",
            "Correo electrónico",
            "Ciudad",
            "Barrio",
            "Rango de edad",
            "¿Qué cambiaría?",
            "¿Cuándo daría el paso?",
            "¿Con quién vive?",
            "Autorización",
            "Fecha autorización",
            "Fecha registro",
          ],
        ],
        body: filas,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 6.5,
          cellPadding: 2,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [0, 95, 115],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 6.5,
          halign: "center",
          valign: "middle",
        },
        bodyStyles: {
          textColor: [55, 55, 55],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 250],
        },
        columnStyles: {
          0: {
            cellWidth: 9,
            halign: "center",
          },
          1: {
            cellWidth: 32,
          },
          2: {
            cellWidth: 24,
          },
          3: {
            cellWidth: 32,
          },
          4: {
            cellWidth: 18,
          },
          5: {
            cellWidth: 18,
          },
          6: {
            cellWidth: 20,
          },
          7: {
            cellWidth: 40,
          },
          8: {
            cellWidth: 28,
          },
          9: {
            cellWidth: 30,
          },
          10: {
            cellWidth: 20,
            halign: "center",
          },
          11: {
            cellWidth: 24,
          },
          12: {
            cellWidth: 24,
          },
        },
        margin: {
          left: 10,
          right: 10,
        },
        didDrawPage: (datos) => {
          const alturaPagina =
            documento.internal.pageSize.getHeight();

          documento.setFont("helvetica", "normal");
          documento.setFontSize(7);
          documento.setTextColor(110, 110, 110);

          documento.text(
            "Formulario de registro de información",
            10,
            alturaPagina - 7
          );

          documento.text(
            `Página ${datos.pageNumber}`,
            anchoPagina - 10,
            alturaPagina - 7,
            {
              align: "right",
            }
          );
        },
      });

      documento.save("respuestas-formulario.pdf");
    } catch (error) {
      console.error("Error generando PDF:", error);

      setError(
        "No fue posible generar el PDF. Intenta nuevamente."
      );
    } finally {
      setGenerandoPdf(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f2]">
        <p className="text-sm text-gray-600">
          Verificando sesión...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <header className="flex flex-col gap-4 bg-[#005f73] px-6 py-8 text-white sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
                Administración
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                Panel administrativo
              </h1>

              <p className="mt-2 text-sm text-white/85">
                Sesión iniciada como {correo}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cargarRespuestas}
                disabled={cargandoRespuestas}
                className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargandoRespuestas
                  ? "Actualizando..."
                  : "Actualizar"}
              </button>

              <button
                type="button"
                onClick={exportarPDF}
                disabled={
                  generandoPdf || respuestas.length === 0
                }
                className="rounded-xl bg-[#e67e22] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d96f16] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generandoPdf
                  ? "Generando PDF..."
                  : "Exportar PDF"}
              </button>

              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#005f73] transition hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          <section className="px-6 py-8 sm:px-8">
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-500">
                  Total de respuestas
                </p>

                <p className="mt-2 text-3xl font-bold text-[#005f73]">
                  {respuestas.length}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-500">
                  Última respuesta
                </p>

                <p className="mt-2 text-sm font-bold text-gray-700">
                  {respuestas.length > 0
                    ? formatearFecha(respuestas[0].created_at)
                    : "Sin registros"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-500">
                  Estado de conexión
                </p>

                <p className="mt-2 font-bold text-green-600">
                  • Supabase conectado
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#005f73]">
                    Respuestas registradas
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Información enviada desde el formulario público.
                  </p>
                </div>

                <span className="rounded-full bg-[#005f73] px-4 py-2 text-sm font-bold text-white">
                  {respuestas.length}{" "}
                  {respuestas.length === 1
                    ? "respuesta"
                    : "respuestas"}
                </span>
              </div>

              {cargandoRespuestas ? (
                <div className="flex min-h-[250px] items-center justify-center">
                  <p className="text-sm text-gray-500">
                    Cargando respuestas...
                  </p>
                </div>
              ) : respuestas.length === 0 ? (
                <div className="flex min-h-[250px] items-center justify-center px-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-700">
                      No hay respuestas registradas
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Cuando alguien complete el formulario,
                      aparecerá aquí.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1800px] w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#005f73] text-white">
                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          N.º
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Nombre y apellidos
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Teléfono / WhatsApp
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Correo electrónico
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Ciudad
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Barrio
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Rango de edad
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          ¿Qué cambiaría?
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          ¿Cuándo daría el paso?
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          ¿Con quién vive?
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Autorización
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Fecha de autorización
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold">
                          Fecha de registro
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {respuestas.map((respuesta, indice) => (
                        <tr
                          key={respuesta.id}
                          className="border-b border-gray-200 transition hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-bold text-[#005f73]">
                            {indice + 1}
                          </td>

                          <td className="px-4 py-4 font-semibold text-gray-800">
                            {respuesta.nombre_apellidos}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {respuesta.telefono_whatsapp}
                          </td>

                          <td className="px-4 py-4 text-gray-700">
                            {respuesta.correo_electronico || "-"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {respuesta.ciudad}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {respuesta.barrio}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {respuesta.rango_edad}
                          </td>

                          <td className="min-w-[260px] px-4 py-4 text-gray-700">
                            {respuesta.cambio_vivienda}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {respuesta.momento_para_dar_paso}
                          </td>

                          <td className="min-w-[230px] px-4 py-4 text-gray-700">
                            {respuesta.con_quien_vive}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            {respuesta.autorizacion_datos ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                Autorizado
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                No autorizado
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {formatearFecha(
                              respuesta.fecha_autorizacion
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                            {formatearFecha(respuesta.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}