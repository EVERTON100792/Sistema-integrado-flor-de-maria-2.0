// Main Application Controller
class App {
    constructor() {
        this.currentModule = 'dashboard';
        this.isAuthenticated = false;
        this.isMobile = window.innerWidth <= 768;
        this.sidebarCollapsed = this.isMobile;
        
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

        // Before unload warning for unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
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
            this.sidebarCollapsed = true;
            mainApp.classList.add('sidebar-collapsed');
            sidebar.classList.remove('open');
        } else {
            this.sidebarCollapsed = false;
            mainApp.classList.remove('sidebar-collapsed');
            sidebar.classList.remove('open');
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

        // Initialize each module
        Object.values(this.modules).forEach(module => {
            if (module.init) {
                module.init();
            }
        });
    }

    // Show specific module
    showModule(moduleName) {
        if (!this.isAuthenticated) return;

        // Hide all modules
        document.querySelectorAll('.module').forEach(module => {
            module.classList.remove('active');
        });

        // Show target module
        const targetModule = document.getElementById(`${moduleName}-module`);
        if (targetModule) {
            targetModule.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update current module
        this.currentModule = moduleName;

        // Refresh module data
        if (this.modules && this.modules[moduleName] && this.modules[moduleName].refresh) {
            this.modules[moduleName].refresh();
        }

        // Close sidebar on mobile after navigation
        if (this.isMobile) {
            this.closeSidebar();
        }

        // Update page title
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
        
        // Focus management
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

    // Show loading state
    showLoading(message = 'Carregando...') {
        return Notifications.showLoading(message);
    }

    // Hide loading state
    hideLoading(id) {
        Notifications.hideLoading(id);
    }

    // Logout user
    logout() {
        Auth.logout();
        this.isAuthenticated = false;
        this.currentModule = 'dashboard';
        this.updateUI();
        Notifications.info('Você foi desconectado com sucesso.');
    }

    // Check for unsaved changes
    hasUnsavedChanges() {
        // Check each module for unsaved changes
        if (this.modules) {
            return Object.values(this.modules).some(module => 
                module.hasUnsavedChanges && module.hasUnsavedChanges()
            );
        }
        return false;
    }

    // Handle authentication success
    onAuthenticationSuccess() {
        this.isAuthenticated = true;
        this.updateUI();
        this.initializeModules();
        this.showModule('dashboard');
        
        // Welcome message
        setTimeout(() => {
            Notifications.success('Bem-vinda ao Sistema de Gestão Integrado!', {
                title: 'Login realizado com sucesso'
            });
        }, 500);
    }

    // Handle authentication failure
    onAuthenticationFailure(message) {
        Notifications.error(message || 'Erro ao fazer login. Verifique suas credenciais.');
    }

    // Refresh current module
    refreshCurrentModule() {
        if (this.modules && this.modules[this.currentModule]) {
            const module = this.modules[this.currentModule];
            if (module.refresh) {
                module.refresh();
            }
        }
    }

    // Get current module instance
    getCurrentModule() {
        return this.modules ? this.modules[this.currentModule] : null;
    }

    // Handle global search
    handleGlobalSearch(query) {
        const currentModule = this.getCurrentModule();
        if (currentModule && currentModule.search) {
            currentModule.search(query);
        }
    }

    // Handle global shortcuts
    handleShortcuts(e) {
        // Ctrl/Cmd + K for global search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.showGlobalSearch();
        }
        
        // Ctrl/Cmd + N for new item in current module
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const currentModule = this.getCurrentModule();
            if (currentModule && currentModule.createNew) {
                currentModule.createNew();
            }
        }
    }

    // Show global search
    showGlobalSearch() {
        // Implementation for global search modal
        const content = `
            <div class="modal-header">
                <h3>Busca Global</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <input type="text" id="global-search-input" class="form-control" 
                           placeholder="Digite para buscar...">
                </div>
                <div id="global-search-results" class="search-results">
                    <p class="text-muted">Digite algo para buscar</p>
                </div>
            </div>
        `;
        this.showModal(content);
        
        // Focus search input
        setTimeout(() => {
            document.getElementById('global-search-input').focus();
        }, 100);
    }

    // Initialize theme
    initTheme() {
        // Apply saved theme or default
        const savedTheme = localStorage.getItem('flordemaria_theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
    }

    // Toggle theme
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('flordemaria_theme', newTheme);
    }

    // Handle offline/online status
    handleConnectionStatus() {
        window.addEventListener('online', () => {
            Notifications.success('Conexão restaurada', {
                title: 'Online'
            });
        });

        window.addEventListener('offline', () => {
            Notifications.warning('Você está offline. Os dados serão salvos localmente.', {
                title: 'Offline'
            });
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        window.app.handleShortcuts(e);
    });
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export app instance
window.App = App;

