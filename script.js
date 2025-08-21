/*
  Este archivo contiene la lógica principal de la aplicación.
  Se encarga de:
  - Obtener los datos del Boletín Oficial desde una fuente remota (JSON).
  - Renderizar la información en las diferentes secciones de la página.
  - Manejar los eventos de usuario, como el filtrado de normas.
*/

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    // URL del archivo JSON con los datos del Boletín Oficial
    const DATA_URL = 'https://gist.githubusercontent.com/Aoneken/dec64d17e138aca63e0df545cd8a7d60/raw/bora_data.json';

    // --- SELECTORES ---
    // Se obtienen las referencias a los elementos del DOM que se van a manipular
    const headerLogoContainer = document.querySelector('.header-logo');
    const headerDate = document.getElementById('header-date');
    const sintesisTexto = document.getElementById('sintesis-texto');
    const statsPanel = document.getElementById('stats-panel');
    const filtrosSection = document.getElementById('filtros-section');
    const normasBody = document.getElementById('normas-body');
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    // --- RENDERIZADO ---
    // Estas funciones se encargan de generar el HTML y mostrar los datos en la página.

    /**
     * Renderiza el logo en la cabecera.
     * @param {object} datos - Objeto con los datos de la aplicación, incluyendo `datosInstitucionales`.
     */
    function renderHeader(datos) {
        if (!headerLogoContainer) return;
        const { logoURL } = datos.datosInstitucionales;
        headerLogoContainer.innerHTML = logoURL ? `<img src="${logoURL}" alt="Logo Orbita" class="logo-img">` : '';
    }
    
    /**
     * Renderiza la fecha en la cabecera.
     * @param {object} datos - Objeto con los datos de la aplicación, incluyendo `fecha`.
     */
    function renderHeaderDate(datos) {
        if (headerDate) {
            const fechaOriginal = datos.fecha || new Date().toISOString().split('T')[0];
            const [year, month, day] = fechaOriginal.split('-');
            const readableDate = new Date(year, month - 1, day).toLocaleDateString('es-AR', {
                day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
            }).replace(' de ', ' ');
            headerDate.textContent = readableDate;
        }
    }

    /**
     * Renderiza la síntesis del día.
     * @param {object} datos - Objeto con los datos de la aplicación, incluyendo `sintesisDelDia`.
     */
    function renderIntro(datos) {
        if (sintesisTexto) {
            sintesisTexto.textContent = datos.sintesisDelDia;
        }
    }

    /**
     * Renderiza el panel de estadísticas.
     * @param {object} datos - Objeto con los datos de la aplicación, incluyendo `estadisticas`.
     */
    function renderStatsPanel(datos) {
        if (!statsPanel || !datos.estadisticas) return;
        const { totalNormas, desgloseTipos } = datos.estadisticas;
        const TIPO_ORDEN = ["DECRETO", "DECRETOS (SUPLEMENTO)", "DECISION ADMINISTRATIVA", "RESOLUCION", "DISPOSICION", "CONVENCIONES COLECTIVAS DE TRABAJO", "LAUDO", "AVISOS OFICIALES", "CONCURSO", "CONCURSOS OFICIALES", "AVISOS OFICIALES - ANTERIOR"];
        const tiposOrdenados = Object.entries(desgloseTipos).sort(([tipoA], [tipoB]) => {
            const indexA = TIPO_ORDEN.indexOf(tipoA.toUpperCase());
            const indexB = TIPO_ORDEN.indexOf(tipoB.toUpperCase());
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        const maxCount = Math.max(...Object.values(desgloseTipos));
        if (maxCount === 0) return;
        const rowsHtml = tiposOrdenados.map(([tipo, count]) => {
            const widthPercent = (count / maxCount) * 100;
            let tipoFormateado = tipo.toLowerCase().replace(/_/g, ' ');
            tipoFormateado = tipoFormateado.charAt(0).toUpperCase() + tipoFormateado.slice(1);
            return `<div class="stat-row"><div class="stat-row-label">${tipoFormateado} <span>(${count})</span></div><div class="stat-row-value-bar"><div class="bar-container"><div class="bar" style="width: ${widthPercent}%;"></div></div></div></div>`;
        }).join('');
        statsPanel.innerHTML = `<div class="stats-header"><span class="stats-total-label">Total Normas</span><span class="stats-total-value">${totalNormas}</span></div><div class="stats-body">${rowsHtml}</div>`;
    }

    /**
     * Renderiza los botones de filtro.
     * @param {object} datos - Objeto con los datos de la aplicación, incluyendo `estadisticas`.
     */
    function renderFiltros(datos) {
        if (!filtrosSection) return;
        const { desgloseEtiquetas } = datos.estadisticas;
        const etiquetasOrdenadas = Object.keys(desgloseEtiquetas).sort((a, b) => desgloseEtiquetas[b] - desgloseEtiquetas[a]);
        const botones = etiquetasOrdenadas.map(etiqueta => {
            const filtro = normalizarParaFiltro(etiqueta);
            const cantidad = desgloseEtiquetas[etiqueta];
            return `<button class="etiqueta-btn" data-filtro="${filtro}">${etiqueta} <span class="etiqueta-count">${cantidad}</span></button>`;
        }).join('');
        filtrosSection.innerHTML = `<div class="filtros-header"><h2><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filtros</h2><button class="etiqueta-btn" data-filtro="all">Limpiar</button></div><div class="etiquetas-container">${botones}</div>`;
    }

    /**
     * Renderiza la lista de normas.
     * @param {object} datos - Objeto con los datos de la aplicación, incluyendo `normas`.
     */
    function renderNormas(datos) {
        if (!normasBody) return;
        if (!datos.normas || datos.normas.length === 0) {
            normasBody.innerHTML = '<p class="loading-message">No hay normas para mostrar.</p>';
            return;
        }
        const normasHtml = datos.normas.map(norma => {
            const { titulo, emisor, descripcion, resumen, url_bo, etiquetas } = norma;
            const linkHtml = url_bo ? `<a href="${url_bo}" target="_blank" title="Ver en Boletín Oficial" class="norma-action-btn norma-bo-btn">Ver BO</a>` : '';
            
            const etiquetasHtml = (etiquetas || [])
                                    .map(etiqueta => {
                                        const cleanTag = normalizarParaFiltro(etiqueta);
                                        return `#${cleanTag}`;
                                    })
                                    .join(' ');
            
            const dataFiltros = (etiquetas || []).map(normalizarParaFiltro).join(' ');
            
            return `<article class="norma-card glass-card" data-etiquetas="${dataFiltros}"><div class="norma-header"><div class="norma-title-group"><h4 class="norma-titulo">${titulo || ''}</h4><p class="norma-emisor">${emisor || ''}</p></div><div class="norma-actions">${linkHtml}</div></div><p class="norma-descripcion">${descripcion || ''}</p><div class="norma-resumen">${resumen || ''}</div><div class="norma-etiquetas-container">${etiquetasHtml}</div></article>`;
        }).join('');
        normasBody.innerHTML = normasHtml;
    }

    /**
     * Función principal que se ejecuta al cargar la página.
     */
    async function main() {
        try {
            // Se obtienen los datos del JSON
            const response = await fetch(DATA_URL);
            if (!response.ok) throw new Error(`Error al cargar los datos: ${response.statusText}`);
            const data = await response.json();
            if (!data.fecha) { data.fecha = new Date().toISOString().split('T')[0]; }

            // Se renderizan todas las secciones de la página
            renderHeader(data); 
            renderHeaderDate(data); 
            renderIntro(data); 
            renderStatsPanel(data); 
            renderFiltros(data); 
            renderNormas(data);

            // Se configuran los event listeners
            setupEventListeners();
        } catch (error) {
            console.error("Error en la función main:", error);
            if (normasBody) { normasBody.innerHTML = `<p class="loading-message">No se pudieron cargar las normativas.</p>`; }
        }
    }

    // --- LÓGICA DE EVENTOS ---

    /**
     * Configura los event listeners para los filtros y el botón de scroll.
     */
    function setupEventListeners() {
        if(filtrosSection) filtrosSection.addEventListener('click', handleFilterClick);
        if(scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * Maneja el evento de click en los botones de filtro.
     * @param {Event} e - Evento de click.
     */
    function handleFilterClick(e) {
        const target = e.target.closest('.etiqueta-btn');
        if (!target) return;

        const filtro = target.dataset.filtro;
        
        // Se actualiza la clase 'active' en los botones de filtro
        document.querySelectorAll('#filtros-section .etiqueta-btn').forEach(btn => btn.classList.remove('active'));
        if (filtro !== 'all') {
            target.classList.add('active');
        }

        // Se filtran las normas según la etiqueta seleccionada
        document.querySelectorAll('.norma-card').forEach(card => {
            const etiquetasDeLaTarjeta = (card.dataset.etiquetas || '').split(' ').filter(tag => tag);

            if (filtro === 'all' || etiquetasDeLaTarjeta.includes(filtro)) {
                card.style.display = ''; // Se muestra la tarjeta
            } else {
                card.style.display = 'none'; // Se oculta la tarjeta
            }
        });

        // Scroll a la línea divisoria, ajustando por el header fijo
        const separator = document.querySelector('.separator');
        if (separator) {
            const header = document.getElementById('page-header');
            const headerHeight = header ? header.offsetHeight : 0;
            
            // Usamos getBoundingClientRect() para una posición más precisa.
            const separatorTop = separator.getBoundingClientRect().top + window.scrollY;
            
            // Se calcula la posición final: top del separador - altura del header - un margen.
            const margin = 16; // 1rem de espacio para que no quede pegado al header.
            const scrollToPosition = separatorTop - headerHeight - margin; 

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Muestra u oculta el botón de scroll según la posición del scroll.
     */
    function handleScroll() { 
        if (!filtrosSection || !scrollToTopBtn) return;

        // Se calcula la posición inferior de la sección de filtros.
        const sectionOffset = filtrosSection.offsetTop + filtrosSection.offsetHeight; 

        // Se muestra el botón si el scroll supera esa posición.
        const shouldBeVisible = window.scrollY > sectionOffset;
        scrollToTopBtn.classList.toggle('visible', shouldBeVisible);
    }
    
    /**
     * Normaliza un texto para usarlo como filtro (elimina acentos, convierte a minúsculas, etc.).
     * @param {string} texto - Texto a normalizar.
     * @returns {string} - Texto normalizado.
     */
    function normalizarParaFiltro(texto) {
        return texto.normalize('NFD')
                     .replace(/[\u0300-\u036f]/g, "")
                     .toLowerCase()
                     .replace(/^#+/g, '')
                     .replace(/[\s-]+/g, '-')
                     .replace(/[^a-z0-9-]/g, '')
                     .trim();
    }

    // Se llama a la función principal para iniciar la aplicación
    main();
});
