# Especificación Técnica General: Proyectos Web Dinámicos

**Versión:** 1.2
**Fecha:** 23 de Agosto, 2025
**Autor:** Exequiel Santamaría
**Editor:** Gemini

---

### 1. Introducción y Objetivos

#### 1.1. Propósito
Esta Especificación Técnica (ET) establece la arquitectura, los estándares y las mejores prácticas para el desarrollo de proyectos web informativos cuyo contenido se actualiza periódicamente. El objetivo es crear una base de código desacoplada, escalable y de fácil mantenimiento.

#### 1.2. Filosofía de Diseño
La arquitectura se basa en el principio de **separación de contenido, presentación y lógica**. El contenido reside en un formato de datos estructurado (JSON), la presentación es manejada por HTML y CSS, y la lógica de la aplicación es controlada por JavaScript. Este enfoque permite que el contenido sea actualizado por procesos automáticos sin necesidad de modificar el código de la aplicación.

#### 1.3. Alcance
Esta especificación aplica a sitios web "estáticos en el servidor, dinámicos en el cliente". Es ideal para dashboards, reportes diarios, blogs simples o cualquier página donde el contenido cambia, pero la estructura permanece constante.

---

### 2. Arquitectura General

El sistema funciona como una **Aplicación de Página Única (SPA)** simple, renderizada del lado del cliente.

1.  **Petición Inicial:** El usuario solicita la URL (`orbita.aoneken.com/bora`). El servidor responde con el archivo `index.html` y sus activos asociados (CSS, JS).
2.  **Carga de Datos:** Una vez que la página carga, el archivo `assets/js/main.js` realiza una petición `fetch` asíncrona para obtener el archivo `data/daily_data.json`.
3.  **Renderizado Dinámico:** JavaScript procesa el JSON y construye dinámicamente los elementos HTML correspondientes (tarjetas de resúmenes, KPIs, gráficos, etc.), inyectándolos en los contenedores vacíos del `index.html`.
4.  **Interacción del Usuario:** El usuario interactúa con una página que se siente rápida y fluida, ya que todas las vistas y datos principales ya han sido cargados.

---

### 3. Estructura de Archivos

El repositorio del proyecto debe seguir estrictamente la siguiente estructura para garantizar la consistencia, predictibilidad y fácil acceso a la documentación.


/
│
├── 📁 assets/               # Recursos estáticos de la aplicación
│   │
│   ├── 📁 css/               # Hojas de estilo
│   │   └── style.css         # Estilos globales y de componentes
│   │
│   ├── 📁 js/                # Scripts de la aplicación
│   │   └── main.js           # Lógica principal (carga de datos, renderizado, eventos)
│   │
│   └── 📁 images/             # Imágenes, iconos, logos
│       └── ...
│
├── 📁 data/                  # Contenido dinámico del sitio
│   └── 📄 daily_data.json    # Fuente Única de Verdad (Single Source of Truth)
│
├── 📁 docs/                  # Documentación del proyecto
│   └── 📄 SPEC_TECNICA.md    # Esta Especificación Técnica
│
├── 📄 index.html             # Esqueleto de la aplicación (HTML semántico)
│
└── 📄 README.md               # Puerta de entrada al proyecto y guía rápida


---

### 4. Especificaciones de Componentes

#### 4.1. `data/daily_data.json` (La Fuente de Verdad)
* **Rol:** Contiene el 100% del contenido del sitio. Debe ser la única fuente de datos.
* **Estructura:** Debe adherirse a un **esquema (schema)** predefinido y consistente. Cualquier cambio en la estructura del JSON debe ser reflejado en las funciones de renderizado de `main.js`.
* **Contenido:**
    * Puede contener texto plano, números, booleanos y arrays.
    * Para contenido complejo (como el cuerpo de un artículo), se recomienda incluirlo como una cadena de texto con **HTML válido y sanitizado**.
    * Las rutas a las imágenes deben ser relativas a la raíz del proyecto (ej: `assets/images/mi-imagen.jpg`).

#### 4.2. `index.html` (El Esqueleto)
* **Rol:** Proveer la estructura semántica base de la página y los contenedores vacíos que serán poblados por JavaScript.
* **Reglas:**
    * **No debe contener texto o datos "hardcodeados"** que se esperen del JSON. El contenido debe ser exclusivamente estructural o estático (ej: el título en el `<header>`, el texto del `<footer>`).
    * Cada contenedor que vaya a ser llenado dinámicamente debe tener un `id` único y descriptivo (ej: `id="summaries-grid-container"`, `id="kpi-container"`).
    * Debe cargar las librerías CSS en el `<head>` y los scripts JS justo antes del cierre de la etiqueta `</body>`.

#### 4.3. `assets/css/style.css` (La Presentación)
* **Rol:** Definir todos los aspectos visuales de la aplicación.
* **Metodología:** Se recomienda el uso de un framework *utility-first* como **Tailwind CSS** (cargado vía CDN) para el prototipado rápido y la consistencia. Los estilos personalizados y las sobreescrituras deben residir en `style.css`.
* **Prácticas:**
    * Utilizar variables CSS (`:root`) para colores, fuentes y espaciados para facilitar cambios de tema globales.
    * Adoptar un enfoque **Mobile-First**. Los estilos base deben ser para pantallas pequeñas, y usar media queries (`@media (min-width: ...px)`) para adaptar a pantallas más grandes.

#### 4.4. `assets/js/main.js` (La Lógica)
* **Rol:** Orquestar toda la aplicación.
* **Responsabilidades:**
    1.  **Inicialización:** Esperar al evento `DOMContentLoaded` para comenzar la ejecución.
    2.  **Carga de Datos:** Realizar el `fetch` del `daily_data.json` usando `async/await` para un código más limpio.
    3.  **Manejo de Errores:** Implementar bloques `try...catch` robustos. Si el JSON falla en cargar, se debe mostrar un mensaje de error claro al usuario en la UI.
    4.  **Renderizado:** Crear funciones puras y específicas para cada sección (ej: `renderSummaries(data)`, `renderCharts(data)`). Estas funciones deben tomar datos como entrada y devolver HTML o manipular el DOM, sin tener lógica de negocio mezclada.
    5.  **Manejo de Eventos:** Centralizar todos los `addEventListener` en una función de configuración (`setupEventListeners`) para mantener el código organizado.
    6.  **Navegación:** Gestionar la visibilidad de las diferentes "páginas" o vistas (`div.page`) cambiando clases CSS.

#### 4.5. Documentación (`README.md` y `docs/`)
* **`README.md`:** Actúa como la guía de inicio rápido. Debe contener:
    * Una descripción breve del proyecto.
    * Instrucciones básicas de instalación y ejecución.
    * Un enlace prominente a la especificación técnica completa en `docs/SPEC_TECNICA.md`.
* **`docs/SPEC_TECNICA.md`:** Es este documento. Sirve como la fuente de verdad para la arquitectura y los estándares del proyecto. Debe ser consultado antes de realizar cambios significativos y actualizado si la arquitectura evoluciona.

---

### 5. Proceso de Actualización de Contenido

El único paso requerido para actualizar el sitio es **reemplazar el archivo `data/daily_data.json`** en el servidor. El proceso automático encargado de esto debe garantizar:
1.  Que el nuevo archivo JSON sea **válido y bien formado**.
2.  Que el archivo **mantenga el esquema de datos esperado** por la aplicación.
3.  Que el reemplazo del archivo sea una **operación atómica** para evitar que los usuarios carguen un archivo corrupto o a medio escribir.

---

### 6. Flujo de Trabajo y Control de Versiones (Git)

#### 6.1. Principio General
Todo cambio en el código base, sin importar su tamaño, debe ser registrado en el historial de versiones de Git. Esto asegura la trazabilidad, facilita la colaboración y permite la reversión de cambios en caso de errores.

#### 6.2. Flujo de Trabajo Obligatorio
Al finalizar la implementación de cualquier tarea, instrucción o corrección, es **mandatorio** ejecutar la siguiente secuencia de comandos en la terminal:

1.  **Añadir cambios al Staging Area:**
    ```bash
    git add .
    ```
    Este comando prepara todos los archivos modificados y nuevos para ser incluidos en el próximo "commit".

2.  **Confirmar los cambios (Commit):**
    ```bash
    git commit -m "Descripción clara y concisa de la tarea implementada"
    ```
    * El mensaje del commit es crucial. Debe ser descriptivo y resumir el propósito del cambio (ej: `"feat: Agrega sección de estadísticas"`, `"fix: Corrige error de renderizado en móvil"`, `"refactor: Optimiza la carga de imágenes"`).
    * Cada commit debe representar una unidad de trabajo lógica y completa (un "commit atómico").

3.  **Subir los cambios al Repositorio Remoto:**
    ```bash
    git push
    ```
    Este comando sincroniza tu historial local con el repositorio central, haciendo tus cambios visibles para el resto del equipo y para los procesos de despliegue.

#### 6.3. Justificación
Este flujo de trabajo garantiza que el historial del proyecto sea un registro limpio y legible de su evolución, lo cual es invaluable para el mantenimiento a largo plazo.