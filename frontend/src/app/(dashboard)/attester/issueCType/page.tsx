'use client'

import React, { useState } from "react";
import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Esqueleto de la página para emitir un CType
export default function IssueCTypePage() {
  // Estados para cada paso
  const [step, setStep] = useState(1);
  const [network, setNetwork] = useState<string>("");
  const [did, setDid] = useState<string>("");
  const [title, setTitle] = useState("");
  const [properties, setProperties] = useState<Array<{ name: string; type: string; required: boolean }>>([]);
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("string");
  const [isRequired, setIsRequired] = useState(false);
  const [required, setRequired] = useState<string[]>([]);
  const [schema, setSchema] = useState<{ $schema: string; title: string; properties: Record<string, { type: string }>; type: string; required: string[] } | null>(null);
  const [hash, setHash] = useState<string>("");
  const [hashStatus, setHashStatus] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");
  const [ipfsStatus, setIpfsStatus] = useState<string>("");

  // Simulación de DIDs disponibles
  const availableDids = [
    { alias: "Mi DID", did: "did:kilt:4rF...xyz" },
    { alias: "Org DID", did: "did:kilt:4rF...abc" },
  ];

  // Simulación de redes
  const networks = [
    { label: "Spiritnet (Producción)", value: "spiritnet" },
    { label: "Peregrine (Testnet)", value: "peregrine" },
  ];

  // Handlers para agregar propiedades
  const handleAddProperty = () => {
    if (!propertyName) return;
    setProperties([...properties, { name: propertyName, type: propertyType, required: isRequired }]);
    if (isRequired) setRequired([...required, propertyName]);
    setPropertyName("");
    setPropertyType("string");
    setIsRequired(false);
  };

  const handleRemoveProperty = (name: string) => {
    setProperties(properties.filter((p) => p.name !== name));
    setRequired(required.filter((r) => r !== name));
  };

  // Handler para crear el esquema (simulado)
  const handleCreateSchema = () => {
    const props: Record<string, { type: string }> = {};
    properties.forEach((p) => {
      props[p.name] = { type: p.type };
    });
    setSchema({
      $schema: "http://kilt-protocol.org/draft-01/ctype#",
      title,
      properties: props,
      type: "object",
      required,
    });
    setStep(4);
  };

  // Handler para simular cálculo de hash y verificación
  const handleCalculateHash = () => {
    setHash("0x1234abcd...");
    setHashStatus("No existe en la cadena (simulado)");
    setStep(5);
  };

  // Handler para simular registro en blockchain
  const handleRegisterCType = () => {
    setTxStatus("Transacción enviada (simulado)");
    setStep(6);
  };

  // Handler para simular publicación en IPFS
  const handlePublishIPFS = () => {
    setIpfsStatus("Publicado en IPFS: Qm... (simulado)");
    setStep(7);
  };

  return (
    <DashboardShell>
      <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
        {/* Paso 1: Selección de red */}
        {step === 1 && (
          <div className="space-y-4">
            <Label>Selecciona la red:</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una red" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((n) => (
                  <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!network} onClick={() => setStep(2)}>Siguiente</Button>
          </div>
        )}
        {/* Paso 2: Selección de DID */}
        {step === 2 && (
          <div className="space-y-4">
            <Label>Selecciona el DID emisor:</Label>
            <Select value={did} onValueChange={setDid}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un DID" />
              </SelectTrigger>
              <SelectContent>
                {availableDids.map((d) => (
                  <SelectItem key={d.did} value={d.did}>{d.alias} ({d.did})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!did} onClick={() => setStep(3)}>Siguiente</Button>
          </div>
        )}
        {/* Paso 3: Definir esquema */}
        {step === 3 && (
          <div className="space-y-4">
            <Label>Título del CType:</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Credencial de Estudiante"
            />
            <div className="mt-4">
              <Label className="mb-2">Propiedades:</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Nombre de la propiedad"
                  className="flex-1"
                />
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">string</SelectItem>
                    <SelectItem value="number">number</SelectItem>
                    <SelectItem value="boolean">boolean</SelectItem>
                    <SelectItem value="array">array</SelectItem>
                    <SelectItem value="object">object</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Checkbox checked={isRequired} onCheckedChange={(checked) => setIsRequired(checked as boolean)} />
                  <Label>Requerido</Label>
                </div>
                <Button onClick={handleAddProperty} type="button">Agregar</Button>
              </div>
              <ul className="space-y-1">
                {properties.map((p) => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span className="font-mono">{p.name}</span>
                    <span className="text-xs text-muted-foreground">({p.type})</span>
                    {p.required && <span className="text-xs text-green-600">requerido</span>}
                    <Button variant="ghost" size="sm" className="text-red-500 ml-2" onClick={() => handleRemoveProperty(p.name)}>Eliminar</Button>
                  </li>
                ))}
              </ul>
            </div>
            <Button disabled={!title || properties.length === 0} onClick={handleCreateSchema}>Siguiente</Button>
          </div>
        )}
        {/* Paso 4: Resumen del esquema */}
        {step === 4 && schema && (
          <div className="space-y-4">
            <Label>Resumen del esquema:</Label>
            <Card>
              <CardContent className="p-4">
                <pre className="overflow-x-auto text-xs">{JSON.stringify(schema, null, 2)}</pre>
              </CardContent>
            </Card>
            <Button onClick={handleCalculateHash}>Calcular Hash y Verificar en Blockchain</Button>
          </div>
        )}
        {/* Paso 5: Hash y verificación */}
        {step === 5 && (
          <div className="space-y-4">
            <Label>Hash calculado:</Label>
            <Card>
              <CardContent className="p-2 font-mono">{hash}</CardContent>
            </Card>
            <Alert>
              <AlertDescription>{hashStatus}</AlertDescription>
            </Alert>
            <Button onClick={handleRegisterCType}>Registrar CType en Blockchain</Button>
          </div>
        )}
        {/* Paso 6: Registro en blockchain */}
        {step === 6 && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-green-600">{txStatus}</AlertDescription>
            </Alert>
            <Button onClick={handlePublishIPFS}>Publicar en IPFS</Button>
          </div>
        )}
        {/* Paso 7: Publicación en IPFS */}
        {step === 7 && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-green-600">{ipfsStatus}</AlertDescription>
            </Alert>
            <Alert>
              <AlertDescription>¡CType emitido y publicado exitosamente!</AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </DashboardShell>
  );
} 