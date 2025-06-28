// Main Application Controller
class App {
    constructor() {
        this.currentModule = 'dashboard';
        this.isAuthenticated = false;
        this.isMobile = window.innerWidth <= 768;
        this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.modules = {};
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.bindEvents();
            this.setupResponsive();
            this.checkAuthentication();
        });
    }

    bindEvents() {
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => this.toggleSidebar());
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.dataset.module;
                if (module) this.showModule(module);
            });
        });
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-close')) this.closeModal();
            if (this.isMobile && !document.getElementById('sidebar').contains(e.target) && !document.getElementById('sidebar-toggle').contains(e.target)) {
                this.closeSidebar();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                if (this.isMobile) this.closeSidebar();
            }
        });

        window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250));
    }

    setupResponsive() {
        this.isMobile = window.innerWidth <= 768;
        const mainApp = document.getElementById('main-app');
        if (this.isMobile) {
            mainApp.classList.remove('sidebar-collapsed');
        } else {
            mainApp.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
        }
    }

    handleResize() {
        const mobileState = this.isMobile;
        this.setupResponsive();
        if (mobileState !== this.isMobile) {
            // Logic for when switching between mobile/desktop view
        }
    }

    checkAuthentication() {
        this.isAuthenticated = Auth.isAuthenticated();
        if (this.isAuthenticated) {
            this.onAuthenticationSuccess();
        } else {
            this.updateUI();
        }
    }
    
    onAuthenticationSuccess() {
        this.isAuthenticated = true;
        this.updateUI();
        this.initializeModules();
        this.showModule('dashboard');
        const user = Auth.getCurrentUser();
        Notifications.success(`Bem-vinda de volta, ${user.username}!`, { title: 'Login realizado' });
    }

    updateUI() {
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        loginScreen.classList.toggle('hidden', this.isAuthenticated);
        mainApp.classList.toggle('hidden', !this.isAuthenticated);
    }

    initializeModules() {
        if (!this.isAuthenticated) return;
        this.modules = {
            dashboard: new Dashboard(), clients: new Clients(),
            inventory: new Inventory(), sales: new Sales(),
            cashflow: new CashFlow(), expenses: new Expenses(),
            receivables: new Receivables(), reports: new Reports(),
            settings: new Settings()
        };
        // Expose modules globally for inline onclick handlers
        for (const moduleName in this.modules) {
            window[moduleName] = this.modules[moduleName];
        }
    }

    showModule(moduleName) {
        if (!this.isAuthenticated || !this.modules[moduleName]) return;
        
        document.querySelectorAll('.module.active').forEach(m => m.classList.remove('active'));
        document.getElementById(`${moduleName}-module`)?.classList.add('active');
        
        document.querySelectorAll('.nav-item.active').forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[data-module="${moduleName}"]`)?.classList.add('active');
        
        this.currentModule = moduleName;
        if (typeof this.modules[moduleName].refresh === 'function') {
            this.modules[moduleName].refresh();
        }
        
        if (this.isMobile) this.closeSidebar();
        this.updatePageTitle(moduleName);
    }
    
    updatePageTitle(moduleName) {
        const titles = {
            dashboard: 'Dashboard', clients: 'Clientes', inventory: 'Estoque',
            sales: 'Vendas (PDV)', cashflow: 'Fluxo de Caixa', expenses: 'Despesas',
            receivables: 'Contas a Receber', reports: 'Relatórios', settings: 'Configurações'
        };
        document.title = `${titles[moduleName] || 'Sistema'} - Flor de Maria SGI`;
    }

    toggleSidebar() {
        if (this.isMobile) {
            document.getElementById('sidebar').classList.toggle('open');
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            document.getElementById('main-app').classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
            localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
        }
    }

    closeSidebar() {
        if (this.isMobile) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    showModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = content;
        modalOverlay.classList.remove('hidden');
        
        const firstFocusable = modalContent.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) firstFocusable.focus();
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.add('hidden');
        document.getElementById('modal-content').innerHTML = '';
    }

    logout() {
        Auth.logout();
        this.isAuthenticated = false;
        window.location.reload();
    }
}

// Initialize the application
window.app = new App();
window.app.init();
