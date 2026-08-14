import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { RegisterForm } from "@/components/features/auth/RegisterForm";

export default function EmpresasLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Portal Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná los tickets de una o varias de tus empresas cliente
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="sr-only">Acceso empresas</CardTitle>
            <CardDescription className="sr-only">Ingresá o creá tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Ingresar</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="mt-4">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
