document.addEventListener('DOMContentLoaded', () => {
    const appTitle = document.getElementById('app-title');
    const mainNav = document.getElementById('main-nav');
    const pageContainer = document.getElementById('page-container');
    const progressBar = document.getElementById('reading-progress-bar');

    let data = {};

    async function loadData() {
        try {
            const response = await fetch('data/daily_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            renderApp();
        } catch (error) {
            console.error('Error loading data:', error);
            pageContainer.innerHTML = `<div class="text-center py-20"><h1 class="text-2xl font-bold text-red-600">Error al cargar los datos</h1><p class="text-slate-600">Por favor, inténtelo de nuevo más tarde.</p></div>`;
        }
    }

    function renderApp() {
        appTitle.textContent = data.app.title;
        renderNav(data.app.navigation);
        renderPages(data.pages);
        showPage(data.app.defaultPage);
        lucide.createIcons();
    }

    function renderNav(navItems) {
        mainNav.innerHTML = navItems.map(item => `
            <a href="#" onclick="showPage('${item.pageId}')" class="font-medium text-slate-600 hover:text-indigo-600 transition-colors">${item.label}</a>
        `).join('');
    }

    function renderPages(pages) {
        pageContainer.innerHTML = pages.map(page => `
            <div id="${page.id}" class="page">
                ${page.content}
            </div>
        `).join('');
    }

    window.showPage = function(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0);
        }

        if (pageId.includes('detail')) {
            progressBar.style.display = 'block';
            window.addEventListener('scroll', updateProgressBar);
            updateProgressBar();
        } else {
            progressBar.style.display = 'none';
            window.removeEventListener('scroll', updateProgressBar);
        }
        
        if (pageId === 'stats-page') {
            initCharts();
        }
    }

    function updateProgressBar() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const scrollableHeight = scrollHeight - clientHeight;
        const scrolled = (scrollTop / scrollableHeight) * 100;
        progressBar.style.width = `${scrolled}%`;
    }

    let chartsInitialized = false;
    function initCharts() {
        if (chartsInitialized) return;
        chartsInitialized = true;

        const quarterlyGrowthChartCtx = document.getElementById('quarterlyGrowthChart')?.getContext('2d');
        if(quarterlyGrowthChartCtx) {
            new Chart(quarterlyGrowthChartCtx, data.charts.quarterlyGrowth);
        }

        const sectorDistributionChartCtx = document.getElementById('sectorDistributionChart')?.getContext('2d');
        if(sectorDistributionChartCtx) {
            new Chart(sectorDistributionChartCtx, data.charts.sectorDistribution);
        }
    }

    loadData();
});