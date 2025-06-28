// Main Application Controller
class App {
    constructor() {
        // CORREÇÃO: A sidebar agora começa expandida no desktop por padrão.
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
        
        // Initialize with dashboard if authenticated
        if (this.isAuthenticated) {
            this.showModule('dashboard');
        }
    }

    // Bind global events
    bindEvents() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Navigation menu
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.dataset.module;
                if (module) {
                    this.showModule(module);
                }
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMobile && !e.target.closest('.sidebar') && !e.target.closest('.sidebar-toggle')) {
                this.closeSidebar();
            }
        });

        // Escape key to close modals and sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                if (this.isMobile) {
                    this.closeSidebar();
                }
            }
        });

        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
    }

    // Setup responsive behavior
    setupResponsive() {
        this.updateLayoutForDevice();
    }

    // Handle window resize
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            this.updateLayoutForDevice();
        }
    }

    // Update layout based on device
    updateLayoutForDevice() {
        const mainApp = document.getElementById('main-app');
        const sidebar = document.getElementById('sidebar');
        
        if (this.isMobile) {
            // No celular, a sidebar está sempre "recolhida" (fora da tela) e é controlada pela classe 'open'
            mainApp.classList.remove('sidebar-collapsed');
            sidebar.classList.remove('open');
        } else {
            // No desktop, controla o estado 'collapsed'
            mainApp.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
        }
    }

    // Check authentication status
    checkAuthentication() {
        this.isAuthenticated = Auth.isAuthenticated();
        this.updateUI();
    }

    // Update UI based on authentication
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

    // Initialize all modules
    initializeModules() {
        if (!this.isAuthenticated) return;

        // Initialize module controllers
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

        // CORREÇÃO: Torna cada instância do módulo global para que os botões onclick() funcionem.
        for (const moduleName in this.modules) {
            const moduleInstance = this.modules[moduleName];
            
            // Ex: window.clients = new Clients()
            window[moduleName] = moduleInstance;
            
            if (moduleInstance.init) {
                moduleInstance.init();
            }
        }
    }

    // Show specific module
    showModule(moduleName) {
        if (!this.isAuthenticated) return;

        document.querySelectorAll('.module').forEach(module => {
            module.classList.remove('active');
        });
        const targetModule = document.getElementById(`${moduleName}-module`);
        if (targetModule) {
            targetModule.classList.add('active');
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNavItem = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        this.currentModule = moduleName;

        if (this.modules[moduleName]?.refresh) {
            this.modules[moduleName].refresh();
        }

        if (this.isMobile) {
            this.closeSidebar();
        }
        this.updatePageTitle(moduleName);
    }

    // Update page title
    updatePageTitle(moduleName) {
        const titles = {
            dashboard: 'Dashboard',
            clients: 'Clientes',
            inventory: 'Estoque',
            sales: 'Vendas (PDV)',
            cashflow: 'Fluxo de Caixa',
            expenses: 'Despesas',
            receivables: 'Contas a Receber',
            reports: 'Relatórios',
            settings: 'Configurações'
        };
        const title = titles[moduleName] || 'Sistema';
        document.title = `${title} - Flor de Maria SGI`;
    }

    // Toggle sidebar
    toggleSidebar() {
        if (this.isMobile) {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            const mainApp = document.getElementById('main-app');
            mainApp.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
        }
    }

    // Close sidebar
    closeSidebar() {
        if (this.isMobile) {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.remove('open');
        }
    }

    // Show modal
    showModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        
        modalContent.innerHTML = content;
        modalOverlay.classList.remove('hidden');
        
        const firstFocusable = modalContent.querySelector('button, input, select, textarea, [tabindex]');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    // Close modal
    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.add('hidden');
    }

    // Show/Hide loading state
    showLoading(message = 'Carregando...') { return Notifications.showLoading(message); }
    hideLoading(id) { Notifications.hideLoading(id); }

    // Logout user
    logout() {
        Auth.logout();
        this.isAuthenticated = false;
        this.updateUI();
        Notifications.info('Você foi desconectado com sucesso.');
    }

    // Handle authentication success
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
