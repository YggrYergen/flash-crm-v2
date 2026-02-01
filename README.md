# ⚡ Flash CRM v2.2 - Sistema de Gestión de Leads de Alto Rendimiento

Flash CRM es una herramienta de gestión de relaciones con clientes (CRM) ultra-rápida, diseñada para procesos de prospección intensiva y ventas técnicas (Diseño Web, Optimización de perfiles de Google y consultoría Sercotec). El sistema destaca por su enfoque **Mobile-First** y su estrategia de datos híbrida que permite trabajar tanto de forma local como sincronizada en la nube.

---

## 🚀 Características Principales

### 1. Gestión Inteligente de Leads
- **Scoring Engine Propio:** Cálculo automático de puntajes de oportunidad ("Fitness Score") basado en la presencia digital actual del cliente (Sitio web, Google Business Profile, etc.).
- **Ciclo de Vida Completo:** Estados personalizables desde 'Lead Nuevo' hasta 'Venta Cerrada'.
- **Notas Rápidas:** Sistema de anotaciones ágil para registrar interacciones sin fricción.
- **[NUEVO] Búsqueda Avanzada:** Motor de búsqueda potenciado capaz de encontrar leads por teléfono, contenido de notas, eventos y detalles de contacto, con insignias de coincidencia.

### 2. Estrategia de Datos Híbrida
- **Modo Local:** Almacenamiento rápido en `localStorage` para uso privado o sin conexión.
- **Modo Cloud (Firebase):** Sincronización en tiempo real mediante Firestore para colaboración multi-dispositivo.
- **Migración Un-Click:** Función para subir datos locales a la nube de manera instantánea.

### 3. Herramientas de Productividad
- **Importador CSV Masivo:** Mapeo automático de campos desde exportaciones (ej. Google Maps Scrapers), limpieza de números telefónicos y detección de duplicados.
- **Siguiente Lead (IA):** Algoritmo de recomendación que encuentra automáticamente el prospecto con mayor probabilidad de cierre según el scoring técnico.
- **[MEJORADO] Calendario Integrado:** Visualización mejorada de eventos con vista diaria/semanal optimizada para superposiciones, y nueva vista de detalle de eventos (solo lectura) antes de edición.
- **[NUEVO] Bitácora de Actividad:** Registro local detallado de todas las acciones (Llamadas, Cambios de Estado, Creación de Leads), con vistas "Diario" e "Histórico".

### 4. Dashboards de Análisis
- **Tracking en Tiempo Real:** Visualización de métricas de embudo de ventas, leads calificados y estado de pagos.
- **[MEJORADO] Gamificación:** Contador de llamadas optimizado para registrar intentos reales (1 por lead/día).
- **Filtros Avanzados:** Segmentación por estado de pago, interés técnico (Web/GBP/Sercotec) y búsqueda instantánea.

---

## 🆕 Novedades Versión 2.2 (Última Actualización)

### UI/UX Refinada
- **Navegación Unificada:** Nuevo menú desplegable (Pop-up) en la esquina superior derecha que agrupa todas las vistas (Objetivos, Dashboard, Calendario, Bitácora, Configuración), liberando espacio en la interfaz.
- **Mejoras de Capas (Z-Index):** Corrección de problemas de solapamiento en modales y menús sticky para una experiencia más pulida.

### Bitácora (Activity Log)
- Nueva sección accesible desde el menú principal.
- Permite auditar el trabajo realizado en el día o revisar el historial completo.
- Almacenamiento **100% Local** para privacidad.

### Búsqueda Inteligente (Deep Search)
- La barra de búsqueda ahora indexa:
  - Números de teléfono (incluso si se escriben sin formato)
  - Contenido de notas históricas
  - Títulos y notas de eventos agendados
  - Correos electrónicos y direcciones

---

## 🛠️ Stack Tecnológico

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Mobile:** [Capacitor 7](https://capacitorjs.com/) (Soporte nativo para Android)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Backend/DB:** [Firebase Firestore](https://firebase.google.com/products/firestore) y Analytics
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Gestión de Estado:** Context API con persistencia selectiva.

---

## 📂 Estructura del Proyecto

```text
flash-crm/
├── android/            # Archivos fuente del proyecto nativo Android (Capacitor)
├── src/
│   ├── components/     # UI dividida por módulos (lead, calendar, tracking, settings, bitacora)
│   ├── context/        # LeadsContext - Corazón de la lógica de datos híbrida
│   ├── services/       # Capas de abstracción para Data Local, Cloud y Logs
│   ├── utils/          # Helpers, fórmulas de scoring y utilarios de CSV
│   ├── firebase.js     # Configuración y conexión con Google Cloud
│   └── App.jsx         # Orquestador principal de navegación y vistas
├── public/             # Activos estáticos
└── capacitor.config.json # Configuración de app móvil
```

---

## ⚙️ Configuración y Desarrollo

### Requisitos Previos
- Node.js (v18+)
- Firebase Project (para Modo Cloud)
- Android Studio (para compilación móvil)

### Instalación
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

### Despliegue en Android
```bash
# Sincronizar assets con el proyecto nativo
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

---

## 📈 Lógica de Scoring (Motor de Oportunidades)

El sistema analiza los leads importados bajo tres pilares fundamentales:
1. **Web Score (40%):** Premia leads sin sitio web o con solo redes sociales (Alta oportunidad de diseño web).
2. **GBP Score (40%):** Identifica perfiles de Google Business no reclamados o con bajas reseñas.
3. **Sercotec Score (20%):** Evalúa solidez para postular a fondos de digitalización estatales.

---

## 🛡️ Mejores Prácticas Implementadas

- **Separación de Concernimientos:** Capas de servicios separadas de la interfaz de usuario.
- **Responsividad Crítica:** Interfaz optimizada para el uso en terreno (móvil) con botones de acción rápida y gestos simples.
- **Performance:** Uso intenso de `useMemo` y `useCallback` para garantizar 60fps incluso con miles de registros locales.
- **UX Limpia:** Feedback visual constante mediante notificaciones tipo Toast y diálogos de confirmación modales.

---
*Desarrollado para prospección de alta velocidad. v2.2*
