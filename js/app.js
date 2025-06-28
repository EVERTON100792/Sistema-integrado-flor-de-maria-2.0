// Main Application Controller
class App {
    constructor() {
        this.currentModule = 'dashboard';
        this.isAuthenticated = false;
        this.isMobile = window.innerWidth <= 768;
        this.sidebarCollapsed = false; // Inicia como 'false' (expandida)
        
        this.init();
    }

    // Initialize application
    init() {
        this.bindEvents();
        this.setupResponsive();
        this.checkAuthentication();
        this.initializeModules();
        
        if (this.isAuthenticated) {
            this.showModule('dashboard');
        }
    }

    // Bind global events
    bindEvents() {
        // Sidebar toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Navigation menu
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.dataset.module;
                if (module) this.showModule(module);
            });
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        // Global listeners for modals, sidebar, etc.
        document.addEventListener('click', (e) => {
            // Close sidebar on mobile when clicking outside
            if (this.isMobile && !e.target.closest('.sidebar') && !e.target.closest('#sidebar-toggle')) {
                this.closeSidebar();
            }
            // Close modal via modal-close button
            if (e.target.closest('.modal-close')) {
                this.closeModal();
            }
        });

        // Escape key to close modals and sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                if (this.isMobile) this.closeSidebar();
            }
        });

        // Window resize
        window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250));
    }

    setupResponsive() {
        this.updateLayoutForDevice();
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        if (wasMobile !== this.isMobile) {
            this.updateLayoutForDevice();
        }
    }

    updateLayoutForDevice() {
        const mainApp = document.getElementById('main-app');
        if (this.isMobile) {
            mainApp.classList.remove('sidebar-collapsed');
        } else {
            mainApp.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
        }
    }

    checkAuthentication() {
        this.isAuthenticated = Auth.isAuthenticated();
        this.updateUI();
    }

    updateUI() {
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        if (this.isAuthenticated) {
            loginScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
        } else {
            loginScreen.classList.remove('hidden');
            mainApp.classList.add('hidden');
        }
    }

    initializeModules() {
        if (!this.isAuthenticated) return;
        this.modules = {
            dashboard: new Dashboard(),
            clients: new Clients(),
            inventory: new Inventory(),
            sales: new Sales(),
            cashflow: new CashFlow(),
            expenses: new Expenses(),
            receivables: new Receivables(),
            reports: new Reports(),
            settings: new Settings()
        };
        for (const moduleName in this.modules) {
            window[moduleName] = this.modules[moduleName];
            if (this.modules[moduleName].init) {
                this.modules[moduleName].init();
            }
        }
    }

    showModule(moduleName) {
        if (!this.isAuthenticated || !this.modules[moduleName]) return;
        document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
        document.getElementById(`${moduleName}-module`)?.classList.add('active');
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === moduleName);
        });
        this.currentModule = moduleName;
        this.modules[moduleName].refresh?.();
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
            document.getElementById('sidebar')?.classList.toggle('open');
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            document.getElementById('main-app')?.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
        }
    }

    closeSidebar() {
        if (this.isMobile) {
            document.getElementById('sidebar')?.classList.remove('open');
        }
    }

    // CORREÇÃO: A função de exibir o modal foi corrigida e simplificada.
    showModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        if (!modalOverlay || !modalContent) {
            console.error('Elementos do modal não encontrados no DOM.');
            return;
        }
        
        modalContent.innerHTML = content;
        modalOverlay.classList.remove('hidden');
        
        // Foco automático no primeiro elemento interativo do modal
        const firstFocusable = modalContent.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    closeModal() {
        document.getElementById('modal-overlay')?.classList.add('hidden');
    }

    showLoading(message = 'Carregando...') { return Notifications.showLoading(message); }
    hideLoading(id) { Notifications.hideLoading(id); }

    logout() {
        Auth.logout();
        this.isAuthenticated = false;
        this.updateUI();
        window.location.reload(); // Recarrega a página para garantir um estado limpo
    }

    onAuthenticationSuccess() {
        this.isAuthenticated = true;
        this.updateUI();
        this.initializeModules();
        this.showModule('dashboard');
        
        setTimeout(() => {
            Notifications.success('Bem-vinda ao Sistema de Gestão Integrado!', {
                title: 'Login realizado com sucesso'
            });
        }, 500);
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
