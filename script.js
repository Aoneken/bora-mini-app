/**
 * @file script.js
 * @description Lógica principal para la mini-aplicación del Boletín Oficial.
 * Este script se encarga de obtener, renderizar y filtrar la información de las normativas,
 * así como de manejar todas las interacciones del usuario.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ------------------- //
    // --- CONFIGURACIÓN --- //
    // ------------------- //

    /** URL del archivo JSON con los datos del Boletín Oficial. */
    const DATA_URL = 'https://gist.githubusercontent.com/Aoneken/dec64d17e138aca63e0df545cd8a7d60/raw/bora_data.json';

    // ---------------- //
    // --- SELECTORES --- //
    // ---------------- //

    /** Referencias a los elementos del DOM para evitar consultas repetitivas. */
    const headerLogoContainer = document.querySelector('.header-logo');
    const headerDate = document.getElementById('header-date');
    const sintesisTexto = document.getElementById('sintesis-texto');
    const statsPanel = document.getElementById('stats-panel');
    const filtrosSection = document.getElementById('filtros-section');
    const normasBody = document.getElementById('normas-body');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const clearFilterFab = document.getElementById('clear-filter-fab');
    const activeFilterIndicator = document.getElementById('active-filter-indicator');

    // ------------------- //
    // --- RENDERIZADO --- //
    // ------------------- //

    /**
     * Renderiza el logo en la cabecera, envolviéndolo en un enlace a Telegram.
     * @param {object} datos - Objeto con los datos de la aplicación.
     */
    function renderHeader(datos) {
        if (!headerLogoContainer) return;
        const { logoURL } = datos.datosInstitucionales;
        headerLogoContainer.innerHTML = logoURL ? `<a href="https://t.me/orbita_ar" target="_blank" rel="noopener noreferrer"><img src="${logoURL}" alt="Logo Orbita" class="logo-img"></a>` : '';
    }
    
    /**
     * Renderiza la fecha en la cabecera.
     * Si no se provee una fecha, utiliza la fecha actual de Buenos Aires como fallback.
     * @param {object} datos - Objeto con los datos de la aplicación.
     */
    function renderHeaderDate(datos) {
        if (headerDate) {
            let fechaOriginal = datos.fecha;
            if (!fechaOriginal) {
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-CA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'America/Argentina/Buenos_Aires'
                });
                fechaOriginal = formatter.format(now);
            }

            const [year, month, day] = fechaOriginal.split('-');
            const readableDate = new Date(year, month - 1, day).toLocaleDateString('es-AR', {
                day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
            }).replace(' de ', ' ');
            headerDate.textContent = readableDate;
        }
    }

    /**
     * Renderiza la síntesis del día en la tarjeta de introducción.
     * @param {object} datos - Objeto con los datos de la aplicación.
     */
    function renderIntro(datos) {
        if (sintesisTexto) {
            sintesisTexto.textContent = datos.sintesisDelDia;
        }
    }

    /**
     * Renderiza el panel de estadísticas con un gráfico de barras.
     * @param {object} datos - Objeto con los datos de la aplicación.
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
     * Renderiza los filtros, agrupados por categorías.
     * @param {object} datos - Objeto con los datos de la aplicación.
     */
    function renderFiltros(datos) {
        if (!filtrosSection) return;
        const { desgloseEtiquetas } = datos.estadisticas;

        const categoriasDeFiltros = [
            { nombre: "Social", etiquetas: ["#Salud", "#Educacion", "#Empleo", "#SeguridadSocial", "#DesarrolloSocial", "#ViviendaHabitat", "#Cultura"] },
            { nombre: "Conocimiento", etiquetas: ["#CienciaYTecnica", "#Comunicaciones"] },
            { nombre: "Estado y Justicia", etiquetas: ["#JusticiaDDHH", "#Seguridad", "#Defensa", "#RelacionesExteriores"] },
            { nombre: "Infraestructura", etiquetas: ["#ObrasPublicas", "#TransporteAereo", "#TransporteTerrestre", "#TransporteMaritimo", "#Ambiente"] },
            { nombre: "Energía", etiquetas: ["#Hidrocarburos", "#Electricidad", "#EnergiaNuclear", "#EnergiasRenovables", "#Biocombustibles", "#Litio"] },
            { nombre: "Producción", etiquetas: ["#Industria", "#PyMEs", "#Agroindustria", "#Mineria", "#Turismo"] },
            { nombre: "Comercio", etiquetas: ["#ComercioInterior", "#ComercioExterior"] },
            { nombre: "Hacienda", etiquetas: ["#Impuestos", "#Presupuesto", "#DeudaPublica"] },
            { nombre: "Sector Público", etiquetas: ["#Designaciones", "#Renuncias", "#Ascensos", "#BienesDelEstado"] }
        ];

        let filtrosHtml = '';
        categoriasDeFiltros.forEach(categoria => {
            const etiquetasDeCategoria = categoria.etiquetas.map(etiquetaConHashtag => {
                const etiqueta = etiquetaConHashtag.replace('#', '');
                if (desgloseEtiquetas[etiqueta]) {
                    const filtro = normalizarParaFiltro(etiqueta);
                    const cantidad = desgloseEtiquetas[etiqueta];
                    const etiquetaFormateada = etiqueta.replace(/([A-Z])/g, ' $1').trim();
                    return `<button class="etiqueta-btn" data-filtro="${filtro}">${etiquetaFormateada} <span class="etiqueta-count">${cantidad}</span></button>`;
                }
                return '';
            }).join('');

            if (etiquetasDeCategoria) {
                filtrosHtml += `<div class="categoria-filtro">
`;
                filtrosHtml += `<h4 class="categoria-titulo">${categoria.nombre}</h4>`;
                filtrosHtml += `<div class="etiquetas-container">${etiquetasDeCategoria}</div>`;
                filtrosHtml += `</div>`;
            }
        });

        filtrosSection.innerHTML = `
            <div class="filtros-header">
                <h2><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filtros</h2>
                <button class="etiqueta-btn" data-filtro="all">Limpiar</button>
            </div>
            <div class="filtros-body">
                ${filtrosHtml}
            </div>
        `;
    }

    /**
     * Renderiza la lista completa de normas en tarjetas individuales.
     * @param {object} datos - Objeto con los datos de la aplicación.
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

    // ----------------- //
    // --- LÓGICA MAIN --- //
    // ----------------- //

    /**
     * Función principal que orquesta la carga y renderizado inicial de la aplicación.
     */
    async function main() {
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) throw new Error(`Error al cargar los datos: ${response.statusText}`);
            const data = await response.json();
            if (!data.fecha) { data.fecha = new Date().toISOString().split('T')[0]; }

            renderHeader(data); 
            renderHeaderDate(data); 
            renderIntro(data); 
            renderStatsPanel(data); 
            renderFiltros(data);
            renderNormas(data);

            setupEventListeners();
            adjustIndicatorPosition();
        } catch (error) {
            console.error("Error en la función main:", error);
            if (normasBody) { normasBody.innerHTML = `<p class="loading-message">No se pudieron cargar las normativas.</p>`; }
        }
    }

    // ----------------------- //
    // --- MANEJO DE EVENTOS --- //
    // ----------------------- //

    /**
     * Configura todos los event listeners de la aplicación.
     */
    function setupEventListeners() {
        if(filtrosSection) {
            filtrosSection.addEventListener('click', handleFilterClick);
            filtrosSection.addEventListener('click', handleCategoryClick);
        }
        if(scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        if(clearFilterFab) clearFilterFab.addEventListener('click', handleClearFilterClick);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', adjustIndicatorPosition);
    }

    /**
     * Ajusta la posición del indicador de filtro para que siempre aparezca debajo de la cabecera.
     */
    function adjustIndicatorPosition() {
        const header = document.getElementById('page-header');
        if (header && activeFilterIndicator) {
            activeFilterIndicator.style.top = `${header.offsetHeight}px`;
        }
    }

    /**
     * Maneja el clic en el botón flotante para limpiar los filtros.
     */
    function handleClearFilterClick() {
        document.querySelectorAll('#filtros-section .etiqueta-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.norma-card').forEach(card => {
            card.style.display = '';
        });

        if (clearFilterFab) clearFilterFab.classList.remove('visible');
        if (activeFilterIndicator) activeFilterIndicator.classList.remove('visible');

        if (filtrosSection) {
            const header = document.getElementById('page-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const elementTop = filtrosSection.getBoundingClientRect().top + window.scrollY;
            const scrollToPosition = elementTop - headerHeight - 16;

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Maneja el clic en los títulos de categoría para el acordeón en vistas móviles.
     * @param {Event} e - Evento de clic.
     */
    function handleCategoryClick(e) {
        const target = e.target.closest('.categoria-titulo');
        if (!target) return;

        if (window.innerWidth >= 769) return;

        const parent = target.parentElement;
        parent.classList.toggle('open');
    }

    /**
     * Maneja el clic en los botones de filtro de etiquetas.
     * @param {Event} e - Evento de clic.
     */
    function handleFilterClick(e) {
        const target = e.target.closest('.etiqueta-btn');
        if (!target) return;

        const filtro = target.dataset.filtro;
        
        document.querySelectorAll('#filtros-section .etiqueta-btn').forEach(btn => btn.classList.remove('active'));
        
        if (filtro !== 'all') {
            target.classList.add('active');
            if (clearFilterFab) clearFilterFab.classList.add('visible');
            if (activeFilterIndicator) {
                const etiquetaNombre = target.childNodes[0].nodeValue.trim();
                activeFilterIndicator.innerHTML = `<span class="active-filter-button">Filtro: ${etiquetaNombre}</span>`;
                activeFilterIndicator.classList.add('visible');
            }
        } else {
            if (clearFilterFab) clearFilterFab.classList.remove('visible');
            if (activeFilterIndicator) activeFilterIndicator.classList.remove('visible');
        }

        document.querySelectorAll('.norma-card').forEach(card => {
            const etiquetasDeLaTarjeta = (card.dataset.etiquetas || '').split(' ').filter(tag => tag);

            if (filtro === 'all' || etiquetasDeLaTarjeta.includes(filtro)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });

        const separator = document.querySelector('.separator');
        if (separator) {
            const header = document.getElementById('page-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const separatorTop = separator.getBoundingClientRect().top + window.scrollY;
            const margin = 16;
            const scrollToPosition = separatorTop - headerHeight - margin; 

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Muestra u oculta el botón de "volver arriba" según la posición del scroll.
     */
    function handleScroll() { 
        if (!filtrosSection || !scrollToTopBtn) return;

        const sectionOffset = filtrosSection.offsetTop + filtrosSection.offsetHeight; 

        const shouldBeVisible = window.scrollY > sectionOffset;
        scrollToTopBtn.classList.toggle('visible', shouldBeVisible);
    }
    
    /**
     * Normaliza un texto para usarlo como valor de filtro (minúsculas, sin acentos, etc.).
     * @param {string} texto - Texto a normalizar.
     * @returns {string} - Texto normalizado.
     */
    function normalizarParaFiltro(texto) {
        return texto.normalize('NFD')
                     .replace(/[̀-ͯ]/g, "")
                     .toLowerCase()
                     .replace(/^#+/g, '')
                     .replace(/[ -]+/g, '-')
                     .replace(/[^a-z0-9-]/g, '')
                     .trim();
    }

    // --- INICIO DE LA APLICACIÓN ---
    main();
});