// Clients Module
class Clients {
    constructor() {
        this.clients = [];
        this.filteredClients = [];
        this.currentClient = null;
        this.searchTerm = '';
        this.sortField = 'name';
        this.sortDirection = 'asc';
        
        this.init();
    }

    // Initialize clients module
    init() {
        this.bindEvents();
        this.loadClients();
        this.renderTable();
    }

    // Bind events
    bindEvents() {
        // Add client button
        const addClientBtn = document.getElementById('add-client-btn');
        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => {
                this.showClientForm();
            });
        }

        // Search functionality
        this.setupSearch();
        
        // Table sorting
        this.setupTableSorting();
    }

    // Setup search functionality
    setupSearch() {
        // Add search input if not exists
        const moduleHeader = document.querySelector('#clients-module .module-header');
        if (moduleHeader && !document.getElementById('clients-search')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container';
            searchContainer.innerHTML = `
                <input type="text" id="clients-search" class="form-control" 
                       placeholder="Buscar clientes..." style="max-width: 300px;">
            `;
            moduleHeader.appendChild(searchContainer);
        }

        const searchInput = document.getElementById('clients-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterClients();
                this.renderTable();
            }, 300));
        }
    }

    // Setup table sorting
    setupTableSorting() {
        const headers = document.querySelectorAll('#clients-table th[data-sort]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                this.sortClients(field);
            });
        });
    }

    // Load clients from storage
    loadClients() {
        this.clients = StorageManager.getClients();
        this.filterClients();
    }

    // Filter clients
    filterClients() {
        if (!this.searchTerm) {
            this.filteredClients = [...this.clients];
        } else {
            this.filteredClients = Utils.searchInArray(
                this.clients,
                this.searchTerm,
                ['name', 'phone', 'email']
            );
        }
    }

    // Sort clients
    sortClients(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.filteredClients = Utils.sortArray(
            this.filteredClients,
            this.sortField,
            this.sortDirection
        );

        this.renderTable();
        this.updateSortIcons();
    }

    // Update sort icons
    updateSortIcons() {
        const headers = document.querySelectorAll('#clients-table th[data-sort]');
        headers.forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (icon) icon.remove();
        });

        const activeHeader = document.querySelector(`#clients-table th[data-sort="${this.sortField}"]`);
        if (activeHeader) {
            const icon = document.createElement('i');
            icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
            icon.style.marginLeft = '5px';
            activeHeader.appendChild(icon);
        }
    }

    // Render clients table
    renderTable() {
        const tbody = document.querySelector('#clients-table tbody');
        if (!tbody) return;

        if (this.filteredClients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>Nenhum cliente encontrado</h3>
                            <p>Adicione clientes para começar a gerenciar seus dados.</p>
                            <button class="btn btn-primary" onclick="clients.showClientForm()">
                                <i class="fas fa-plus"></i> Adicionar Cliente
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredClients.map(client => `
            <tr data-client-id="${client.id}">
                <td>
                    <div class="client-info">
                        <strong>${Utils.sanitizeHtml(client.name)}</strong>
                        ${client.email ? `<br><small class="text-muted">${Utils.sanitizeHtml(client.email)}</small>` : ''}
                    </div>
                </td>
                <td>${Utils.sanitizeHtml(client.phone || '')}</td>
                <td>${Utils.formatDate(client.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-secondary" 
                                onclick="clients.viewClientHistory('${client.id}')"
                                title="Histórico">
                            <i class="fas fa-history"></i>
                        </button>
                        <button class="btn btn-icon btn-primary" 
                                onclick="clients.editClient('${client.id}')"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon btn-danger" 
                                onclick="clients.deleteClient('${client.id}')"
                                title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Show client form
    showClientForm(client = null) {
        this.currentClient = client;
        const isEdit = !!client;
        
        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-user"></i>
                    ${isEdit ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="client-form" class="client-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="client-name">Nome *</label>
                            <input type="text" id="client-name" class="form-control" 
                                   value="${client ? Utils.sanitizeHtml(client.name) : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="client-phone">Telefone</label>
                            <input type="tel" id="client-phone" class="form-control" 
                                   value="${client ? Utils.sanitizeHtml(client.phone || '') : ''}"
                                   placeholder="(11) 99999-9999">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="client-email">E-mail</label>
                            <input type="email" id="client-email" class="form-control" 
                                   value="${client ? Utils.sanitizeHtml(client.email || '') : ''}"
                                   placeholder="cliente@email.com">
                        </div>
                        <div class="form-group">
                            <label for="client-cpf">CPF</label>
                            <input type="text" id="client-cpf" class="form-control" 
                                   value="${client ? Utils.sanitizeHtml(client.cpf || '') : ''}"
                                   placeholder="000.000.000-00">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="client-address">Endereço</label>
                        <textarea id="client-address" class="form-control" rows="3"
                                  placeholder="Endereço completo">${client ? Utils.sanitizeHtml(client.address || '') : ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="client-birthdate">Data de Nascimento</label>
                            <input type="date" id="client-birthdate" class="form-control" 
                                   value="${client ? (client.birthDate || '') : ''}">
                        </div>
                        <div class="form-group">
                            <label for="client-gender">Gênero</label>
                            <select id="client-gender" class="form-control">
                                <option value="">Não informado</option>
                                <option value="F" ${client && client.gender === 'F' ? 'selected' : ''}>Feminino</option>
                                <option value="M" ${client && client.gender === 'M' ? 'selected' : ''}>Masculino</option>
                                <option value="O" ${client && client.gender === 'O' ? 'selected' : ''}>Outro</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="client-notes">Observações</label>
                        <textarea id="client-notes" class="form-control" rows="2"
                                  placeholder="Anotações adicionais sobre o cliente">${client ? Utils.sanitizeHtml(client.notes || '') : ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="clients.saveClient()">
                    <i class="fas fa-save"></i>
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        `;

        app.showModal(modalContent);
        this.setupFormValidation();
        this.setupPhoneMask();
        this.setupCPFMask();
    }

    // Setup form validation
    setupFormValidation() {
        const form = document.getElementById('client-form');
        if (!form) return;

        const nameInput = document.getElementById('client-name');
        const emailInput = document.getElementById('client-email');
        const cpfInput = document.getElementById('client-cpf');

        // Real-time validation
        nameInput.addEventListener('input', () => {
            this.validateField(nameInput, nameInput.value.trim().length >= 2, 'Nome deve ter pelo menos 2 caracteres');
        });

        emailInput.addEventListener('input', () => {
            const email = emailInput.value.trim();
            this.validateField(emailInput, !email || Utils.isValidEmail(email), 'E-mail inválido');
        });

        cpfInput.addEventListener('input', () => {
            const cpf = cpfInput.value.trim();
            this.validateField(cpfInput, !cpf || Utils.isValidCPF(cpf), 'CPF inválido');
        });
    }

    // Setup phone mask
    setupPhoneMask() {
        const phoneInput = document.getElementById('client-phone');
        if (!phoneInput) return;

        phoneInput.addEventListener('input', (e) => {
            e.target.value = Utils.formatPhone(e.target.value);
        });
    }

    // Setup CPF mask
    setupCPFMask() {
        const cpfInput = document.getElementById('client-cpf');
        if (!cpfInput) return;

        cpfInput.addEventListener('input', (e) => {
            e.target.value = Utils.formatCPF(e.target.value);
        });
    }

    // Validate field
    validateField(input, isValid, errorMessage) {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();

        if (!isValid) {
            input.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = errorMessage;
            input.parentNode.appendChild(errorElement);
            return false;
        } else {
            input.classList.remove('error');
            return true;
        }
    }

    // Save client
    async saveClient() {
        const form = document.getElementById('client-form');
        if (!form) return;

        // Get form data
        const formData = {
            name: document.getElementById('client-name').value.trim(),
            phone: document.getElementById('client-phone').value.trim(),
            email: document.getElementById('client-email').value.trim(),
            cpf: document.getElementById('client-cpf').value.trim(),
            address: document.getElementById('client-address').value.trim(),
            birthDate: document.getElementById('client-birthdate').value,
            gender: document.getElementById('client-gender').value,
            notes: document.getElementById('client-notes').value.trim()
        };

        // Validate required fields
        if (!formData.name) {
            Notifications.error('Nome é obrigatório');
            document.getElementById('client-name').focus();
            return;
        }

        // Validate email if provided
        if (formData.email && !Utils.isValidEmail(formData.email)) {
            Notifications.error('E-mail inválido');
            document.getElementById('client-email').focus();
            return;
        }

        // Validate CPF if provided
        if (formData.cpf && !Utils.isValidCPF(formData.cpf)) {
            Notifications.error('CPF inválido');
            document.getElementById('client-cpf').focus();
            return;
        }

        // Check for duplicate email or CPF
        if (await this.checkDuplicates(formData)) {
            return;
        }

        // Show loading
        const loadingId = app.showLoading('Salvando cliente...');

        try {
            // Prepare client data
            const clientData = {
                ...formData,
                id: this.currentClient ? this.currentClient.id : undefined
            };

            // Save to storage
            const success = StorageManager.saveClient(clientData);

            if (success) {
                app.closeModal();
                this.refresh();
                
                const message = this.currentClient ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!';
                Notifications.success(message);
            } else {
                throw new Error('Erro ao salvar cliente');
            }
        } catch (error) {
            Notifications.error('Erro ao salvar cliente: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Check for duplicates
    async checkDuplicates(formData) {
        const existingClients = this.clients.filter(c => 
            c.id !== (this.currentClient ? this.currentClient.id : null)
        );

        // Check email
        if (formData.email && existingClients.some(c => c.email === formData.email)) {
            Notifications.error('Já existe um cliente com este e-mail');
            document.getElementById('client-email').focus();
            return true;
        }

        // Check CPF
        if (formData.cpf && existingClients.some(c => c.cpf === formData.cpf)) {
            Notifications.error('Já existe um cliente com este CPF');
            document.getElementById('client-cpf').focus();
            return true;
        }

        return false;
    }

    // Edit client
    editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            this.showClientForm(client);
        }
    }

    // Delete client
    async deleteClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        const confirmed = await Notifications.confirm(
            `Tem certeza que deseja excluir o cliente "${client.name}"?\n\nEsta ação não pode ser desfeita.`,
            'Confirmar Exclusão'
        );

        if (!confirmed) return;

        // Check if client has sales or receivables
        const sales = StorageManager.getSales().filter(s => s.clientId === clientId);
        const receivables = StorageManager.getReceivables().filter(r => r.clientId === clientId);

        if (sales.length > 0 || receivables.length > 0) {
            const forceDelete = await Notifications.confirm(
                `Este cliente possui ${sales.length} venda(s) e ${receivables.length} conta(s) a receber.\n\nDeseja realmente excluir?`,
                'Cliente com Histórico'
            );
            
            if (!forceDelete) return;
        }

        const loadingId = app.showLoading('Excluindo cliente...');

        try {
            const success = StorageManager.deleteClient(clientId);
            
            if (success) {
                this.refresh();
                Notifications.success('Cliente excluído com sucesso!');
            } else {
                throw new Error('Erro ao excluir cliente');
            }
        } catch (error) {
            Notifications.error('Erro ao excluir cliente: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // View client history
    viewClientHistory(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        const sales = StorageManager.getSales().filter(s => s.clientId === clientId);
        const receivables = StorageManager.getReceivables().filter(r => r.clientId === clientId);

        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-history"></i>
                    Histórico - ${Utils.sanitizeHtml(client.name)}
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="client-history">
                    <div class="history-section">
                        <h4><i class="fas fa-shopping-cart"></i> Vendas (${sales.length})</h4>
                        ${sales.length === 0 ? '<p class="text-muted">Nenhuma venda encontrada</p>' : `
                            <div class="history-list">
                                ${sales.map(sale => `
                                    <div class="history-item">
                                        <div class="history-info">
                                            <strong>Venda #${sale.id.substr(-6)}</strong>
                                            <span class="history-date">${Utils.formatDateTime(sale.createdAt)}</span>
                                        </div>
                                        <div class="history-value">${Utils.formatCurrency(sale.total)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    
                    <div class="history-section">
                        <h4><i class="fas fa-money-bill-wave"></i> Contas a Receber (${receivables.length})</h4>
                        ${receivables.length === 0 ? '<p class="text-muted">Nenhuma conta a receber</p>' : `
                            <div class="history-list">
                                ${receivables.map(receivable => `
                                    <div class="history-item">
                                        <div class="history-info">
                                            <strong>${Utils.sanitizeHtml(receivable.description)}</strong>
                                            <span class="history-date">Venc: ${Utils.formatDate(receivable.dueDate)}</span>
                                        </div>
                                        <div class="history-value">
                                            ${Utils.formatCurrency(receivable.amount)}
                                            <span class="status-badge status-${receivable.status === 'paid' ? 'paid' : 'pending'}">
                                                ${receivable.status === 'paid' ? 'Pago' : 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    
                    <div class="history-summary">
                        <div class="summary-item">
                            <span>Total em Compras:</span>
                            <strong>${Utils.formatCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Total a Receber:</span>
                            <strong>${Utils.formatCurrency(receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0))}</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Fechar
                </button>
                <button type="button" class="btn btn-primary" onclick="clients.exportClientHistory('${clientId}')">
                    <i class="fas fa-download"></i>
                    Exportar
                </button>
            </div>
        `;

        app.showModal(modalContent);
    }

    // Export client history
    exportClientHistory(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        const sales = StorageManager.getSales().filter(s => s.clientId === clientId);
        const receivables = StorageManager.getReceivables().filter(r => r.clientId === clientId);

        const data = {
            client,
            sales,
            receivables,
            exportedAt: new Date().toISOString()
        };

        const content = JSON.stringify(data, null, 2);
        const filename = `historico_${Utils.toSlug(client.name)}_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Histórico exportado com sucesso!');
    }

    // Refresh module
    refresh() {
        this.loadClients();
        this.renderTable();
    }

    // Search functionality
    search(query) {
        const searchInput = document.getElementById('clients-search');
        if (searchInput) {
            searchInput.value = query;
            this.searchTerm = query;
            this.filterClients();
            this.renderTable();
        }
    }

    // Export clients
    exportClients() {
        const data = {
            clients: this.clients,
            exportedAt: new Date().toISOString(),
            totalClients: this.clients.length
        };

        const content = JSON.stringify(data, null, 2);
        const filename = `clientes_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Clientes exportados com sucesso!');
    }

    // Import clients
    importClients(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.clients && Array.isArray(data.clients)) {
                    data.clients.forEach(client => {
                        StorageManager.saveClient(client);
                    });
                    
                    this.refresh();
                    Notifications.success(`${data.clients.length} cliente(s) importado(s) com sucesso!`);
                } else {
                    throw new Error('Formato de arquivo inválido');
                }
            } catch (error) {
                Notifications.error('Erro ao importar clientes: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Add custom styles for client history
const clientsStyles = document.createElement('style');
clientsStyles.textContent = `
    .client-form .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
    }
    
    .history-section {
        margin-bottom: var(--spacing-lg);
    }
    
    .history-section h4 {
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }
    
    .history-list {
        max-height: 200px;
        overflow-y: auto;
    }
    
    .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--color-border-light);
    }
    
    .history-info {
        display: flex;
        flex-direction: column;
    }
    
    .history-date {
        font-size: 0.8rem;
        color: var(--color-text-muted);
    }
    
    .history-value {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--spacing-xs);
    }
    
    .history-summary {
        border-top: 1px solid var(--color-border);
        padding-top: var(--spacing-md);
        margin-top: var(--spacing-md);
    }
    
    .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
    }
    
    .field-error {
        color: var(--color-danger);
        font-size: 0.8rem;
        margin-top: var(--spacing-xs);
    }
    
    .form-control.error {
        border-color: var(--color-danger);
        background: rgba(255, 107, 107, 0.1);
    }
    
    .search-container {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .client-info strong {
        color: var(--color-text-primary);
    }
`;
document.head.appendChild(clientsStyles);

// Initialize and export
window.Clients = Clients;

