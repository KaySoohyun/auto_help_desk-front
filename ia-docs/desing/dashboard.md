<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      background-color: #121816;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
  </style>
</head>

<body class="p-6 md:p-10 max-w-[1400px] mx-auto min-h-screen">

  <!-- Header -->
  <header class="flex justify-between items-start mb-8">
    <div>
      <h1 class="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
      <p class="text-gray-400 text-sm mt-1">Resumen operativo de tu cola de soporte</p>
    </div>
    <button
      class="bg-[#d97736] hover:bg-[#c06528] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
      Ver bandeja
    </button>
  </header>

  <!-- Metric Cards Grid -->
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <!-- Card 1 -->
    <div class="bg-[#1a2321] border border-[#263330] rounded-xl p-5 flex justify-between items-start">
      <div>
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">TICKETS ABIERTOS</span>
        <div class="text-3xl font-bold text-white mt-4">9</div>
        <span class="text-xs text-gray-400 mt-2 block">10 en total</span>
      </div>
      <div class="bg-[#212d2a] p-2 rounded-lg text-gray-400">
        <i data-lucide="inbox" class="w-5 h-5"></i>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="bg-[#1a2321] border border-[#263330] rounded-xl p-5 flex justify-between items-start">
      <div>
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">ASIGNADOS A MÍ</span>
        <div class="text-3xl font-bold text-white mt-4">4</div>
      </div>
      <div class="bg-[#212d2a] p-2 rounded-lg text-gray-400">
        <i data-lucide="user-check" class="w-5 h-5"></i>
      </div>
    </div>

    <!-- Card 3 -->
    <div class="bg-[#1a2321] border border-[#263330] rounded-xl p-5 flex justify-between items-start">
      <div>
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">SIN ASIGNAR</span>
        <div class="text-3xl font-bold text-white mt-4">5</div>
      </div>
      <div class="bg-[#212d2a] p-2 rounded-lg text-gray-400">
        <i data-lucide="user-x" class="w-5 h-5"></i>
      </div>
    </div>

    <!-- Card 4 -->
    <div class="bg-[#1a2321] border border-[#263330] rounded-xl p-5 flex justify-between items-start">
      <div>
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">SLA EN RIESGO</span>
        <div class="text-3xl font-bold text-white mt-4">5</div>
      </div>
      <div class="bg-[#212d2a] p-2 rounded-lg text-gray-400">
        <i data-lucide="alert-triangle" class="w-5 h-5"></i>
      </div>
    </div>
  </section>

  <!-- Main Content Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Left Column: Actividad reciente -->
    <div class="lg:col-span-2 space-y-4">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          <i data-lucide="activity" class="w-4 h-4 text-gray-400"></i>
          <h2 class="font-semibold text-white">Actividad reciente</h2>
        </div>
        <a href="#" class="text-xs text-gray-400 hover:text-white transition-colors">Ver todo</a>
      </div>

      <!-- Tickets List -->
      <div class="space-y-1">
        <!-- Ticket 1 -->
        <div
          class="bg-[#161d1b] hover:bg-[#1a2321] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-transparent hover:border-[#263330] transition-all">
          <div>
            <h3 class="font-semibold text-sm text-white">Integración con Slack no sincroniza</h3>
            <p class="text-xs text-gray-400 mt-1">Elena Torres · Técnico</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">Alta</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">Abierto</span>
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">Vencido</span>
          </div>
        </div>

        <!-- Ticket 2 -->
        <div
          class="bg-[#161d1b] hover:bg-[#1a2321] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-transparent hover:border-[#263330] transition-all">
          <div>
            <h3 class="font-semibold text-sm text-white">Error 500 al generar reporte de ventas</h3>
            <p class="text-xs text-gray-400 mt-1">Diego Ruiz · Técnico</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">Alta</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">Abierto</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">En tiempo</span>
          </div>
        </div>

        <!-- Ticket 3 -->
        <div
          class="bg-[#161d1b] hover:bg-[#1a2321] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-transparent hover:border-[#263330] transition-all">
          <div>
            <h3 class="font-semibold text-sm text-white">Posible intento de prompt injection</h3>
            <p class="text-xs text-gray-400 mt-1">Anónimo · General</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">Urgente</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">Nuevo</span>
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">En riesgo</span>
          </div>
        </div>

        <!-- Ticket 4 -->
        <div
          class="bg-[#161d1b] hover:bg-[#1a2321] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-transparent hover:border-[#263330] transition-all">
          <div>
            <h3 class="font-semibold text-sm text-white">Consulta sobre tiempos de envío</h3>
            <p class="text-xs text-gray-400 mt-1">María Gómez · Envíos</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2.5 py-1 rounded-md border border-gray-600 text-gray-400">Baja</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">En espera</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">En tiempo</span>
          </div>
        </div>

        <!-- Ticket 5 -->
        <div
          class="bg-[#161d1b] hover:bg-[#1a2321] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-transparent hover:border-[#263330] transition-all">
          <div>
            <h3 class="font-semibold text-sm text-white">No puedo acceder a mi cuenta tras actualizar la app</h3>
            <p class="text-xs text-gray-400 mt-1">Lucía Fernández · Cuenta</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">Alta</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">Nuevo</span>
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">En riesgo</span>
          </div>
        </div>

        <!-- Ticket 6 -->
        <div
          class="bg-[#161d1b] hover:bg-[#1a2321] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-transparent hover:border-[#263330] transition-all">
          <div>
            <h3 class="font-semibold text-sm text-white">Producto llegó dañado</h3>
            <p class="text-xs text-gray-400 mt-1">Sofía Lima · Producto</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">Alta</span>
            <span class="text-xs px-2.5 py-1 rounded-md bg-[#212d2a] text-gray-300">Abierto</span>
            <span class="text-xs px-2.5 py-1 rounded-md border border-[#d97736] text-[#d97736]">En riesgo</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Alertas del LLM & Volumen -->
    <div class="space-y-6">

      <!-- Section: Alertas del LLM -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <i data-lucide="sparkles" class="w-4 h-4 text-gray-400"></i>
          <h2 class="font-semibold text-white">Alertas del LLM</h2>
        </div>

        <div class="space-y-3">
          <!-- Alert 1 -->
          <div class="bg-[#161d1b] border border-[#d97736]/60 rounded-xl p-4">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#d97736]"></span>
              <h4 class="text-xs font-semibold text-[#d97736]">PII detectada</h4>
            </div>
            <p class="text-xs text-gray-400 mt-1 pl-3.5">2 tickets con posible información personal</p>
          </div>

          <!-- Alert 2 -->
          <div class="bg-[#161d1b] border border-[#263330] rounded-xl p-4">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              <h4 class="text-xs font-semibold text-gray-200">Promt injection</h4>
            </div>
            <p class="text-xs text-gray-400 mt-1 pl-3.5">2 tickets marcados para revisión humana</p>
          </div>

          <!-- Alert 3 -->
          <div class="bg-[#161d1b] border border-[#263330] rounded-xl p-4">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              <h4 class="text-xs font-semibold text-gray-200">Confianza baja</h4>
            </div>
            <p class="text-xs text-gray-400 mt-1 pl-3.5">3 clasificaciones sugeridas con confianza &lt; 60%</p>
          </div>

          <!-- Alert 4 -->
          <div class="bg-[#161d1b] border border-[#d97736]/60 rounded-xl p-4">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#d97736]"></span>
              <h4 class="text-xs font-semibold text-[#d97736]">Sugerencias aceptadas</h4>
            </div>
            <p class="text-xs text-gray-400 mt-1 pl-3.5">86% de respuestas sugeridas aprobadas hoy</p>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Lucide Icons Initialization -->
  <script>
    lucide.createIcons();
  </script>
</body>

</html>