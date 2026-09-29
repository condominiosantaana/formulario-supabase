"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PruebaSupabase() {
  const [estado, setEstado] = useState("Probando conexión...");
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    async function probarConexion() {
      try {
        const { error } = await supabase.auth.getSession();

        if (error) {
          setEstado("❌ Error de conexión");
          setDetalle(error.message);
          return;
        }

        setEstado("✅ Conexión con Supabase correcta");
        setDetalle(
          "Next.js puede comunicarse correctamente con el proyecto de Supabase."
        );
      } catch (error) {
        setEstado("❌ Error inesperado");
        setDetalle(
          error instanceof Error ? error.message : "Error desconocido"
        );
      }
    }

    probarConexion();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "#ffffff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#005f73",
            marginBottom: "20px",
          }}
        >
          Prueba de Supabase
        </h1>

        <h2
          style={{
            marginBottom: "15px",
            color: "#333",
          }}
        >
          {estado}
        </h2>

        <p
          style={{
            color: "#666",
            lineHeight: "1.6",
          }}
        >
          {detalle}
        </p>
      </div>
    </main>
  );
}