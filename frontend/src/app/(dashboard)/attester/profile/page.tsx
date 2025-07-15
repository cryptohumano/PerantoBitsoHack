'use client'

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialUser = {
  name: "Attester Demo",
  email: "attester@peranto.io",
  did: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
  role: "attester",
  status: "activo",
  company: "Peranto S.A. de C.V.",
  avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=attester"
};

export default function Page() {
  const [user, setUser] = useState(initialUser);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    company: user.company,
    avatar: user.avatar
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setUser({ ...user, ...form });
    setEdit(false);
  };

  return (
    <DashboardShell>
      <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Información de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              {edit ? (
                <Input
                  name="avatar"
                  value={form.avatar}
                  onChange={handleChange}
                  placeholder="URL del avatar"
                  className="w-full"
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Nombre:</span>{" "}
                {edit ? (
                  <Input name="name" value={form.name} onChange={handleChange} className="w-full" />
                ) : (
                  user.name
                )}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {edit ? (
                  <Input name="email" value={form.email} onChange={handleChange} className="w-full" />
                ) : (
                  user.email
                )}
              </div>
              <div>
                <span className="font-semibold">Empresa/Organización:</span>{" "}
                {edit ? (
                  <Input name="company" value={form.company} onChange={handleChange} className="w-full" />
                ) : (
                  user.company
                )}
              </div>
              <div>
                <span className="font-semibold">DID:</span>
                <span className="font-mono text-xs ml-2">{user.did}</span>
              </div>
              <div>
                <span className="font-semibold">Rol:</span> <Badge variant="default">{user.role}</Badge>
              </div>
              <div>
                <span className="font-semibold">Estado:</span> <Badge variant="secondary">{user.status}</Badge>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {edit ? (
                <>
                  <Button variant="default" onClick={handleSave}>Guardar</Button>
                  <Button variant="secondary" onClick={() => setEdit(false)}>Cancelar</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setEdit(true)}>Editar Perfil</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
} 