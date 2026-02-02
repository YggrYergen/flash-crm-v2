# Informe Exhaustivo: Algoritmo de Calificación y Formato de Leads

Este documento detalla el funcionamiento interno del sistema de calificación de leads y los requisitos técnicos para la importación de datos mediante archivos CSV en Flash CRM.

---

## 1. Algoritmo de Calificación (Composite Score)

El sistema utiliza un algoritmo de puntuación compuesta para evaluar la calidad y el potencial de cada lead. El resultado es un puntaje general (**General Score**) de 0 a 100, calculado ponderando tres áreas clave:

### A. Web Score (40% del total)
Evalúa la presencia digital propia del negocio.
*   **Puntaje Máximo (100):** Se otorga si el negocio **NO** tiene sitio web o si su único "sitio web" es una red social (Instagram, Facebook, TikTok, LinkedIn).
*   **Puntaje Mínimo (0):** Se otorga si el negocio ya posee un dominio web propio.
*   *Lógica:* El sistema prioriza negocios que dependen de terceros, considerándolos mejores candidatos para servicios de desarrollo web.

### B. GBP Score - Google Business Profile (40% del total)
Evalúa las deficiencias en la ficha de Google Maps. Se acumulan puntos por cada "oportunidad de mejora":
*   **No Reclamada (+40 pts):** Si el perfil no ha sido reclamado por el dueño.
*   **No Verificada (+20 pts):** Si la ficha no cuenta con el check de verificación.
*   **Pocas Reseñas (+20 pts):** Si tiene menos de 5 reseñas.
*   **Baja Calificación (+20 pts):** Si el rating es mayor a 0 pero menor a 4.0.
*   *Límite:* Máximo 100 puntos.

### C. Sercotec Score (20% del total)
Evalúa la madurez y formalidad del negocio (orientado a perfiles que podrían calificar para fondos concursables). Se acumulan puntos por "fortalezas":
*   **Perfil Reclamado (+25 pts)**
*   **Perfil Verificado (+25 pts)**
*   **Buena Tracción (+20 pts):** Más de 10 reseñas.
*   **Alta Calificación (+10 pts):** Rating igual o mayor a 4.0.
*   **Datos Completos (+20 pts):** +10 si tiene teléfono válido y +10 si tiene dirección completa detallada.

### Fórmula Final
`Score General = (WebScore * 0.4) + (GBPScore * 0.4) + (SercotecScore * 0.2)`

---

## 2. Algoritmo de Limpieza y Validación

Antes de procesar un lead durante la importación, el sistema aplica filtros estrictos para asegurar la integridad de la base de datos:

1.  **Filtro de Columnas:** Se ignoran líneas que contengan menos de 3 columnas de datos.
2.  **Validación de Teléfono (Crítico):**
    *   Se eliminan todos los caracteres no numéricos (excepto el símbolo `+`).
    *   **Requisito de Formato:** Debe cumplir con el formato móvil chileno: `^(?:\+?56)?9\d{8}$` (ej: +56912345678 o 912345678).
    *   **Acción:** Si el teléfono no es válido, el lead es **omitido automáticamente** y no se ingresa al sistema.
3.  **Detección de Cabeceras:** El sistema detecta automáticamente si la primera línea es un encabezado (buscando palabras como `business_id`, `phone` o `name`) y la salta si es necesario.

---

## 3. Formato Exacto de CSV

El sistema espera un archivo CSV (delimitado por comas) con una estructura específica derivada de herramientas de extracción de Google Maps. A continuación se detallan las columnas requeridas por índice:

| Índice | Campo | Descripción / Uso |
| :--- | :--- | :--- |
| **0** | `business_id` | Identificador único de Google. |
| **1** | `phone` | Teléfono del negocio (Sujeto a validación). |
| **2** | `name` | Nombre comercial del negocio. |
| **3** | `full_address` | Dirección completa. |
| **6** | `review_count` | Cantidad total de reseñas (numérico). |
| **7** | `rating` | Calificación promedio (ej: 4.5). |
| **9** | `website` | URL del sitio web o red social. |
| **11** | `place_link` | Enlace directo a la ubicación en Google Maps. |
| **14** | `is_claimed` | Debe ser literales `"true"` o `"false"`. |
| **15** | `verified` | Debe ser literales `"true"` o `"false"`. |

> [!IMPORTANT]
> Los campos deben estar separados por comas. Si un campo contiene comas (como la dirección), debe estar encerrado entre comillas dobles (ej: `"Calle Falsa 123, Concón"`).

---

## 4. Resumen de Flujo de Datos

1.  **Carga:** El usuario selecciona el archivo CSV.
2.  **Limpieza:** Se validan teléfonos y estructura mínima.
3.  **Calificación:** Se calculan los 4 puntajes (Web, GBP, Sercotec y General).
4.  **Ingreso:** El lead se guarda con estado inicial "Nuevo Lead" (`lead`) y se le asigna un ID interno único generado por el sistema.
5.  **Priorización:** Los leads con mayor `General Score` aparecen destacados en las herramientas de selección automática ("Siguiente Lead AI").
