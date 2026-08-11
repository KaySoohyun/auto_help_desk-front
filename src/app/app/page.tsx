import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppHomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen operativo de tu cola de soporte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu espacio de trabajo</CardTitle>
          <CardDescription>
            Las métricas del dashboard (tickets abiertos, asignados, SLA en riesgo) llegan en la
            Etapa 1.3. La bandeja de tickets llega en la Etapa 1.2.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
