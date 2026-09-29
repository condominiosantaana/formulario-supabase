"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";

/* ==========================================================================
   Tipos
   ========================================================================== */

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

type RespuestaNumerada = Respuesta & { numero: number };

type FiltroAutorizacion = "" | "si" | "no";

type DatoDistribucion = { etiqueta: string; cantidad: number };

/* ==========================================================================
   Utilidades de formato
   ========================================================================== */

function limpiarEspacios(texto: string) {
  // Evita espacios especiales que jsPDF (Helvetica) no puede dibujar.
  return texto.replace(/[\u202F\u00A0]/g, " ");
}

function analizarFecha(fecha: string | null): Date | null {
  if (!fecha) return null;
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? null : valor;
}

function formatearFecha(fecha: string | null) {
  const valor = analizarFecha(fecha);
  if (!valor) return "-";

  return limpiarEspacios(
    valor.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

function formatearSoloFecha(fecha: string | null) {
  const valor = analizarFecha(fecha);
  if (!valor) return "-";

  return valor.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatearSoloHora(fecha: string | null) {
  const valor = analizarFecha(fecha);
  if (!valor) return "";

  return limpiarEspacios(
    valor.toLocaleTimeString("es-CO", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

function fechaParaArchivo(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function valorOGuion(valor: string | null | undefined) {
  return valor && valor.trim() ? valor.trim() : "-";
}

function valoresUnicos(valores: string[]) {
  return Array.from(new Set(valores.filter((v) => v && v.trim()))).sort(
    (a, b) => a.localeCompare(b, "es")
  );
}

function contarPor(
  items: Respuesta[],
  obtener: (respuesta: Respuesta) => string
): DatoDistribucion[] {
  const conteo = new Map<string, number>();

  for (const item of items) {
    const clave = obtener(item)?.trim() || "Sin dato";
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }

  return Array.from(conteo.entries())
    .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
    .sort(
      (a, b) =>
        b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, "es")
    );
}

/* ==========================================================================
   Exportación PDF (Carta, vertical)
   ========================================================================== */

type RGB = [number, number, number];

const COLOR_PDF: Record<
  "primario" | "acento" | "texto" | "suave" | "borde" | "fondoSuave" | "verde" | "verdeClaro" | "rojo" | "rojoClaro",
  RGB
> = {
  primario: [0, 95, 115],
  acento: [230, 126, 34],
  texto: [30, 41, 59],
  suave: [100, 116, 139],
  borde: [214, 223, 228],
  fondoSuave: [236, 245, 247],
  verde: [21, 128, 61],
  verdeClaro: [220, 242, 228],
  rojo: [185, 28, 28],
  rojoClaro: [252, 228, 228],
};

const PDF_MARGEN = 14;
const PDF_INICIO_CONTENIDO = 24;
const PDF_MARGEN_INFERIOR = 20;
const PDF_ALTO_CABECERA_FICHA = 11;
const PDF_PADDING = 5;
const PDF_GAP_COLUMNAS = 6;
const PDF_ALTURA_LINEA = 4.3;

type Campo = { etiqueta: string; valor: string };
type CampoMedido = { etiqueta: string; lineas: string[] };
type FilaMedida = { campos: CampoMedido[]; alto: number };

function medirFila(doc: jsPDF, campos: Campo[], anchoCampo: number): FilaMedida {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const medidos = campos.map((campo) => ({
    etiqueta: campo.etiqueta,
    lineas: doc.splitTextToSize(campo.valor, anchoCampo) as string[],
  }));

  const maxLineas = Math.max(...medidos.map((campo) => campo.lineas.length));

  return { campos: medidos, alto: 6.4 + maxLineas * PDF_ALTURA_LINEA };
}

function dibujarFicha(
  doc: jsPDF,
  respuesta: RespuestaNumerada,
  yInicial: number
): number {
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const anchoFicha = ancho - PDF_MARGEN * 2;
  const anchoCompleto = anchoFicha - PDF_PADDING * 2;
  const anchoColumna = (anchoCompleto - PDF_GAP_COLUMNAS) / 2;

  const pares: [Campo, Campo][] = [
    [
      { etiqueta: "Teléfono / WhatsApp", valor: valorOGuion(respuesta.telefono_whatsapp) },
      { etiqueta: "Correo electrónico", valor: valorOGuion(respuesta.correo_electronico) },
    ],
    [
      { etiqueta: "Ciudad", valor: valorOGuion(respuesta.ciudad) },
      { etiqueta: "Barrio", valor: valorOGuion(respuesta.barrio) },
    ],
    [
      { etiqueta: "Rango de edad", valor: valorOGuion(respuesta.rango_edad) },
      {
        etiqueta: "Autorización de datos",
        valor: respuesta.autorizacion_datos ? "Autorizado" : "No autorizado",
      },
    ],
    [
      { etiqueta: "Fecha de autorización", valor: formatearFecha(respuesta.fecha_autorizacion) },
      { etiqueta: "Fecha de registro", valor: formatearFecha(respuesta.created_at) },
    ],
  ];

  const largos: Campo[] = [
    { etiqueta: "¿Qué cambiaría?", valor: valorOGuion(respuesta.cambio_vivienda) },
    { etiqueta: "¿Cuándo daría el paso?", valor: valorOGuion(respuesta.momento_para_dar_paso) },
    { etiqueta: "¿Con quién vive?", valor: valorOGuion(respuesta.con_quien_vive) },
  ];

  const filas: FilaMedida[] = [
    ...pares.map((par) => medirFila(doc, par, anchoColumna)),
    ...largos.map((campo) => medirFila(doc, [campo], anchoCompleto)),
  ];

  const altoFicha =
    PDF_ALTO_CABECERA_FICHA + 3 + filas.reduce((suma, fila) => suma + fila.alto, 0) + 1;

  let y = yInicial;

  // Evita que una ficha quede cortada entre páginas.
  if (y + altoFicha > alto - PDF_MARGEN_INFERIOR && y > PDF_INICIO_CONTENIDO) {
    doc.addPage();
    y = PDF_INICIO_CONTENIDO;
  }

  const x = PDF_MARGEN;

  // Marco y cabecera de la ficha
  doc.setFillColor(...COLOR_PDF.fondoSuave);
  doc.rect(x, y, anchoFicha, PDF_ALTO_CABECERA_FICHA, "F");
  doc.setDrawColor(...COLOR_PDF.borde);
  doc.setLineWidth(0.3);
  doc.rect(x, y, anchoFicha, altoFicha, "S");

  // Insignia con el número
  doc.setFillColor(...COLOR_PDF.primario);
  doc.circle(x + 7, y + PDF_ALTO_CABECERA_FICHA / 2, 3.6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(String(respuesta.numero), x + 7, y + PDF_ALTO_CABECERA_FICHA / 2 + 1.1, {
    align: "center",
  });

  // Nombre
  doc.setTextColor(...COLOR_PDF.texto);
  doc.setFontSize(10.5);
  const nombre = doc.splitTextToSize(valorOGuion(respuesta.nombre_apellidos), anchoFicha - 60) as string[];
  doc.text(nombre[0], x + 14, y + PDF_ALTO_CABECERA_FICHA / 2 + 1.3);

  // Estado de autorización (pastilla)
  const textoEstado = respuesta.autorizacion_datos ? "Autorizado" : "No autorizado";
  doc.setFontSize(8);
  const anchoPastilla = doc.getTextWidth(textoEstado) + 7;
  const xPastilla = x + anchoFicha - PDF_PADDING - anchoPastilla;
  const yPastilla = y + (PDF_ALTO_CABECERA_FICHA - 5.6) / 2;
  doc.setFillColor(...(respuesta.autorizacion_datos ? COLOR_PDF.verdeClaro : COLOR_PDF.rojoClaro));
  doc.roundedRect(xPastilla, yPastilla, anchoPastilla, 5.6, 2.8, 2.8, "F");
  doc.setTextColor(...(respuesta.autorizacion_datos ? COLOR_PDF.verde : COLOR_PDF.rojo));
  doc.text(textoEstado, xPastilla + anchoPastilla / 2, yPastilla + 3.9, { align: "center" });

  // Campos
  let yFila = y + PDF_ALTO_CABECERA_FICHA + 3;

  for (const fila of filas) {
    fila.campos.forEach((campo, indice) => {
      const xCampo = x + PDF_PADDING + indice * (anchoColumna + PDF_GAP_COLUMNAS);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_PDF.suave);
      doc.text(campo.etiqueta, xCampo, yFila + 2.6);

      doc.setFontSize(9.5);
      doc.setTextColor(...COLOR_PDF.texto);
      campo.lineas.forEach((linea, i) => {
        doc.text(linea, xCampo, yFila + 7 + i * PDF_ALTURA_LINEA);
      });
    });

    yFila += fila.alto;
  }

  return y + altoFicha + 4;
}

function dibujarEncabezadoPrimeraPagina(
  doc: jsPDF,
  fechaGeneracion: string,
  totalTexto: string
) {
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLOR_PDF.primario);
  doc.rect(0, 0, ancho, 44, "F");
  doc.setFillColor(...COLOR_PDF.acento);
  doc.rect(0, 44, ancho, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PANEL ADMINISTRATIVO", PDF_MARGEN, 13);

  doc.setFontSize(22);
  doc.text("REPORTE DE RESPUESTAS", PDF_MARGEN, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Formulario de registro", PDF_MARGEN, 33);

  doc.setFontSize(8.5);
  doc.text(`Generado: ${fechaGeneracion}`, PDF_MARGEN, 40);
  doc.text(totalTexto, ancho - PDF_MARGEN, 40, { align: "right" });
}

function dibujarResumenPrimeraPagina(
  doc: jsPDF,
  respuestas: RespuestaNumerada[],
  totalGeneral: number
) {
  const ancho = doc.internal.pageSize.getWidth();
  const gap = 4;
  const anchoCaja = (ancho - PDF_MARGEN * 2 - gap * 2) / 3;
  const y = 53;

  const autorizadas = respuestas.filter((r) => r.autorizacion_datos).length;
  const ultima = respuestas.reduce<string | null>((max, r) => {
    if (!max) return r.created_at;
    return new Date(r.created_at) > new Date(max) ? r.created_at : max;
  }, null);

  const totalTexto =
    respuestas.length === totalGeneral
      ? String(respuestas.length)
      : `${respuestas.length} de ${totalGeneral}`;

  const cajas: Campo[] = [
    { etiqueta: "Total de respuestas", valor: totalTexto },
    { etiqueta: "Con autorización de datos", valor: `${autorizadas} de ${respuestas.length}` },
    { etiqueta: "Última respuesta", valor: formatearFecha(ultima) },
  ];

  cajas.forEach((caja, indice) => {
    const x = PDF_MARGEN + indice * (anchoCaja + gap);

    doc.setFillColor(...COLOR_PDF.fondoSuave);
    doc.roundedRect(x, y, anchoCaja, 18, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_PDF.suave);
    doc.text(caja.etiqueta, x + 4, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(indice === 2 ? 9.5 : 14);
    doc.setTextColor(...COLOR_PDF.primario);
    doc.text(caja.valor, x + 4, y + 13.5);
  });
}

function dibujarEncabezadoInternoYPie(doc: jsPDF, fechaGeneracion: string) {
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const totalPaginas = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);

    if (pagina > 1) {
      doc.setFillColor(...COLOR_PDF.primario);
      doc.rect(0, 0, ancho, 12, "F");
      doc.setFillColor(...COLOR_PDF.acento);
      doc.rect(0, 12, ancho, 0.8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("REPORTE DE RESPUESTAS", PDF_MARGEN, 8);
      doc.setFont("helvetica", "normal");
      doc.text("Formulario de registro", ancho - PDF_MARGEN, 8, { align: "right" });
    }

    doc.setDrawColor(...COLOR_PDF.borde);
    doc.setLineWidth(0.3);
    doc.line(PDF_MARGEN, alto - 14, ancho - PDF_MARGEN, alto - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_PDF.suave);
    doc.text(`Generado el ${fechaGeneracion}`, PDF_MARGEN, alto - 9);
    doc.text("Panel administrativo", ancho / 2, alto - 9, { align: "center" });
    doc.text(`Página ${pagina} de ${totalPaginas}`, ancho - PDF_MARGEN, alto - 9, {
      align: "right",
    });
  }
}

/** Genera y descarga el PDF. Devuelve el nombre del archivo. */
function generarReportePdf(
  respuestas: RespuestaNumerada[],
  totalGeneral: number
): string {
  const doc = new jsPDF("p", "mm", "letter"); // Carta, vertical

  const ahora = new Date();
  const fechaGeneracion = limpiarEspacios(
    ahora.toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" })
  );

  const totalTexto =
    respuestas.length === totalGeneral
      ? `Total de respuestas: ${respuestas.length}`
      : `Respuestas incluidas: ${respuestas.length} de ${totalGeneral}`;

  // Página 1: encabezado, indicadores y tabla resumen
  dibujarEncabezadoPrimeraPagina(doc, fechaGeneracion, totalTexto);
  dibujarResumenPrimeraPagina(doc, respuestas, totalGeneral);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_PDF.primario);
  doc.text("Resumen de respuestas", PDF_MARGEN, 83);

  autoTable(doc, {
    startY: 87,
    head: [["N.º", "Nombre y apellidos", "Teléfono", "Correo electrónico", "Ciudad", "Barrio", "Edad"]],
    body: respuestas.map((r) => [
      String(r.numero),
      valorOGuion(r.nombre_apellidos),
      valorOGuion(r.telefono_whatsapp),
      valorOGuion(r.correo_electronico),
      valorOGuion(r.ciudad),
      valorOGuion(r.barrio),
      valorOGuion(r.rango_edad),
    ]),
    theme: "striped",
    margin: {
      top: PDF_INICIO_CONTENIDO,
      left: PDF_MARGEN,
      right: PDF_MARGEN,
      bottom: PDF_MARGEN_INFERIOR,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.2,
      overflow: "linebreak",
      valign: "middle",
      textColor: COLOR_PDF.texto,
    },
    headStyles: {
      fillColor: COLOR_PDF.primario,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [245, 249, 250] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 26 },
      3: { cellWidth: 43 },
      4: { cellWidth: 24 },
      5: { cellWidth: 24 },
      6: { cellWidth: 20 },
    },
  });

  // Fichas de detalle (una por respuesta, sin cortarse entre páginas)
  doc.addPage();
  let y = PDF_INICIO_CONTENIDO;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_PDF.primario);
  doc.text("Detalle de respuestas", PDF_MARGEN, y);
  y += 6;

  for (const respuesta of respuestas) {
    y = dibujarFicha(doc, respuesta, y);
  }

  // Encabezado interno, pie y "Página X de Y" en todas las páginas
  dibujarEncabezadoInternoYPie(doc, fechaGeneracion);

  const nombreArchivo = `reporte-respuestas-${fechaParaArchivo(ahora)}.pdf`;
  doc.save(nombreArchivo);
  return nombreArchivo;
}

/* ==========================================================================
   Iconos (SVG en línea, sin dependencias)
   ========================================================================== */

const ICONOS = {
  refresh: ["M21 12a9 9 0 1 1-2.64-6.36", "M21 3v6h-6"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  users: [
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M23 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
  database: [
    "M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3z",
    "M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5",
    "M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3",
  ],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"],
  close: ["M18 6L6 18", "M6 6l12 12"],
  filter: ["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"],
} as const;

type NombreIcono = keyof typeof ICONOS;

function Icono({
  nombre,
  className = "h-4 w-4",
}: {
  nombre: NombreIcono;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/* ==========================================================================
   Componentes de presentación
   ========================================================================== */

function TarjetaResumen({
  icono,
  titulo,
  valor,
  detalle,
  acento = "teal",
}: {
  icono: NombreIcono;
  titulo: string;
  valor: string;
  detalle: string;
  acento?: "teal" | "amber" | "green" | "red";
}) {
  const colores = {
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  } as const;

  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colores[acento]}`}
      >
        <Icono nombre={icono} className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {titulo}
        </p>
        <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">
          {valor}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{detalle}</p>
      </div>
    </div>
  );
}

function TarjetaDistribucion({
  titulo,
  datos,
  total,
  limite = 5,
}: {
  titulo: string;
  datos: DatoDistribucion[];
  total: number;
  limite?: number;
}) {
  const visibles = datos.slice(0, limite);
  const ocultos = datos.length - visibles.length;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">{titulo}</h3>

      {visibles.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Sin datos.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visibles.map((dato) => {
            const porcentaje = total > 0 ? (dato.cantidad / total) * 100 : 0;

            return (
              <li key={dato.etiqueta}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700" title={dato.etiqueta}>
                    {dato.etiqueta}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {dato.cantidad}{" "}
                    <span className="text-xs">({Math.round(porcentaje)}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#0a7c8c] to-[#2bb3a3] transition-all duration-500"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {ocultos > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          y {ocultos} {ocultos === 1 ? "categoría más" : "categorías más"}
        </p>
      )}
    </div>
  );
}

function InsigniaAutorizacion({ autorizado }: { autorizado: boolean }) {
  return autorizado ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Autorizado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      No autorizado
    </span>
  );
}

function TextoLargo({ texto }: { texto: string | null }) {
  const contenido = valorOGuion(texto);

  return (
    <p
      title={contenido}
      className="line-clamp-2 max-w-[280px] leading-snug text-slate-600"
    >
      {contenido}
    </p>
  );
}

function DetalleRespuesta({
  respuesta,
  onCerrar,
}: {
  respuesta: RespuestaNumerada;
  onCerrar: () => void;
}) {
  const botonCerrar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botonCerrar.current?.focus();

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
    }

    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [onCerrar]);

  const campos: [string, string][] = [
    ["Teléfono / WhatsApp", valorOGuion(respuesta.telefono_whatsapp)],
    ["Correo electrónico", valorOGuion(respuesta.correo_electronico)],
    ["Ciudad", valorOGuion(respuesta.ciudad)],
    ["Barrio", valorOGuion(respuesta.barrio)],
    ["Rango de edad", valorOGuion(respuesta.rango_edad)],
    ["¿Qué cambiaría?", valorOGuion(respuesta.cambio_vivienda)],
    ["¿Cuándo daría el paso?", valorOGuion(respuesta.momento_para_dar_paso)],
    ["¿Con quién vive?", valorOGuion(respuesta.con_quien_vive)],
    ["Fecha de autorización", formatearFecha(respuesta.fecha_autorizacion)],
    ["Fecha de registro", formatearFecha(respuesta.created_at)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Respuesta n.º {respuesta.numero}
            </p>
            <h2
              id="detalle-titulo"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {valorOGuion(respuesta.nombre_apellidos)}
            </h2>
            <div className="mt-2">
              <InsigniaAutorizacion autorizado={respuesta.autorizacion_datos} />
            </div>
          </div>

          <button
            ref={botonCerrar}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7c8c]"
          >
            <Icono nombre="close" className="h-5 w-5" />
          </button>
        </div>

        <dl className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {campos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {etiqueta}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                {valor}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}

/* ==========================================================================
   Página
   ========================================================================== */

const CLASE_CAMPO =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0a7c8c] focus:ring-4 focus:ring-[#0a7c8c]/15";

const CLASE_ENCABEZADOS =
  "sticky top-0 z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500";

const ENCABEZADOS_TABLA = [
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
  "Fecha de autorización",
  "Fecha de registro",
];

export default function AdminPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoRespuestas, setCargandoRespuestas] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [conexionOk, setConexionOk] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEdad, setFiltroEdad] = useState("");
  const [filtroMomento, setFiltroMomento] = useState("");
  const [filtroAutorizacion, setFiltroAutorizacion] =
    useState<FiltroAutorizacion>("");
  const [seleccionada, setSeleccionada] = useState<RespuestaNumerada | null>(
    null
  );

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

  // El aviso de éxito desaparece solo.
  useEffect(() => {
    if (!mensaje) return;
    const temporizador = setTimeout(() => setMensaje(""), 4500);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

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
      setConexionOk(false);
      setRespuestas([]);
    } else {
      setConexionOk(true);
      setRespuestas((data ?? []) as Respuesta[]);
    }

    setCargandoRespuestas(false);
  }

  async function cerrarSesion() {
    setCerrandoSesion(true);

    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  /* ---------- Datos derivados (todo en memoria) ---------- */

  const numeradas = useMemo<RespuestaNumerada[]>(
    () => respuestas.map((respuesta, indice) => ({ ...respuesta, numero: indice + 1 })),
    [respuestas]
  );

  const opcionesEdad = useMemo(
    () => valoresUnicos(respuestas.map((r) => r.rango_edad)),
    [respuestas]
  );

  const opcionesMomento = useMemo(
    () => valoresUnicos(respuestas.map((r) => r.momento_para_dar_paso)),
    [respuestas]
  );

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda.trim());

    return numeradas.filter((r) => {
      if (filtroEdad && r.rango_edad !== filtroEdad) return false;
      if (filtroMomento && r.momento_para_dar_paso !== filtroMomento) return false;
      if (filtroAutorizacion === "si" && !r.autorizacion_datos) return false;
      if (filtroAutorizacion === "no" && r.autorizacion_datos) return false;

      if (!termino) return true;

      const texto = normalizar(
        [
          r.nombre_apellidos,
          r.telefono_whatsapp,
          r.telefono_whatsapp?.replace(/\D/g, ""),
          r.correo_electronico ?? "",
          r.ciudad,
          r.barrio,
        ].join(" ")
      );

      return texto.includes(termino);
    });
  }, [numeradas, busqueda, filtroEdad, filtroMomento, filtroAutorizacion]);

  const estadisticas = useMemo(
    () => ({
      edad: contarPor(respuestas, (r) => r.rango_edad),
      momento: contarPor(respuestas, (r) => r.momento_para_dar_paso),
      ciudad: contarPor(respuestas, (r) => r.ciudad),
    }),
    [respuestas]
  );

  const hayFiltros = Boolean(
    busqueda || filtroEdad || filtroMomento || filtroAutorizacion
  );

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEdad("");
    setFiltroMomento("");
    setFiltroAutorizacion("");
  }

  /* ---------- Exportación ---------- */

  async function exportarPDF() {
    if (generandoPdf) return;

    if (filtradas.length === 0) {
      setError("No hay respuestas para exportar.");
      return;
    }

    setGenerandoPdf(true);
    setError("");
    setMensaje("");

    try {
      // Permite que el estado de carga se pinte antes del trabajo síncrono.
      await new Promise<void>((resolver) => setTimeout(resolver, 60));

      const nombreArchivo = generarReportePdf(filtradas, respuestas.length);

      setMensaje(
        `PDF generado (${filtradas.length} ${
          filtradas.length === 1 ? "respuesta" : "respuestas"
        }): ${nombreArchivo}`
      );
    } catch (errorPdf) {
      console.error("Error generando PDF:", errorPdf);

      setError("No fue posible generar el PDF. Intenta nuevamente.");
    } finally {
      setGenerandoPdf(false);
    }
  }

  /* ---------- Render ---------- */

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8]">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Icono nombre="refresh" className="h-5 w-5 animate-spin text-[#0a7c8c]" />
          Verificando sesión...
        </div>
      </main>
    );
  }

  const ultima = respuestas[0]?.created_at ?? null;

  return (
    <main className="min-h-screen bg-[#f4f7f8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* ---------------- Encabezado ---------------- */}
        <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#04303a] via-[#005f73] to-[#0a8a8f] px-6 py-7 text-white shadow-lg sm:px-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Administración
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Panel administrativo
              </h1>

              <p className="mt-2 break-all text-sm text-white/80">
                Sesión iniciada como{" "}
                <span className="font-semibold text-white">{correo}</span>
              </p>

              <span
                className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  conexionOk
                    ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                    : "border-red-300/40 bg-red-400/20 text-red-100"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {conexionOk && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      conexionOk ? "bg-emerald-300" : "bg-red-300"
                    }`}
                  />
                </span>
                {conexionOk ? "Supabase conectado" : "Sin conexión con Supabase"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cargarRespuestas}
                disabled={cargandoRespuestas}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#005f73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icono
                  nombre="refresh"
                  className={`h-4 w-4 ${cargandoRespuestas ? "animate-spin" : ""}`}
                />
                {cargandoRespuestas ? "Actualizando..." : "Actualizar"}
              </button>

              <button
                type="button"
                onClick={exportarPDF}
                disabled={generandoPdf || filtradas.length === 0}
                title="Exporta las respuestas que se muestran en la tabla"
                className="inline-flex items-center gap-2 rounded-xl bg-[#e67e22] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-900/20 transition hover:bg-[#d96f16] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#005f73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icono
                  nombre={generandoPdf ? "refresh" : "download"}
                  className={`h-4 w-4 ${generandoPdf ? "animate-spin" : ""}`}
                />
                {generandoPdf ? "Generando PDF..." : "Exportar PDF"}
              </button>

              <button
                type="button"
                onClick={cerrarSesion}
                disabled={cerrandoSesion}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#005f73] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#005f73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icono nombre="logout" className="h-4 w-4" />
                {cerrandoSesion ? "Cerrando..." : "Cerrar sesión"}
              </button>
            </div>
          </div>
        </header>

        {/* ---------------- Avisos ---------------- */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* ---------------- Tarjetas de resumen ---------------- */}
        <section
          aria-label="Resumen"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <TarjetaResumen
            icono="users"
            titulo="Total de respuestas"
            valor={String(respuestas.length)}
            detalle={
              hayFiltros
                ? `Mostrando ${filtradas.length} con los filtros`
                : "Registros recibidos"
            }
          />

          <TarjetaResumen
            icono="clock"
            acento="amber"
            titulo="Última respuesta"
            valor={ultima ? formatearSoloFecha(ultima) : "Sin registros"}
            detalle={ultima ? formatearSoloHora(ultima) : "Aún no hay envíos"}
          />

          <TarjetaResumen
            icono="database"
            acento={conexionOk ? "green" : "red"}
            titulo="Estado"
            valor={conexionOk ? "Supabase conectado" : "Sin conexión"}
            detalle={
              conexionOk
                ? "Conexión activa"
                : "Pulsa Actualizar para reintentar"
            }
          />
        </section>

        {/* ---------------- Estadísticas ---------------- */}
        {respuestas.length > 0 && (
          <section aria-label="Estadísticas" className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Estadísticas de las respuestas cargadas
            </h2>

            <div className="grid gap-4 lg:grid-cols-3">
              <TarjetaDistribucion
                titulo="Rango de edad"
                datos={estadisticas.edad}
                total={respuestas.length}
              />
              <TarjetaDistribucion
                titulo="¿Cuándo daría el paso?"
                datos={estadisticas.momento}
                total={respuestas.length}
              />
              <TarjetaDistribucion
                titulo="Ciudad"
                datos={estadisticas.ciudad}
                total={respuestas.length}
              />
            </div>
          </section>
        )}

        {/* ---------------- Tabla ---------------- */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Respuestas registradas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Información enviada desde el formulario público.
                </p>
              </div>

              <span className="inline-flex w-fit items-center rounded-full bg-teal-50 px-3.5 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/20">
                {hayFiltros
                  ? `${filtradas.length} de ${respuestas.length}`
                  : respuestas.length}{" "}
                {respuestas.length === 1 ? "respuesta" : "respuestas"}
              </span>
            </div>

            {/* Buscador y filtros */}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
              <div className="relative">
                <label htmlFor="busqueda" className="sr-only">
                  Buscar por nombre, teléfono, correo, ciudad o barrio
                </label>
                <Icono
                  nombre="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="busqueda"
                  type="search"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar por nombre, teléfono, correo, ciudad o barrio"
                  className={`${CLASE_CAMPO} pl-9`}
                />
              </div>

              <div>
                <label htmlFor="filtro-edad" className="sr-only">
                  Filtrar por rango de edad
                </label>
                <select
                  id="filtro-edad"
                  value={filtroEdad}
                  onChange={(evento) => setFiltroEdad(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  <option value="">Todas las edades</option>
                  {opcionesEdad.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filtro-momento" className="sr-only">
                  Filtrar por momento para dar el paso
                </label>
                <select
                  id="filtro-momento"
                  value={filtroMomento}
                  onChange={(evento) => setFiltroMomento(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  <option value="">Cualquier momento</option>
                  {opcionesMomento.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filtro-autorizacion" className="sr-only">
                  Filtrar por autorización
                </label>
                <select
                  id="filtro-autorizacion"
                  value={filtroAutorizacion}
                  onChange={(evento) =>
                    setFiltroAutorizacion(evento.target.value as FiltroAutorizacion)
                  }
                  className={CLASE_CAMPO}
                >
                  <option value="">Toda autorización</option>
                  <option value="si">Autorizado</option>
                  <option value="no">No autorizado</option>
                </select>
              </div>

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={!hayFiltros}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0a7c8c]/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icono nombre="close" className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>

          {cargandoRespuestas ? (
            <div className="flex min-h-[250px] items-center justify-center gap-3 text-sm text-slate-500">
              <Icono nombre="refresh" className="h-5 w-5 animate-spin text-[#0a7c8c]" />
              Cargando respuestas...
            </div>
          ) : respuestas.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Icono nombre="users" className="h-6 w-6" />
                </span>
                <p className="mt-4 text-lg font-bold text-slate-800">
                  No hay respuestas registradas
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cuando alguien complete el formulario, aparecerá aquí.
                </p>
              </div>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Icono nombre="filter" className="h-6 w-6" />
                </span>
                <p className="mt-4 text-lg font-bold text-slate-800">
                  Ninguna respuesta coincide
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otros términos o limpia los filtros.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1700px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    {ENCABEZADOS_TABLA.map((titulo) => (
                      <th key={titulo} scope="col" className={CLASE_ENCABEZADOS}>
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtradas.map((respuesta) => (
                    <tr
                      key={respuesta.id}
                      className="transition-colors hover:bg-teal-50/60 [&>td]:border-b [&>td]:border-slate-100"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold tabular-nums text-[#005f73]">
                        {respuesta.numero}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSeleccionada(respuesta)}
                          title="Ver detalle completo"
                          className="max-w-[240px] truncate text-left font-semibold text-slate-900 underline-offset-2 transition hover:text-[#005f73] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7c8c]"
                        >
                          {valorOGuion(respuesta.nombre_apellidos)}
                        </button>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">
                        {valorOGuion(respuesta.telefono_whatsapp)}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <p
                          title={valorOGuion(respuesta.correo_electronico)}
                          className="max-w-[240px] truncate"
                        >
                          {valorOGuion(respuesta.correo_electronico)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        {valorOGuion(respuesta.ciudad)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        {valorOGuion(respuesta.barrio)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {valorOGuion(respuesta.rango_edad)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <TextoLargo texto={respuesta.cambio_vivienda} />
                      </td>

                      <td className="px-4 py-3.5">
                        <TextoLargo texto={respuesta.momento_para_dar_paso} />
                      </td>

                      <td className="px-4 py-3.5">
                        <TextoLargo texto={respuesta.con_quien_vive} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <InsigniaAutorizacion autorizado={respuesta.autorizacion_datos} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">
                        {formatearFecha(respuesta.fecha_autorizacion)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">
                        {formatearFecha(respuesta.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ---------------- Detalle ---------------- */}
      {seleccionada && (
        <DetalleRespuesta
          respuesta={seleccionada}
          onCerrar={() => setSeleccionada(null)}
        />
      )}

      {/* ---------------- Aviso de éxito ---------------- */}
      {mensaje && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-40 max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"
        >
          {mensaje}
        </div>
      )}
    </main>
  );
}