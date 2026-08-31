import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { DemoLoginButtons } from "@/components/features/auth/DemoLoginButtons";
import { getTenantBySlug } from "@/lib/tenant/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PersonasLoginPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Portal de Personas · {tenant.name}</h1>
          <p className="text-sm text-muted-foreground">
            Creá y seguí tus tickets de soporte, y conversá con el equipo asignado
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="sr-only">Acceso personas</CardTitle>
              <CardDescription className="sr-only">Ingresá o creá tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Ingresar</TabsTrigger>
                  <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-4">
                  <LoginForm tenant={tenant} />
                </TabsContent>
                <TabsContent value="register" className="mt-4">
                  <RegisterForm role="customer" requireTenant tenant={tenant} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm">Cuentas de prueba</CardTitle>
              <CardDescription className="text-xs">
                Ingresos de demostración, sin registro previo
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <DemoLoginButtons mode="customer" tenant={tenant} />
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver a la landing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
