import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verificar Documento | HUB Legal | Peranto",
  description: "Verifica la validez de tus cualquier documento firmado en la blockchain.",
};

export default function Page() {
  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Verificar documento firmado</h1>
        <p className="mb-4 text-gray-600">
          Sube o arrastra aquí tu archivo PDF firmado. La plataforma verificará en la blockchain si el documento es válido y no ha sido alterado.
        </p>
        {/* Componente de upload/drag & drop (pendiente de lógica) */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 mb-4">
          <span>Arrastra tu PDF aquí o haz click para seleccionar archivo</span>
        </div>
        <button className="w-full bg-primary text-white py-2 rounded disabled:opacity-50" disabled>
          Verificar documento (pendiente de integración)
        </button>
        <div className="mt-6 text-sm text-yellow-600">
          <strong>Pendiente:</strong> Integrar lógica de verificación con KILT y blockchain.<br />
          Consulta la documentación de <a href="https://github.com/KILT-Foundation/didsign.io" target="_blank" rel="noopener noreferrer" className="underline">DIDSign.io</a> para referencia sobre métodos de verificación de documentos firmados.
        </div>
      </div>
    </div>
  );
} 