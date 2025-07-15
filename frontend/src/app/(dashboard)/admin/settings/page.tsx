"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Shield, 
  Globe,
  Key,
  Bell,
  Lock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    appName: "Peranto dApp",
    appDescription: "Plataforma de credenciales verificables basada en KILT",
    contactEmail: "admin@peranto.com",
    supportEmail: "support@peranto.com",
    maxFileSize: "10",
    sessionTimeout: "24"
  });

  const [securitySettings, setSecuritySettings] = useState({
    requireTwoFactor: false,
    passwordMinLength: "8",
    maxLoginAttempts: "5",
    sessionTimeout: "24",
    enableAuditLog: true,
    requireEmailVerification: true
  });

  const [networkSettings, setNetworkSettings] = useState({
    kiltNetwork: "spiritnet",
    dappDid: "did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQUijKV",
    encryptionKey: "0x1234567890abcdef...",
    webhookUrl: "https://api.peranto.com/webhooks",
    apiRateLimit: "100"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    userRegistrationAlerts: true,
    systemErrorAlerts: true
  });

  const handleSave = (section: string) => {
    console.log(`Guardando configuración de ${section}...`);
    // Aquí iría la lógica para guardar en el backend
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuración del Sistema
          </h1>
          <p className="text-muted-foreground">
            Gestiona la configuración general de la dApp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Restaurar
          </Button>
          <Button className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Guardar Todo
          </Button>
        </div>
      </div>

      {/* Estado del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operativo</div>
            <p className="text-xs text-muted-foreground">
              Todos los servicios funcionando correctamente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hace 2h</div>
            <p className="text-xs text-muted-foreground">
              Configuración sincronizada
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">2</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuraciones */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Red
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nombre de la Aplicación</Label>
                  <Input
                    id="appName"
                    value={generalSettings.appName}
                    onChange={(e) => setGeneralSettings({...generalSettings, appName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appDescription">Descripción</Label>
                <Textarea
                  id="appDescription"
                  value={generalSettings.appDescription}
                  onChange={(e) => setGeneralSettings({...generalSettings, appDescription: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Tamaño Máximo de Archivo (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={generalSettings.maxFileSize}
                    onChange={(e) => setGeneralSettings({...generalSettings, maxFileSize: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sesión (horas)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={generalSettings.sessionTimeout}
                    onChange={(e) => setGeneralSettings({...generalSettings, sessionTimeout: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('general')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Configuración General
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <p className="text-sm text-muted-foreground">
                      Requerir 2FA para todos los usuarios
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireTwoFactor}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireTwoFactor: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Log de Auditoría</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas las acciones administrativas
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableAuditLog}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableAuditLog: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verificación de Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Requerir verificación de email para nuevos usuarios
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireEmailVerification: checked})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longitud Mínima de Contraseña</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Intentos Máximos de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('security')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Configuración de Seguridad
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración de Red KILT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kiltNetwork">Red KILT</Label>
                <select
                  id="kiltNetwork"
                  className="w-full p-2 border rounded-md"
                  value={networkSettings.kiltNetwork}
                  onChange={(e) => setNetworkSettings({...networkSettings, kiltNetwork: e.target.value})}
                >
                  <option value="spiritnet">Spiritnet (Producción)</option>
                  <option value="peregrine">Peregrine (Testnet)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dappDid">DID de la dApp</Label>
                <Input
                  id="dappDid"
                  value={networkSettings.dappDid}
                  onChange={(e) => setNetworkSettings({...networkSettings, dappDid: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="encryptionKey">Clave de Encriptación</Label>
                <Input
                  id="encryptionKey"
                  type="password"
                  value={networkSettings.encryptionKey}
                  onChange={(e) => setNetworkSettings({...networkSettings, encryptionKey: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL de Webhook</Label>
                <Input
                  id="webhookUrl"
                  value={networkSettings.webhookUrl}
                  onChange={(e) => setNetworkSettings({...networkSettings, webhookUrl: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiRateLimit">Límite de Rate API (req/min)</Label>
                <Input
                  id="apiRateLimit"
                  type="number"
                  value={networkSettings.apiRateLimit}
                  onChange={(e) => setNetworkSettings({...networkSettings, apiRateLimit: e.target.value})}
                />
              </div>
              <Button onClick={() => handleSave('network')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Configuración de Red
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuración de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificaciones por email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificaciones push en tiempo real
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Administrador</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar eventos importantes a administradores
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.adminAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, adminAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Registro</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar nuevos registros de usuarios
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.userRegistrationAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, userRegistrationAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Error del Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar errores críticos del sistema
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemErrorAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemErrorAlerts: checked})}
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('notifications')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Configuración de Notificaciones
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 