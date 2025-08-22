document.addEventListener('DOMContentLoaded', () => {
    const DATA_URL = 'https://gist.githubusercontent.com/Aoneken/dec64d17e138aca63e0df545cd8a7d60/raw/bora_data.json';

    const fetchData = async () => {
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderDashboard(data.estadisticas);
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    const renderDashboard = (stats) => {
        renderKPIs(stats);
        renderGaugeChart(stats);
        renderTreemap(stats);
        renderWordCloud(stats);
        renderVerticalBarChart(stats);
        renderDonutChart(stats);
        renderTopEtiquetasChart(stats);
        renderTopEmisoresChart(stats);
    };

    const renderKPIs = (stats) => {
        const kpiOptions = {
            chart: { type: 'radialBar', sparkline: { enabled: true } },
            plotOptions: { radialBar: { hollow: { size: '70%' }, dataLabels: { name: { show: false }, value: { fontSize: '1.5rem', offsetY: 5 } } } },
            fill: { colors: ['#22d3ee'] },
        };

        // Total Normas
        const totalNormasData = { series: [100], labels: ['Total Normas'], title: { text: stats.totalNormas, style: { fontSize: '2rem' } } };
        const kpiTotalNormas = new ApexCharts(document.querySelector("#kpi-total-normas"), { ...kpiOptions, ...totalNormasData });
        kpiTotalNormas.render();

        // Normas con Anexos
        const conAnexosData = { series: [Math.round((stats.totalConAnexos / stats.totalNormas) * 100)], labels: ['Con Anexos'], title: { text: stats.totalConAnexos, style: { fontSize: '2rem' } } };
        const kpiConAnexos = new ApexCharts(document.querySelector("#kpi-con-anexos"), { ...kpiOptions, ...conAnexosData });
        kpiConAnexos.render();

        // Etiquetas Únicas
        const etiquetasUnicasData = { series: [100], labels: ['Etiquetas Únicas'], title: { text: stats.totalEtiquetasUnicas, style: { fontSize: '2rem' } } };
        const kpiEtiquetasUnicas = new ApexCharts(document.querySelector("#kpi-etiquetas-unicas"), { ...kpiOptions, ...etiquetasUnicasData });
        kpiEtiquetasUnicas.render();
    };

    const renderGaugeChart = (stats) => {
        const options = {
            chart: { type: 'radialBar', height: 200 },
            series: [Math.round((stats.totalConAnexos / stats.totalNormas) * 100)],
            plotOptions: { radialBar: { hollow: { size: '60%' }, dataLabels: { name: { show: true, fontSize: '1rem', offsetY: 20 }, value: { fontSize: '1.5rem', offsetY: -20 } } } },
            labels: ['Con Anexos'],
            colors: ['#22d3ee']
        };
        const chart = new ApexCharts(document.querySelector("#gauge-anexos"), options);
        chart.render();
    };

    const renderTreemap = (stats) => {
        const seriesData = Object.entries(stats.desgloseCategorias).map(([name, value]) => ({ x: name, y: value }));
        const options = {
            series: [{ data: seriesData }],
            chart: { type: 'treemap', height: 350, toolbar: { show: false } },
            title: { text: 'Distribución por Categorías', align: 'center', style: { color: '#f1f5f9' } },
            plotOptions: { treemap: { distributed: true, enableShades: false } },
            legend: { show: false }
        };
        const chart = new ApexCharts(document.querySelector("#treemap-categorias"), options);
        chart.render();
    };

    const renderWordCloud = (stats) => {
        const data = Object.entries(stats.desgloseEtiquetas).map(([word, value]) => ({ x: word, value: value }));
        anychart.onDocumentReady(() => {
            const chart = anychart.tagCloud(data);
            chart.container("wordcloud-etiquetas");
            chart.title('Nube de Etiquetas');
            chart.background('transparent');
            chart.draw();
        });
    };

    const renderVerticalBarChart = (stats) => {
        const options = {
            series: [{ name: 'Cantidad', data: Object.values(stats.desgloseTipos) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: { categories: Object.keys(stats.desgloseTipos), labels: { style: { colors: '#cbd5e1' } } },
            yaxis: { title: { text: 'Cantidad de Normas', style: { color: '#cbd5e1' } }, labels: { style: { colors: '#cbd5e1' } } },
            fill: { opacity: 1 },
            tooltip: { y: { formatter: (val) => val } },
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
            legend: { position: 'bottom', labels: { colors: '#cbd5e1' } },
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
            dataLabels: { enabled: true, style: { colors: ['#333'] } },
            xaxis: { categories: top10.map(item => item[0]), labels: { style: { colors: '#cbd5e1' } } },
            yaxis: { labels: { style: { colors: '#cbd5e1' } } },
            title: { text: 'Top 10 Etiquetas', align: 'center', style: { color: '#f1f5f9' } }
        };
        const chart = new ApexCharts(document.querySelector("#bar-top-etiquetas"), options);
        chart.render();
    };

    const renderTopEmisoresChart = (stats) => {
        const top15 = Object.entries(stats.desgloseEmisores).sort(([,a],[,b]) => b-a).slice(0,15);
        const options = {
            series: [{ name: 'Cantidad', data: top15.map(item => item[1]) }],
            chart: { type: 'bar', height: 450, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: true } },
            dataLabels: { enabled: true, style: { colors: ['#333'] } },
            xaxis: { categories: top15.map(item => item[0]), labels: { style: { colors: '#cbd5e1' } } },
            yaxis: { labels: { style: { colors: '#cbd5e1' }, maxHeigh: 400 } },
            title: { text: 'Top 15 Emisores', align: 'center', style: { color: '#f1f5f9' } }
        };
        const chart = new ApexCharts(document.querySelector("#bar-top-emisores"), options);
        chart.render();
    };

    fetchData();
});
