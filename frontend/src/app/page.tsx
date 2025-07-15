"use client"

import Link from "next/link"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ReactCountryFlag from "react-country-flag"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useEffect } from "react"
import { LoginSSOButton } from "@/components/auth/LoginSSOButton"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/context/AuthContext"
import { FullDidDetectionModal } from "@/components/onboarding/FullDidDetectionModal"
import { VisitorConversionFlow } from "@/components/onboarding/VisitorConversionFlow"

export default function LandingPage() {
  const { isAuthenticated, activeRole } = useAuth();

  // Redirigir automáticamente cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Redirigir según el rol activo del usuario
      let redirectPath = '/citizen/'; // default
      switch (activeRole) {
        case 'ATTESTER':
          redirectPath = '/attester/';
          break;
        case 'ADMIN':
          redirectPath = '/admin/';
          break;
        case 'USER':
        default:
          redirectPath = '/citizen/';
          break;
      }
      
      console.log(`[LandingPage] Usuario autenticado (rol activo: ${activeRole}), redirigiendo a ${redirectPath}`);
      window.location.href = redirectPath;
    }
  }, [isAuthenticated, activeRole]);

  // Componente para el botón de conexión (solo para el menú móvil)
  const ConnectButton = ({ className = "" }: { className?: string }) => {
    return (
      <LoginSSOButton className={className} />
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Mostrar flujo de conversión para visitantes no autenticados */}
      {!isAuthenticated && <VisitorConversionFlow />}
      {/* Mostrar detección de FullDID para usuarios autenticados */}
      {isAuthenticated && <FullDidDetectionModal />}
      {/* Navbar */}
      <header className="w-full border-b bg-background/80 sticky top-0 z-50">
        <nav className="container flex items-center justify-between h-16 mx-auto px-4">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-primary">Peranto</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs font-mono cursor-help">Ci.Go</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ciudadano y Gobierno - Tu identidad digital autosoberana</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Menú de escritorio */}
          <NavigationMenu className="hidden sm:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#about">¿Qué es?</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#features">Características</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#numeralia">Numeralia</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#roadmap">Roadmap</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#reconocimientos">Reconocimientos</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="#team">Equipo</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <LoginSSOButton />
              </NavigationMenuItem>
              <NavigationMenuItem>
                <ThemeToggle />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Menú móvil (hamburguesa) */}
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SheetHeader className="p-4">
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 p-4">
                  <Link href="#about" className="py-2 px-4 rounded hover:bg-muted">¿Qué es?</Link>
                  <Link href="#features" className="py-2 px-4 rounded hover:bg-muted">Características</Link>
                  <Link href="#numeralia" className="py-2 px-4 rounded hover:bg-muted">Numeralia</Link>
                  <Link href="#roadmap" className="py-2 px-4 rounded hover:bg-muted">Roadmap</Link>
                  <Link href="#reconocimientos" className="py-2 px-4 rounded hover:bg-muted">Reconocimientos</Link>
                  <Link href="#team" className="py-2 px-4 rounded hover:bg-muted">Equipo</Link>
                  <ConnectButton className="w-full" />
                  <ThemeToggle />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center text-center py-8 sm:py-16">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Controla tu identidad digital<br />de forma <span className="text-primary">autosoberana</span></h1>
          <p className="max-w-xl mx-auto text-lg md:text-2xl text-muted-foreground mb-8">
            peranto Ci.Go es una dApp pública para gestionar tu identidad digital, legal, comercial y académica.<br />
            <span className="font-semibold">Hecho en México, para el mundo.</span>
          </p>
          <div className="space-y-4">
            <LoginSSOButton className="px-8 py-3 text-lg shadow" />
            {/* Add error handling and display */}
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-8 sm:py-16">
          <h2 className="text-3xl font-bold mb-4">¿Qué es peranto Ci.Go?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            peranto es un ecosistema digital para la transición a la economía circular usando identidad autosoberana. Ci.Go es el primer producto, poniendo al ciudadano en el centro para reclamar y gestionar su identidad digital en servicios públicos y privados.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
            <li>✔️ Identidad legal lista para internet</li>
            <li>✔️ Privada, autogestionada y revocable</li>
            <li>✔️ Firmar contratos y procesos KYC reutilizables</li>
            <li>✔️ Acceso a servicios online anónimos o con KYC completo</li>
            <li>✔️ Chat autenticado entre ciudadanos e instituciones</li>
          </ul>
        </section>

        {/* Features */}
        <section id="features" className="py-8 sm:py-16">
          <h2 className="text-3xl font-bold mb-4">Características principales</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
            <li className="bg-muted rounded p-6">
              <span className="font-bold">INE Digital</span><br />
              Tu credencial digital con cifrado de nueva generación.
            </li>
            <li className="bg-muted rounded p-6">
              <span className="font-bold">KYC Reutilizable</span><br />
              Verifica tu edad, firma contratos y accede a servicios financieros.
            </li>
            <li className="bg-muted rounded p-6">
              <span className="font-bold">Gestión de credenciales</span><br />
              Controla, revoca y rastrea tus credenciales de identidad.
            </li>
          </ul>
        </section>

        {/* Numeralia */}
        <section id="numeralia" className="py-8 sm:py-16">
          <h2 className="text-3xl font-bold mb-4">Numeralia</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted rounded p-6 flex flex-col items-center cursor-help">
                    <span className="text-4xl font-bold">1.5M</span>
                    <Badge className="mb-2 mt-1">Sin derecho a identidad</Badge>
                    <span className="text-muted-foreground text-sm">de mexicanos no disfrutan su derecho a identidad</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Datos del INEGI 2023</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted rounded p-6 flex flex-col items-center cursor-help">
                    <span className="text-4xl font-bold">98M</span>
                    <Badge className="mb-2 mt-1">INE física</Badge>
                    <span className="text-muted-foreground text-sm">de mexicanos tienen INE física</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>INE 2023</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted rounded p-6 flex flex-col items-center cursor-help">
                    <span className="text-4xl font-bold">88M</span>
                    <Badge className="mb-2 mt-1">Usuarios de internet</Badge>
                    <span className="text-muted-foreground text-sm">mexicanos usan internet</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>INEGI 2023</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted rounded p-6 flex flex-col items-center cursor-help">
                    <span className="text-4xl font-bold">266.5M USD</span>
                    <Badge className="mb-2 mt-1">Mercado KYC</Badge>
                    <span className="text-muted-foreground text-sm">Valor del mercado KYC reutilizable para 2027</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Market Research Future 2023</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="py-8 sm:py-16">
          <h2 className="text-3xl font-bold mb-4">Roadmap</h2>
          <ol className="list-decimal list-inside text-left space-y-2">
            <li>Jun 2023: Pruebas de INE Digital y login con validadores externos</li>
            <li>Oct 2023: Firma de contratos y chat entre identidades</li>
            <li>Nov 2023: Dashboard para ciudadanos, verificadores y attesters</li>
            <li>Dic 2023: Vinculación de identidades a cuentas EVM e invitación a beta testers</li>
          </ol>
        </section>

        {/* Reconocimientos */}
        <section id="reconocimientos" className="py-8 sm:py-16">
          <h2 className="text-3xl font-bold mb-4">Reconocimientos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted rounded p-6 flex flex-col items-center cursor-help">
                    <div className="flex items-center gap-2 mb-2">
                      <ReactCountryFlag countryCode="US" svg style={{ fontSize: "2em" }} title="Estados Unidos" />
                      <Badge>Web3athon 2022</Badge>
                    </div>
                    <span className="font-bold">Standout</span>
                    <span className="text-muted-foreground text-sm">CRADL y CoinDesk, Sept 2022</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estados Unidos - Web3athon organizado por CRADL y CoinDesk</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted rounded p-6 flex flex-col items-center cursor-help">
                    <div className="flex items-center gap-2 mb-2">
                      <ReactCountryFlag countryCode="UN" svg style={{ fontSize: "2em" }} title="ONU" />
                      <ReactCountryFlag countryCode="SA" svg style={{ fontSize: "2em" }} title="Arabia Saudita" />
                      <Badge>ITU UN | DGA KSA</Badge>
                    </div>
                    <span className="font-bold">Ganadores</span>
                    <span className="text-muted-foreground text-sm">Servicios Públicos Inmersivos, Ene 2023</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Unión Internacional de Telecomunicaciones (ONU) y Agencia de Gobierno Digital de Arabia Saudita</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted rounded p-6 flex flex-col items-center cursor-help">
                    <div className="flex items-center gap-2 mb-2">
                      <ReactCountryFlag countryCode="KR" svg style={{ fontSize: "2em" }} title="Corea del Sur" />
                      <Badge>Polkadot Hackathon APAC</Badge>
                    </div>
                    <span className="font-bold">Ganadores</span>
                    <span className="text-muted-foreground text-sm">Adopción Masiva, Sept 2023</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Corea del Sur - Hackathon de Polkadot para la región Asia-Pacífico</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </section>

        {/* Team */}
        <section id="team" className="py-8 sm:py-16">
          <h2 className="text-3xl font-bold mb-4">Equipo</h2>
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center cursor-help">
                    <Avatar className="w-24 h-24 mb-2 border-2 border-primary">
                      <AvatarImage src="/avatar-edgar.png" alt="Edgar Salinas" />
                      <AvatarFallback>ES</AvatarFallback>
                    </Avatar>
                    <span className="font-bold">Edgar Salinas</span>
                    <span className="text-muted-foreground text-sm">Founder & CEO</span>
                    <a href="https://www.linkedin.com/in/edgardanielsalinasledesma/" target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">LinkedIn</a>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Experto en identidad digital y blockchain</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex-1 text-left">
              <p className="text-lg">Determinados a cambiar cómo operan las identidades digitales y analógicas. <br />Hecho con amor en México.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-8 sm:py-16">
          <h2 className="text-3xl font-bold mb-4">Preguntas frecuentes</h2>
          <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
            <AccordionItem value="q1">
              <AccordionTrigger>¿Qué es una identidad autosoberana?</AccordionTrigger>
              <AccordionContent>
                Es un modelo donde tú controlas tus credenciales y datos personales, sin depender de un proveedor centralizado.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>¿Puedo revocar mis credenciales?</AccordionTrigger>
              <AccordionContent>
                Sí, puedes revocar y gestionar tus credenciales en cualquier momento desde la dApp.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>¿Peranto es solo para México?</AccordionTrigger>
              <AccordionContent>
                Actualmente la prueba de concepto está enfocada en México, pero la tecnología es global y escalable.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Estado de KILT */}
        <div className="bg-card p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Estado de KILT</h2>
          <div className="space-y-2">
            <p><strong>Estado:</strong> {typeof window !== 'undefined' && window.kilt ? '✅ Sí' : '❌ No'}</p>
            {typeof window !== 'undefined' && window.kilt && (
              <>
                <p><strong>Versión credentials:</strong> {window.kilt.meta?.versions?.credentials || 'No configurado'}</p>
                <p><strong>Extensiones detectadas:</strong> {Object.keys(window.kilt).filter(key => key !== 'meta').length}</p>
                <div className="mt-2">
                  <strong>Extensiones:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {Object.keys(window.kilt)
                      .filter(key => key !== 'meta')
                      .map(key => (
                        <li key={key}>{key}</li>
                      ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 mt-auto bg-background/80">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground px-4">
          <span>Peranto 2025 &copy; Hecho con amor en México. <ReactCountryFlag countryCode="MX" svg style={{ fontSize: "1.2em", verticalAlign: "middle", marginLeft: "0.3em" }} title="México" /></span>
          <span>
            <a href="https://peranto.xyz" target="_blank" rel="noopener noreferrer" className="underline">peranto.xyz</a> |
            <a href="mailto:services@peranto.xyz" className="underline ml-2">Contacto</a> |
            <a href="/privacidad" className="underline ml-2">Privacidad</a> |
            <a href="/terminos" className="underline ml-2">Términos</a>
          </span>
        </div>
      </footer>
    </div>
  )
}