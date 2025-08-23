/**
 * @file script.js
 * @description Lógica principal para la mini-aplicación del Boletín Oficial.
 * Este script se encarga de obtener, renderizar y filtrar la información de las normativas,
 * así como de manejar todas las interacciones del usuario, incluida la navegación y
 * la visualización del dashboard de estadísticas.
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
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const activeFilterIndicator = document.getElementById('active-filter-indicator');
    const activeFilterText = document.querySelector('.active-filter-text');
    const navButton = document.getElementById('nav-button');
    const mainContent = document.getElementById('main-content');
    const dashboardSection = document.getElementById('dashboard-section');

    let statsData = null; // Almacenar los datos de estadísticas
    let dashboardRendered = false; // Flag para evitar re-renderizado

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

        const categoriasDeFiltros = {
            'Desarrollo Social y Humano': ['Salud', 'Educacion', 'Cultura', 'Deportes', 'DesarrolloSocial', 'PolíticasDeVivienda', 'CreditosHipotecarios', 'Alquileres'],
            'Trabajo y Previsión Social': ['Empleo', 'Salarios', 'Sindicatos', 'Jubilaciones'],
            'Justicia, Seguridad y Política Exterior': ['Justicia', 'DerechosHumanos', 'SeguridadInterior', 'Narcotrafico', 'Defensa', 'RelacionesExteriores', 'Cancilleria'],
            'Ciencia, Tecnología y Comunicaciones': ['CienciaYTecnica', 'Comunicaciones', 'Conectividad', 'InteligenciaArtificial', 'EconomiaDelConocimiento'],
            'Infraestructura y Servicios Públicos': ['ObrasPublicas', 'ViviendaYConstruccion', 'Vialidad', 'Transporte', 'RecursosHidricos', 'Agua', 'Saneamiento'],
            'Ambiente y Energía': ['Hidrocarburos', 'Electricidad', 'EnergiasRenovables', 'EnergiaNuclear', 'Mineria', 'Litio', 'Ambiente', 'Sustentabilidad', 'TarifasEnergeticas'],
            'Economía y Producción': ['ActividadEconomica', 'TipoDeCambio', 'Inflacion', 'Industria', 'PyMEs', 'Agroindustria', 'ComercioInterior', 'ComercioExterior', 'AcuerdosComerciales'],
            'Finanzas': ['Impuestos', 'Presupuesto', 'DeudaPublica', 'Coparticipacion'],
            'Administración': ['BienesDelEstado', 'Designaciones', 'Renuncias', 'Ascensos']
        };

        const specialFormatting = {
            "PyMEs": "PyMEs",
            "JusticiaDDHH": "Justicia DDHH"
        };

        let filtrosHtml = '';
        Object.keys(categoriasDeFiltros).forEach(categoriaNombre => {
            const etiquetasDeCategoria = categoriasDeFiltros[categoriaNombre].map(etiqueta => {
                if (desgloseEtiquetas[etiqueta]) {
                    const filtro = normalizarParaFiltro(etiqueta);
                    const cantidad = desgloseEtiquetas[etiqueta];
                    const etiquetaFormateada = specialFormatting[etiqueta] || etiqueta.replace(/([A-Z])/g, ' $1').trim();
                    return `<button class="etiqueta-btn" data-filtro="${filtro}">${etiquetaFormateada} <span class="etiqueta-count">${cantidad}</span></button>`;
                }
                return '';
            }).join('');

            if (etiquetasDeCategoria) {
                filtrosHtml += `<div class="categoria-filtro">
`;
                filtrosHtml += `<h4 class="categoria-titulo">${categoriaNombre}</h4>`;
                filtrosHtml += `<div class="etiquetas-container-wrapper"><div class="etiquetas-container">${etiquetasDeCategoria}</div></div>`;
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

    const renderGroupedKPIs = (stats) => {
        const kpiGroupCard = document.getElementById('kpi-group-card');
        if (!kpiGroupCard) return;

        const kpis = [
            { id: 'total-normas', title: 'Total Normas', value: stats.totalNormas },
            { id: 'con-anexos', title: 'Normas con Anexos', value: stats.totalConAnexos },
            { id: 'etiquetas-unicas', title: 'Etiquetas Únicas', value: stats.totalEtiquetasUnicas }
        ];

        let kpisHtml = '';
        kpis.forEach(kpi => {
            kpisHtml += `
                <div class="kpi-item" style="display: flex; flex-direction: column; align-items: center; padding: 10px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <div class="kpi-value" style="font-size: 2em; font-weight: bold; color: #22d3ee;">${kpi.value}</div>
                    <div class="kpi-title" style="font-size: 0.9em; color: #cbd5e1; text-align: center;">${kpi.title}</div>
                </div>
            `;
        });

        kpiGroupCard.innerHTML = `
            <h2 style="color: #f1f5f9; text-align: center; margin-bottom: 10px;">Resumen de Normas</h2>
            <div class="kpi-group-container" style="display: flex; flex-direction: row; justify-content: space-between; gap: 1rem;">
                ${kpisHtml}
            </div>
        `;
    };

    // --- LÓGICA DEL DASHBOARD ---
    
    function renderDashboard() {
        if (dashboardRendered) return;

        renderGroupedKPIs(statsData); // Call the new grouped KPI function
        renderGaugeChart(statsData);
        renderTreemap(statsData);
        renderWordCloud(statsData);
        renderVerticalBarChart(statsData);
        renderDonutChart(statsData);
        renderTopEtiquetasChart(statsData);
        renderTopEmisoresChart(statsData);
        
        dashboardRendered = true;
    }

    const renderGaugeChart = (stats) => {
        const gaugeContainer = document.querySelector("#gauge-anexos");
        if (!gaugeContainer) return;
        gaugeContainer.innerHTML = '<h2 style="color: #f1f5f9; text-align: center; margin-bottom: 20px;">Porcentaje de Normas con Anexos</h2><div id="gauge-chart-inner"></div>';
        const options = {
            chart: { type: 'radialBar', height: 200 },
            series: [Math.round((stats.totalConAnexos / stats.totalNormas) * 100)],
            plotOptions: { radialBar: { hollow: { size: '60%' }, dataLabels: { name: { show: true, fontSize: '1rem', offsetY: 20 }, value: { fontSize: '1.5rem', offsetY: -20 } } } },
            labels: ['Con Anexos'],
            colors: ['#22d3ee']
        };
        const chart = new ApexCharts(document.querySelector("#gauge-chart-inner"), options);
        chart.render();
    };

    const renderTreemap = (stats) => {
        const seriesData = Object.entries(stats.desgloseCategorias || {}).map(([name, value]) => ({ x: name, y: value }));

    if (seriesData.length === 0) {
        const treemapContainer = document.querySelector("#treemap-categorias");
        if (treemapContainer) {
            treemapContainer.innerHTML = '<p style="color: #cbd5e1; text-align: center; padding-top: 50px;">No hay datos para el Treemap de Categorías.</p>';
        }
        return;
    }
        const options = {
            series: [{ data: seriesData }],
            chart: { type: 'treemap', height: 350, toolbar: { show: false } },
            title: { text: 'Distribución por Categorías', align: 'center', style: { color: '#f1f5f9' } },
            plotOptions: {
                treemap: {
                    distributed: true,
                    enableShades: false,
                    dataLabels: {
                        enabled: true,
                        formatter: function(text, op) {
                            console.log('Datos recibidos en formatter:', op);
                            return text + ' ' + op.value
                        },
                        offsetY: 4,
                        style: {
                            fontSize: '20px',
                            colors: ['#fff']
                        }
                    }
                }
            },
            legend: { show: false },
            tooltip: {
                y: {
                    formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                        const categoryName = w.globals.series[seriesIndex].data[dataPointIndex].x;
                        return categoryName + ": " + value;
                    }
                }
            }
        };
        const chart = new ApexCharts(document.querySelector("#treemap-categorias"), options);
        chart.render();
    };

    const renderWordCloud = (stats) => {
        const wordCloudContainer = document.querySelector("#wordcloud-etiquetas");
        if (!wordCloudContainer) return;

        // Clear previous content and add title and inner div for D3
        wordCloudContainer.innerHTML = '<h2 style="color: #f1f5f9; text-align: center; margin-bottom: 20px;">Nube de Etiquetas</h2><div id="wordcloud-chart-inner" style="height: calc(100% - 40px);"></div>';

        const data = Object.entries(stats.desgloseEtiquetas).map(([word, value]) => ({ text: word, size: value }));

        if (data.length === 0) {
            // Display a message if no data to render
            d3.select("#wordcloud-chart-inner").html('<p style="color: #cbd5e1; text-align: center; padding-top: 50px;">No hay datos para la nube de etiquetas.</p>');
            return;
        }

        // Use setTimeout to ensure container has dimensions after being visible
        setTimeout(() => {
            const width = wordCloudContainer.clientWidth;
            const height = wordCloudContainer.clientHeight - 40; // Adjust for title height

            if (width <= 0 || height <= 0) {
                console.warn("Word cloud container has zero or negative dimensions. Cannot render.");
                d3.select("#wordcloud-chart-inner").html('<p style="color: #cbd5e1; text-align: center; padding-top: 50px;">No se pudo renderizar la nube de etiquetas (dimensiones inválidas).</p>');
                return;
            }

            const maxCount = Math.max(...data.map(d => d.size));
            const minCount = Math.min(...data.map(d => d.size));

            // Handle case where all sizes are the same
            const fontSizeScale = d3.scaleLinear()
                .domain([minCount === maxCount ? minCount - 1 : minCount, maxCount]) // Adjust domain if min and max are the same
                .range([10, 60]); // Min and max font size

            const fill = d3.scaleOrdinal(d3.schemeCategory10); // Color scale

            // Check if d3.layout.cloud is defined before using it
            if (typeof d3.layout.cloud === 'undefined') {
                console.error("d3.layout.cloud is not defined. Ensure d3-cloud library is loaded correctly.");
                d3.select("#wordcloud-chart-inner").html('<p style="color: #cbd5e1; text-align: center; padding-top: 50px;">Error: d3-cloud no cargado correctamente.</p>');
                return;
            }

            d3.layout.cloud()
                .size([width, height])
                .words(data)
                .padding(5)
                .rotate(function() { return ~~(Math.random() * 2) * 90; }) // 0 or 90 degrees rotation
                .font("Impact")
                .fontSize(function(d) { return fontSizeScale(d.size); })
                .on("end", draw)
                .start();

            function draw(words) {
                d3.select("#wordcloud-chart-inner").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .style("fill", function(d, i) { return fill(i); })
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) { return d.text; });
            }
        }, 100); // Small delay to allow DOM to render and calculate dimensions
    };

    const renderVerticalBarChart = (stats) => {
        const options = {
            series: [{ name: 'Cantidad', data: Object.values(stats.desgloseTipos) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: {
                categories: Object.keys(stats.desgloseTipos),
                labels: {
                    style: { colors: '#ffffff' },
                    rotate: -45,
                    offsetY: 5
                }
            },
            yaxis: { title: { text: 'Cantidad de Normas', style: { color: '#ffffff' } }, labels: { style: { colors: '#ffffff' } } },
            fill: { opacity: 1 },
            tooltip: { y: { } },
            title: { text: 'Desglose por Tipo de Norma', align: 'center', style: { color: '#f1f5f9' } }
        };
        const chart = new ApexCharts(document.querySelector("#bar-tipo-norma"), options);
        chart.render();
    };

    const renderDonutChart = (stats) => {
        const options = {
            series: Object.values(stats.desgloseTipos),
            labels: Object.keys(stats.desgloseTipos),
            chart: { type: 'donut', height: 350 },
            title: { text: 'Distribución por Tipo de Norma', align: 'center', style: { color: '#f1f5f9' } },
            legend: {
                position: 'bottom',
                labels: { colors: '#ffffff' },
                itemMargin: { horizontal: 5, vertical: 5 },
                markers: { width: 12, height: 12, strokeWidth: 0, radius: 12 },
                formatter: function(val, opts) {
                    return val;
                }
            },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
        };
        const chart = new ApexCharts(document.querySelector("#donut-tipo-norma"), options);
        chart.render();
    };

    const renderTopEtiquetasChart = (stats) => {
        const top10 = Object.entries(stats.desgloseEtiquetas).sort(([,a],[,b]) => b-a).slice(0,10);
        const options = {
            series: [{ name: 'Cantidad', data: top10.map(item => item[1]) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: true } },
            dataLabels: { enabled: true, style: { colors: ['#ffffff'] } },
            xaxis: { categories: top10.map(item => item[0]), labels: { style: { colors: '#ffffff' } } },
            yaxis: { labels: { style: { colors: '#ffffff' } } },
            title: { text: 'Top 10 Etiquetas', align: 'center', style: { color: '#f1f5f9' } }
        };
        const chart = new ApexCharts(document.querySelector("#bar-top-etiquetas"), options);
        chart.render();
    };

    const renderTopEmisoresChart = (stats) => {
        const top15 = Object.entries(stats.desgloseEmisores).sort(([,a],[,b]) => b-a).slice(0,15);
        const options = {
            series: [{ name: 'Cantidad', data: top15.map(item => item[1]) }],
            chart: { type: 'bar', height: 600, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: true } },
            dataLabels: { enabled: true, style: { colors: ['#ffffff'] } },
            xaxis: { categories: top15.map(item => item[0]), labels: { style: { colors: '#ffffff' } } },
            yaxis: { labels: { style: { colors: '#ffffff' }, offsetX: -10, align: 'left' } },
            title: { text: 'Top 15 Emisores', align: 'center', style: { color: '#f1f5f9' } }
        };
        const chart = new ApexCharts(document.querySelector("#bar-top-emisores"), options);
        chart.render();
    };

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
            statsData = data.estadisticas;

            if (!data.fecha) { data.fecha = new Date().toISOString().split('T')[0]; }

            renderHeader(data); 
            renderHeaderDate(data); 
            renderIntro(data); 
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
        if(clearFilterBtn) clearFilterBtn.addEventListener('click', handleClearFilterClick);
        if(navButton) navButton.addEventListener('click', toggleDashboard);
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
            if (activeFilterIndicator) {
                const etiquetaNombre = target.childNodes[0].nodeValue.trim();
                activeFilterText.textContent = `Filtro: ${etiquetaNombre}`;
                activeFilterIndicator.classList.add('visible');
            }
        } else {
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

    function handleScroll() { 
        if (!filtrosSection || !scrollToTopBtn) return;

        const sectionOffset = filtrosSection.offsetTop + filtrosSection.offsetHeight; 

        const shouldBeVisible = window.scrollY > sectionOffset;
        scrollToTopBtn.classList.toggle('visible', shouldBeVisible);
    }
    
    function normalizarParaFiltro(texto) {
        return texto.normalize('NFD')
                     .replace(/[̀-ͯ]/g, "")
                     .toLowerCase()
                     .replace(/^#+/g, '')
                     .replace(/[ ßà-ÿက-῿ -⿿　-㿿︀-️︰-﹏﹐-﹯＀-￿]/g, '-')
                     .replace(/[^a-z0-9-]/g, '')
                     .trim();
    }

    function toggleDashboard() {
        const isDashboardVisible = !dashboardSection.classList.contains('hidden');
        
        if (isDashboardVisible) {
            // Switch to main view
            mainContent.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
            navButton.textContent = 'Estadísticas';
            // Scroll to the top of the main content
            mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Switch to dashboard view
            mainContent.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            navButton.textContent = 'Resumen';
            renderDashboard();
            // Scroll to the top of the dashboard section
            dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --- INICIO DE LA APLICACIÓN ---
    main();
});