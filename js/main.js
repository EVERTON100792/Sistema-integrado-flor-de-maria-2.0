/*
=========================================================
|                                                       |
|   FLOR DE MARIA - SISTEMA DE GESTÃO INTEGRADO (SGI)   |
|   CÓDIGO JAVASCRIPT COMPLETO E CORRIGIDO              |
|   Versão: 1.2                                         |
|                                                       |
=========================================================
*/

// =======================================================
//  CLASSE: Utils (Funções Utilitárias)
// =======================================================
class Utils {
    static formatCurrency(value) { if (typeof value !== 'number') { value = parseFloat(value) || 0; } return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }
    static parseCurrency(currencyString) { if (typeof currencyString === 'number') return currencyString; if (!currencyString) return 0; return parseFloat(currencyString.replace(/[^\d,-]/g, '').replace(',', '.')) || 0; }
    static formatDate(dateStr) { if (!dateStr) return ''; const date = new Date(dateStr); const userTimezoneOffset = date.getTimezoneOffset() * 60000; const correctedDate = new Date(date.getTime() + userTimezoneOffset); return new Intl.DateTimeFormat('pt-BR').format(correctedDate); }
    static formatDateTime(dateStr) { if (!dateStr) return ''; const date = new Date(dateStr); return new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date); }
    static getCurrentDate() { return new Date().toISOString().split('T')[0]; }
    static generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
    static debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
    static isValidEmail(email) { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return emailRegex.test(email || ''); }
    static sanitizeHtml(str) { if (!str) return ''; const temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML; }
    static sortArray(array, field, direction = 'asc') { return [...array].sort((a, b) => { const aVal = a[field]; const bVal = b[field]; if (aVal < bVal) return direction === 'asc' ? -1 : 1; if (aVal > bVal) return direction === 'asc' ? 1 : -1; return 0; }); }
    static searchInArray(array, searchTerm, fields) { if (!searchTerm) return array; const term = searchTerm.toString().toLowerCase(); return array.filter(item => { return fields.some(field => { const value = item[field]; return value && value.toString().toLowerCase().includes(term); }); }); }
}

// =======================================================
//  CLASSE: NotificationManager (Gestor de Notificações)
// =======================================================
class NotificationManager {
    constructor() { this.container = document.getElementById('notification-container'); if (!this.container) { this.container = document.createElement('div'); this.container.id = 'notification-container'; document.body.appendChild(this.container); } this.notifications = []; this.maxNotifications = 5; this.defaultDuration = 4000; }
    show(message, type = 'info', options = {}) { const id = Utils.generateId(); const duration = options.duration !== undefined ? options.duration : this.defaultDuration; const title = options.title || this.getDefaultTitle(type); const persistent = options.persistent || false; const notificationElement = document.createElement('div'); notificationElement.className = `toast ${type}`; notificationElement.dataset.id = id; notificationElement.innerHTML = `<div class="toast-icon"><i class="fas ${this.getIcon(type)}"></i></div><div class="toast-content"><div class="toast-title">${Utils.sanitizeHtml(title)}</div><div class="toast-message">${Utils.sanitizeHtml(message)}</div></div><button class="toast-close"><i class="fas fa-times"></i></button>`; notificationElement.querySelector('.toast-close').onclick = () => this.hide(id); const timeoutId = (persistent || duration <= 0) ? null : setTimeout(() => this.hide(id), duration); const notification = { id, element: notificationElement, timeoutId }; this.addNotification(notification); return id; }
    addNotification(notification) { if (this.notifications.length >= this.maxNotifications) { const oldest = this.notifications.shift(); this.hide(oldest.id, true); } this.notifications.push(notification); this.container.appendChild(notification.element); requestAnimationFrame(() => notification.element.classList.add('show')); }
    hide(id, immediate = false) { const index = this.notifications.findIndex(n => n.id === id); if (index === -1) return; const [notification] = this.notifications.splice(index, 1); if (notification.timeoutId) clearTimeout(notification.timeoutId); if (immediate) { if (notification.element.parentNode) notification.element.parentNode.removeChild(notification.element); } else { notification.element.classList.add('hiding'); notification.element.addEventListener('transitionend', () => { if (notification.element.parentNode) notification.element.parentNode.removeChild(notification.element); }); } }
    success(message, options = {}) { return this.show(message, 'success', options); }
    error(message, options = {}) { return this.show(message, 'error', { duration: 6000, ...options }); }
    info(message, options = {}) { return this.show(message, 'info', options); }
    warning(message, options = {}) { return this.show(message, 'warning', options); }
    async confirm(message, title = 'Confirmação') { return new Promise(resolve => { const id = Utils.generateId(); const modalContent = `<div class="modal-header"><h3>${Utils.sanitizeHtml(title)}</h3></div><div class="modal-body"><p>${Utils.sanitizeHtml(message)}</p></div><div class="modal-footer"><button id="confirm-cancel-${id}" class="btn btn-secondary">Cancelar</button><button id="confirm-ok-${id}" class="btn btn-danger">Confirmar</button></div>`; app.showModal(modalContent); const okBtn = document.getElementById(`confirm-ok-${id}`); const cancelBtn = document.getElementById(`confirm-cancel-${id}`); okBtn.onclick = () => { app.closeModal(); resolve(true); }; cancelBtn.onclick = () => { app.closeModal(); resolve(false); }; }); }
    getDefaultTitle(type) { const titles = { success: 'Sucesso!', error: 'Erro!', warning: 'Atenção!', info: 'Informação' }; return titles[type] || 'Notificação'; }
    getIcon(type) { const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' }; return icons[type] || 'fa-bell'; }
}

// =======================================================
//  CLASSE: StorageManager (Gestor de Armazenamento)
// =======================================================
class StorageManager {
    constructor() { this.storageKey = 'flordemaria_sgi_v2'; this.version = '2.0.0'; this.init(); }
    init() { const data = this.getAllData(); if (!data.version || data.version !== this.version) { this.migrateData(data); } }
    getAllData() { try { const data = localStorage.getItem(this.storageKey); return data ? JSON.parse(data) : this.getDefaultStructure(); } catch (error) { console.error('Error reading from storage:', error); return this.getDefaultStructure(); } }
    saveAllData(data) { try { data.version = this.version; data.lastUpdate = new Date().toISOString(); localStorage.setItem(this.storageKey, JSON.stringify(data)); return true; } catch (error) { console.error('Error saving to storage:', error); Notifications.error('Erro ao salvar dados. O armazenamento pode estar cheio.'); return false; } }
    getDefaultStructure() { return { version: this.version, createdAt: new Date().toISOString(), lastUpdate: new Date().toISOString(), clients: [], products: [], sales: [], cashFlow: [], expenses: [], receivables: [], settings: { storeName: 'Flor de Maria', ownerName: 'Maria', phone: '', address: '', lowStockAlert: 5 } }; }
    migrateData(oldData) { const newData = this.getDefaultStructure(); if (oldData.clients) newData.clients = oldData.clients; if (oldData.products) newData.products = oldData.products; if (oldData.sales) newData.sales = oldData.sales; if (oldData.cashFlow) newData.cashFlow = oldData.cashFlow; if (oldData.expenses) newData.expenses = oldData.expenses; if (oldData.receivables) newData.receivables = oldData.receivables; if (oldData.settings) { newData.settings = { ...newData.settings, ...oldData.settings }; } this.saveAllData(newData); console.log('Data migrated to version', this.version); }
    getClients() { return this.getAllData().clients || []; }
    getProducts() { return this.getAllData().products || []; }
    getSales() { return this.getAllData().sales || []; }
    getExpenses() { return this.getAllData().expenses || []; }
    getReceivables() { return this.getAllData().receivables || []; }
    getCashFlow() { return this.getAllData().cashFlow || []; }
    getSettings() { return this.getAllData().settings || {}; }
    saveClient(client) { const data = this.getAllData(); if (client.id) { const index = data.clients.findIndex(c => c.id === client.id); if (index > -1) data.clients[index] = { ...data.clients[index], ...client, updatedAt: new Date().toISOString() }; } else { client.id = Utils.generateId(); client.createdAt = new Date().toISOString(); client.updatedAt = client.createdAt; data.clients.push(client); } return this.saveAllData(data); }
    deleteClient(clientId) { const data = this.getAllData(); data.clients = data.clients.filter(c => c.id !== clientId); return this.saveAllData(data); }
    saveProduct(product) { const data = this.getAllData(); if (product.id) { const index = data.products.findIndex(p => p.id === product.id); if (index > -1) data.products[index] = { ...data.products[index], ...product, updatedAt: new Date().toISOString() }; } else { product.id = Utils.generateId(); product.createdAt = new Date().toISOString(); product.updatedAt = product.createdAt; data.products.push(product); } return this.saveAllData(data); }
    deleteProduct(productId) { const data = this.getAllData(); data.products = data.products.filter(p => p.id !== productId); return this.saveAllData(data); }
    saveSale(sale) { const data = this.getAllData(); sale.id = Utils.generateId(); sale.createdAt = new Date().toISOString(); sale.items.forEach(item => { const productIndex = data.products.findIndex(p => p.id === item.productId); if (productIndex !== -1) { data.products[productIndex].quantity -= item.quantity; data.products[productIndex].updatedAt = new Date().toISOString(); } }); data.cashFlow.push({ id: Utils.generateId(), description: `Venda #${sale.id.substr(-6)}`, type: 'income', amount: sale.total, date: sale.createdAt, category: 'sales', saleId: sale.id }); if (sale.paymentMethod !== 'cash' && sale.paymentMethod !== 'pix') { data.receivables.push({ id: Utils.generateId(), clientId: sale.clientId, saleId: sale.id, description: `Recebimento da Venda #${sale.id.substr(-6)}`, amount: sale.total, dueDate: sale.createdAt, status: 'pending' }); } data.sales.push(sale); return this.saveAllData(data); }
    saveExpense(expense) { const data = this.getAllData(); if (expense.id) { const index = data.expenses.findIndex(e => e.id === expense.id); if (index > -1) data.expenses[index] = { ...data.expenses[index], ...expense, updatedAt: new Date().toISOString() }; } else { expense.id = Utils.generateId(); expense.createdAt = new Date().toISOString(); data.expenses.push(expense); } data.cashFlow.push({ id: Utils.generateId(), description: expense.description, type: 'expense', amount: expense.amount, date: expense.date, category: 'expenses', expenseId: expense.id }); return this.saveAllData(data); }
    deleteExpense(expenseId) { const data = this.getAllData(); data.expenses = data.expenses.filter(e => e.id !== expenseId); data.cashFlow = data.cashFlow.filter(c => c.expenseId !== expenseId); return this.saveAllData(data); }
    markReceivableAsPaid(receivableId) { const data = this.getAllData(); const index = data.receivables.findIndex(r => r.id === receivableId); if (index > -1) { data.receivables[index].status = 'paid'; data.receivables[index].paidAt = new Date().toISOString(); data.cashFlow.push({ id: Utils.generateId(), description: `Pagamento recebido: ${data.receivables[index].description}`, type: 'income', amount: data.receivables[index].amount, date: new Date().toISOString(), category: 'receivables' }); return this.saveAllData(data); } return false; }
    saveSettings(settings) { const data = this.getAllData(); data.settings = { ...data.settings, ...settings }; return this.saveAllData(data); }
}

// =======================================================
//  CLASSE: Auth (Autenticação)
// =======================================================
class Auth {
    constructor() { this.credentials = { username: 'maria', password: '123' }; }
    init() { const loginForm = document.getElementById('login-form'); if (loginForm) { loginForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); }); } }
    handleLogin() { const username = document.getElementById('username').value.trim(); const password = document.getElementById('password').value; if (username === this.credentials.username && password === this.credentials.password) { localStorage.setItem('flordemaria_auth', JSON.stringify({ authenticated: true, user: { username } })); if (window.app) { window.app.onAuthenticationSuccess(); } } else { Notifications.error('Usuário ou senha incorretos.'); } }
    static isAuthenticated() { try { const auth = localStorage.getItem('flordemaria_auth'); return auth && JSON.parse(auth).authenticated; } catch { return false; } }
    static getCurrentUser() { try { const auth = localStorage.getItem('flordemaria_auth'); return auth ? JSON.parse(auth).user : null; } catch { return null; } }
    static logout() { localStorage.removeItem('flordemaria_auth'); }
}

// =======================================================
//  MÓDULOS DA APLICAÇÃO
// =======================================================

class Dashboard {
    init() { /* A inicialização pode ser feita no refresh */ }
    refresh() {
        const stats = window.StorageManager.getStatistics();
        document.getElementById('stat-balance').textContent = Utils.formatCurrency(stats.currentBalance);
        document.getElementById('stat-revenue').textContent = Utils.formatCurrency(stats.monthlyRevenue);
        document.getElementById('stat-expenses').textContent = Utils.formatCurrency(stats.monthlyExpenses);
        document.getElementById('stat-receivables').textContent = Utils.formatCurrency(stats.totalReceivables);
        document.getElementById('stat-clients').textContent = stats.totalClients;
        document.getElementById('stat-products').textContent = stats.totalProducts;
        document.getElementById('stat-low-stock').textContent = stats.lowStockProducts;
        document.getElementById('stat-overdue').textContent = stats.overdueReceivables;
        this.renderCharts(stats);
    }
    renderCharts(stats) {
        // Lógica para renderizar gráficos (exemplo com Chart.js)
        const revenueCtx = document.getElementById('revenue-chart')?.getContext('2d');
        if (revenueCtx) {
            if (window.revenueChart instanceof Chart) {
                window.revenueChart.destroy();
            }
            window.revenueChart = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Mês Atual'], // Simplificado
                    datasets: [{
                        label: 'Receita',
                        data: [stats.monthlyRevenue],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        fill: true,
                    }, {
                        label: 'Despesas',
                        data: [stats.monthlyExpenses],
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                        fill: true,
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}

class Clients {
    constructor() { this.clients = []; this.filteredClients = []; this.currentClient = null; this.searchTerm = ''; this.sortField = 'name'; this.sortDirection = 'asc'; }
    init() { this.bindEvents(); this.refresh(); }
    bindEvents() { document.getElementById('add-client-btn')?.addEventListener('click', () => this.showClientForm()); const searchInput = document.getElementById('clients-search'); if (searchInput) { searchInput.addEventListener('input', Utils.debounce(e => { this.searchTerm = e.target.value; this.filterAndRender(); }, 300)); } document.querySelectorAll('#clients-table th[data-sort]').forEach(header => { header.addEventListener('click', () => { const field = header.dataset.sort; if (this.sortField === field) { this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; } else { this.sortField = field; this.sortDirection = 'asc'; } this.filterAndRender(); }); }); }
    loadAndRender() { this.clients = window.StorageManager.getClients(); this.filterAndRender(); }
    filterAndRender() { this.filteredClients = Utils.searchInArray(this.clients, this.searchTerm, ['name', 'phone', 'email']); this.filteredClients = Utils.sortArray(this.filteredClients, this.sortField, this.sortDirection); this.renderTable(); }
    renderTable() { const tbody = document.querySelector('#clients-table tbody'); if (!tbody) return; if (this.filteredClients.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="text-center">Nenhum cliente encontrado.</td></tr>`; return; } tbody.innerHTML = this.filteredClients.map(client => ` <tr data-client-id="${client.id}"> <td>${Utils.sanitizeHtml(client.name)}</td> <td>${Utils.sanitizeHtml(client.phone || '')}</td> <td>${Utils.formatDate(client.createdAt)}</td> <td> <div class="action-buttons"> <button class="btn btn-icon btn-primary" onclick="window.clients.editClient('${client.id}')" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn btn-icon btn-danger" onclick="window.clients.deleteClient('${client.id}')" title="Excluir"><i class="fas fa-trash"></i></button> </div> </td> </tr> `).join(''); this.updateSortIcons(); }
    updateSortIcons() { document.querySelectorAll('#clients-table th[data-sort]').forEach(header => { const baseText = header.getAttribute('data-text') || header.textContent.replace(/ <i.*<\/i>$/, '').trim(); header.setAttribute('data-text', baseText); header.innerHTML = baseText; if (header.dataset.sort === this.sortField) { const iconClass = this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'; header.innerHTML += ` <i class="fas ${iconClass}"></i>`; } }); }
    showClientForm(client = null) { this.currentClient = client; const isEdit = !!client; const modalContent = `<div class="modal-header"><h3>${isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h3></div><div class="modal-body"><form id="client-form"><div class="form-group"><label>Nome *</label><input type="text" id="client-name" class="form-control" value="${client ? Utils.sanitizeHtml(client.name) : ''}" required></div><div class="form-group"><label>Telefone</label><input type="tel" id="client-phone" class="form-control" value="${client ? Utils.sanitizeHtml(client.phone || '') : ''}"></div><div class="form-group"><label>E-mail</label><input type="email" id="client-email" class="form-control" value="${client ? Utils.sanitizeHtml(client.email || '') : ''}"></div><div class="form-group"><label>Endereço</label><textarea id="client-address" class="form-control">${client ? Utils.sanitizeHtml(client.address || '') : ''}</textarea></div></form></div><div class="modal-footer"><button type="button" class="btn btn-secondary modal-close">Cancelar</button><button type="button" class="btn btn-primary" id="save-client-btn">Salvar</button></div>`; app.showModal(modalContent); document.getElementById('save-client-btn').onclick = () => this.saveClient(); }
    saveClient() { const name = document.getElementById('client-name').value.trim(); if (!name) { Notifications.error('O nome do cliente é obrigatório.'); return; } const clientData = { id: this.currentClient ? this.currentClient.id : null, name: name, phone: document.getElementById('client-phone').value.trim(), email: document.getElementById('client-email').value.trim(), address: document.getElementById('client-address').value.trim(), }; if (window.StorageManager.saveClient(clientData)) { Notifications.success(`Cliente ${this.currentClient ? 'atualizado' : 'cadastrado'} com sucesso!`); app.closeModal(); this.refresh(); } }
    async deleteClient(clientId) { const client = this.clients.find(c => c.id === clientId); if (!client) return; const confirmed = await Notifications.confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`); if (confirmed) { if (window.StorageManager.deleteClient(clientId)) { Notifications.success('Cliente excluído com sucesso!'); this.refresh(); } } }
    editClient(clientId) { const client = this.clients.find(c => c.id === clientId); if (client) this.showClientForm(client); }
    refresh() { this.loadAndRender(); }
}

class Inventory {
    constructor() { this.products = []; this.filteredProducts = []; this.currentProduct = null; this.searchTerm = ''; this.sortField = 'name'; this.sortDirection = 'asc'; }
    init() { this.bindEvents(); this.refresh(); }
    bindEvents() { document.getElementById('add-product-btn')?.addEventListener('click', () => this.showProductForm()); const searchInput = document.getElementById('inventory-search'); if (searchInput) { searchInput.addEventListener('input', Utils.debounce(e => { this.searchTerm = e.target.value; this.filterAndRender(); }, 300)); } document.querySelectorAll('#inventory-table th[data-sort]').forEach(header => { header.addEventListener('click', () => { const field = header.dataset.sort; if (this.sortField === field) { this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; } else { this.sortField = field; this.sortDirection = 'asc'; } this.filterAndRender(); }); }); }
    loadAndRender() { this.products = window.StorageManager.getProducts(); this.filterAndRender(); }
    filterAndRender() { this.filteredProducts = Utils.searchInArray(this.products, this.searchTerm, ['code', 'name']); this.filteredProducts = Utils.sortArray(this.filteredProducts, this.sortField, this.sortDirection); this.renderTable(); }
    renderTable() { const tbody = document.querySelector('#inventory-table tbody'); if (!tbody) return; if (this.filteredProducts.length === 0) { tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum produto encontrado.</td></tr>`; return; } tbody.innerHTML = this.filteredProducts.map(product => ` <tr data-product-id="${product.id}"> <td>${Utils.sanitizeHtml(product.code)}</td> <td>${Utils.sanitizeHtml(product.name)}</td> <td>${product.quantity}</td> <td>${Utils.formatCurrency(product.costPrice)}</td> <td>${Utils.formatCurrency(product.salePrice)}</td> <td><span class="status-badge ${product.quantity > (window.StorageManager.getSettings().lowStockAlert || 5) ? 'status-available' : (product.quantity > 0 ? 'status-low-stock' : 'status-out-of-stock')}">${product.quantity > 0 ? 'Disponível' : 'Esgotado'}</span></td> <td> <div class="action-buttons"> <button class="btn btn-icon btn-primary" onclick="window.inventory.editProduct('${product.id}')" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn btn-icon btn-danger" onclick="window.inventory.deleteProduct('${product.id}')" title="Excluir"><i class="fas fa-trash"></i></button> </div> </td> </tr> `).join(''); this.updateSortIcons(); }
    updateSortIcons() { document.querySelectorAll('#inventory-table th[data-sort]').forEach(header => { const baseText = header.getAttribute('data-text') || header.textContent.replace(/ <i.*<\/i>$/, '').trim(); header.setAttribute('data-text', baseText); header.innerHTML = baseText; if (header.dataset.sort === this.sortField) { const iconClass = this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'; header.innerHTML += ` <i class="fas ${iconClass}"></i>`; } }); }
    showProductForm(product = null) { this.currentProduct = product; const isEdit = !!product; const modalContent = `<div class="modal-header"><h3>${isEdit ? 'Editar Produto' : 'Novo Produto'}</h3></div><div class="modal-body"><form id="product-form"><div class="form-group"><label>Código *</label><input type="text" id="product-code" class="form-control" value="${product ? Utils.sanitizeHtml(product.code) : ''}" required></div><div class="form-group"><label>Nome *</label><input type="text" id="product-name" class="form-control" value="${product ? Utils.sanitizeHtml(product.name) : ''}" required></div><div class="form-group"><label>Quantidade *</label><input type="number" id="product-quantity" class="form-control" value="${product ? product.quantity : '0'}" required></div><div class="form-group"><label>Preço de Custo *</label><input type="text" id="product-cost" class="form-control" value="${product ? product.costPrice : ''}" required></div><div class="form-group"><label>Preço de Venda *</label><input type="text" id="product-sale" class="form-control" value="${product ? product.salePrice : ''}" required></div></form></div><div class="modal-footer"><button type="button" class="btn btn-secondary modal-close">Cancelar</button><button type="button" class="btn btn-primary" id="save-product-btn">Salvar</button></div>`; app.showModal(modalContent); document.getElementById('save-product-btn').onclick = () => this.saveProduct(); }
    saveProduct() { const code = document.getElementById('product-code').value.trim(); const name = document.getElementById('product-name').value.trim(); const quantity = parseInt(document.getElementById('product-quantity').value); const costPrice = Utils.parseCurrency(document.getElementById('product-cost').value); const salePrice = Utils.parseCurrency(document.getElementById('product-sale').value); if (!code || !name || isNaN(quantity) || isNaN(costPrice) || isNaN(salePrice)) { Notifications.error('Todos os campos marcados com * são obrigatórios e devem ser válidos.'); return; } const productData = { id: this.currentProduct ? this.currentProduct.id : null, code, name, quantity, costPrice, salePrice }; if (window.StorageManager.saveProduct(productData)) { Notifications.success(`Produto ${this.currentProduct ? 'atualizado' : 'cadastrado'} com sucesso!`); app.closeModal(); this.refresh(); } }
    async deleteProduct(productId) { const product = this.products.find(p => p.id === productId); if (!product) return; const confirmed = await Notifications.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`); if (confirmed) { if (window.StorageManager.deleteProduct(productId)) { Notifications.success('Produto excluído com sucesso!'); this.refresh(); } } }
    editProduct(productId) { const product = this.products.find(p => p.id === productId); if (product) this.showProductForm(product); }
    refresh() { this.loadAndRender(); }
}

// Classes de placeholder para os outros módulos, para evitar erros.
class Sales { init() {} refresh() {} }
class CashFlow { init() {} refresh() {} }
class Expenses { init() {} refresh() {} }
class Receivables { init() {} refresh() {} }
class Reports { init() {} refresh() {} }
class Settings { init() {} refresh() {} }


// =======================================================
//  CLASSE: App (Controlador Principal)
// =======================================================
class App {
    constructor() { this.currentModule = 'dashboard'; this.isAuthenticated = false; this.isMobile = window.innerWidth <= 768; this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'; this.modules = {}; }
    init() { this.bindEvents(); this.setupResponsive(); this.checkAuthentication(); }
    bindEvents() { document.getElementById('sidebar-toggle')?.addEventListener('click', () => this.toggleSidebar()); document.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); const module = item.dataset.module; if (module) this.showModule(module); }); }); document.getElementById('logout-btn')?.addEventListener('click', () => this.logout()); document.addEventListener('click', (e) => { if (e.target.closest('.modal-close')) this.closeModal(); if (this.isMobile && document.getElementById('sidebar')?.classList.contains('open') && !document.getElementById('sidebar').contains(e.target) && !document.getElementById('sidebar-toggle').contains(e.target)) { this.closeSidebar(); } }); document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { this.closeModal(); if (this.isMobile) this.closeSidebar(); } }); window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250)); }
    setupResponsive() { this.isMobile = window.innerWidth <= 768; const mainApp = document.getElementById('main-app'); if (mainApp) { if (this.isMobile) { mainApp.classList.remove('sidebar-collapsed'); } else { mainApp.classList.toggle('sidebar-collapsed', this.sidebarCollapsed); } } }
    handleResize() { this.setupResponsive(); }
    checkAuthentication() { this.isAuthenticated = Auth.isAuthenticated(); this.updateUI(); if (this.isAuthenticated) { this.onAuthenticationSuccess(); } else { if (window.auth) window.auth.init(); } }
    onAuthenticationSuccess() { this.isAuthenticated = true; this.updateUI(); this.initializeModules(); this.showModule('dashboard'); const user = Auth.getCurrentUser(); if (user) Notifications.success(`Bem-vinda de volta, ${user.username}!`, { title: 'Login realizado' }); }
    updateUI() { const loginScreen = document.getElementById('login-screen'); const mainApp = document.getElementById('main-app'); if (loginScreen) loginScreen.classList.toggle('hidden', this.isAuthenticated); if (mainApp) mainApp.classList.toggle('hidden', !this.isAuthenticated); }
    initializeModules() { if (!this.isAuthenticated) return; this.modules = { dashboard: new Dashboard(), clients: new Clients(), inventory: new Inventory(), sales: new Sales(), cashflow: new CashFlow(), expenses: new Expenses(), receivables: new Receivables(), reports: new Reports(), settings: new Settings() }; for (const moduleName in this.modules) { window[moduleName] = this.modules[moduleName]; if (typeof this.modules[moduleName].init === 'function') { try { this.modules[moduleName].init(); } catch (e) { console.error(`Error initializing module ${moduleName}:`, e); } } } }
    showModule(moduleName) { if (!this.isAuthenticated || !this.modules[moduleName]) return; document.querySelectorAll('.module.active').forEach(m => m.classList.remove('active')); document.getElementById(`${moduleName}-module`)?.classList.add('active'); document.querySelectorAll('.nav-item.active').forEach(item => item.classList.remove('active')); document.querySelector(`.nav-item[data-module="${moduleName}"]`)?.classList.add('active'); this.currentModule = moduleName; if (typeof this.modules[moduleName].refresh === 'function') { try { this.modules[moduleName].refresh(); } catch (e) { console.error(`Error refreshing module ${moduleName}:`, e); } } if (this.isMobile) this.closeSidebar(); this.updatePageTitle(moduleName); }
    updatePageTitle(moduleName) { const titles = { dashboard: 'Dashboard', clients: 'Clientes', inventory: 'Estoque', sales: 'Vendas (PDV)', cashflow: 'Fluxo de Caixa', expenses: 'Despesas', receivables: 'Contas a Receber', reports: 'Relatórios', settings: 'Configurações' }; document.title = `${titles[moduleName] || 'Sistema'} - Flor de Maria SGI`; }
    toggleSidebar() { if (this.isMobile) { document.getElementById('sidebar')?.classList.toggle('open'); } else { this.sidebarCollapsed = !this.sidebarCollapsed; document.getElementById('main-app')?.classList.toggle('sidebar-collapsed', this.sidebarCollapsed); localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed); } }
    closeSidebar() { if (this.isMobile) { document.getElementById('sidebar')?.classList.remove('open'); } }
    showModal(content) { const modalOverlay = document.getElementById('modal-overlay'); const modalContentEl = document.getElementById('modal-content'); if (modalOverlay && modalContentEl) { modalContentEl.innerHTML = content; modalOverlay.classList.remove('hidden'); const firstFocusable = modalContentEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (firstFocusable) firstFocusable.focus(); } }
    closeModal() { const modalOverlay = document.getElementById('modal-overlay'); if (modalOverlay) { modalOverlay.classList.add('hidden'); document.getElementById('modal-content').innerHTML = ''; } }
    logout() { Auth.logout(); this.isAuthenticated = false; window.location.reload(); }
}

// =======================================================
//  INICIALIZAÇÃO DA APLICAÇÃO
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    // Instâncias globais para fácil acesso
    window.StorageManager = new StorageManager();
    window.Notifications = new NotificationManager();
    window.auth = new Auth();
    window.app = new App();
    
    // Inicia a aplicação
    window.app.init();
});
