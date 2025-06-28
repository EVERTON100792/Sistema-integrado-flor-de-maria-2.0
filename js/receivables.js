// Receivables Module
class Receivables {
    constructor() {
        this.receivables = [];
        this.filteredReceivables = [];
        this.currentReceivable = null;
        this.searchTerm = '';
        this.statusFilter = 'all'; // all, pending, paid, overdue
        this.clientFilter = 'all';
        this.sortField = 'dueDate';
        this.sortDirection = 'asc';
        
        this.init();
    }

    // Initialize receivables module
    init() {
        this.bindEvents();
        this.loadReceivables();
        this.renderTable();
    }

    // Bind events
    bindEvents() {
        // Setup filters and search
        this.setupFilters();
        this.setupTableSorting();
    }

    // Setup filters
    setupFilters() {
        const moduleHeader = document.querySelector('#receivables-module .module-header');
        if (moduleHeader && !document.getElementById('receivables-controls')) {
            const controlsContainer = document.createElement('div');
            controlsContainer.id = 'receivables-controls';
            controlsContainer.className = 'receivables-controls';
            controlsContainer.innerHTML = `
                <div class="controls-row">
                    <input type="text" id="receivables-search" class="form-control" 
                           placeholder="Buscar contas..." style="max-width: 250px;">
                    <select id="status-filter" class="form-control" style="max-width: 120px;">
                        <option value="all">Todos</option>
                        <option value="pending">Pendentes</option>
                        <option value="overdue">Vencidas</option>
                        <option value="paid">Pagas</option>
                    </select>
                    <select id="client-filter" class="form-control" style="max-width: 200px;">
                        <option value="all">Todos os clientes</option>
                    </select>
                    <button class="btn btn-secondary" onclick="receivables.exportReceivables()">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
            moduleHeader.appendChild(controlsContainer);
        }

        // Search
        const searchInput = document.getElementById('receivables-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterReceivables();
                this.renderTable();
            }, 300));
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.filterReceivables();
                this.renderTable();
            });
        }

        // Client filter
        const clientFilter = document.getElementById('client-filter');
        if (clientFilter) {
            clientFilter.addEventListener('change', (e) => {
                this.clientFilter = e.target.value;
                this.filterReceivables();
                this.renderTable();
            });
        }

        // Populate client filter
        this.populateClientFilter();
    }

    // Populate client filter
    populateClientFilter() {
        const clientFilter = document.getElementById('client-filter');
        if (!clientFilter) return;

        const clients = StorageManager.getClients();
        
        // Clear existing options except the first one
        while (clientFilter.children.length > 1) {
            clientFilter.removeChild(clientFilter.lastChild);
        }

        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientFilter.appendChild(option);
        });
    }

    // Setup table sorting
    setupTableSorting() {
        const headers = document.querySelectorAll('#receivables-table th');
        const sortableFields = ['client', 'dueDate', 'amount', 'status'];
        
        headers.forEach((header, index) => {
            if (sortableFields[index]) {
                header.setAttribute('data-sort', sortableFields[index]);
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    this.sortReceivables(sortableFields[index]);
                });
            }
        });
    }

    // Load receivables
    loadReceivables() {
        this.receivables = StorageManager.getReceivables();
        this.filterReceivables();
    }

    // Filter receivables
    filterReceivables() {
        let filtered = [...this.receivables];

        // Apply search filter
        if (this.searchTerm) {
            filtered = Utils.searchInArray(
                filtered,
                this.searchTerm,
                ['description', 'clientName']
            );
        }

        // Apply status filter
        if (this.statusFilter !== 'all') {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            filtered = filtered.filter(receivable => {
                const dueDate = new Date(receivable.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                switch (this.statusFilter) {
                    case 'pending':
                        return receivable.status === 'pending';
                    case 'overdue':
                        return receivable.status === 'pending' && dueDate < now;
                    case 'paid':
                        return receivable.status === 'paid';
                    default:
                        return true;
                }
            });
        }

        // Apply client filter
        if (this.clientFilter !== 'all') {
            filtered = filtered.filter(receivable => receivable.clientId === this.clientFilter);
        }

        this.filteredReceivables = filtered;
    }

    // Sort receivables
    sortReceivables(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.filteredReceivables = Utils.sortArray(
            this.filteredReceivables,
            this.sortField,
            this.sortDirection
        );

        this.renderTable();
        this.updateSortIcons();
    }

    // Update sort icons
    updateSortIcons() {
        const headers = document.querySelectorAll('#receivables-table th[data-sort]');
        headers.forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (icon) icon.remove();
        });

        const activeHeader = document.querySelector(`#receivables-table th[data-sort="${this.sortField}"]`);
        if (activeHeader) {
            const icon = document.createElement('i');
            icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
            icon.style.marginLeft = '5px';
            activeHeader.appendChild(icon);
        }
    }

    // Render receivables table
    renderTable() {
        const tbody = document.querySelector('#receivables-table tbody');
        if (!tbody) return;

        if (this.filteredReceivables.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-money-bill-wave"></i>
                            <h3>Nenhuma conta a receber encontrada</h3>
                            <p>As contas a receber são geradas automaticamente nas vendas a prazo.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const clients = StorageManager.getClients();

        tbody.innerHTML = this.filteredReceivables.map(receivable => {
            const client = clients.find(c => c.id === receivable.clientId);
            const clientName = client ? client.name : 'Cliente não encontrado';
            const isOverdue = Utils.isOverdue(receivable.dueDate) && receivable.status === 'pending';
            const daysUntilDue = Utils.daysBetween(new Date(), receivable.dueDate);
            
            return `
                <tr class="receivable-row ${isOverdue ? 'overdue' : ''} ${receivable.status === 'paid' ? 'paid' : ''}">
                    <td>
                        <div class="client-info">
                            <strong>${Utils.sanitizeHtml(clientName)}</strong>
                            <br><small class="text-muted">${Utils.sanitizeHtml(receivable.description)}</small>
                        </div>
                    </td>
                    <td>
                        <div class="due-date-info">
                            ${Utils.formatDate(receivable.dueDate)}
                            ${receivable.status === 'pending' ? `
                                <br><small class="${isOverdue ? 'text-danger' : daysUntilDue <= 7 ? 'text-warning' : 'text-muted'}">
                                    ${isOverdue ? `${Math.abs(daysUntilDue)} dia(s) em atraso` : 
                                      daysUntilDue === 0 ? 'Vence hoje' :
                                      daysUntilDue <= 7 ? `Vence em ${daysUntilDue} dia(s)` : ''}
                                </small>
                            ` : receivable.paidAt ? `
                                <br><small class="text-muted">Pago em ${Utils.formatDate(receivable.paidAt)}</small>
                            ` : ''}
                        </div>
                    </td>
                    <td class="amount-cell">${Utils.formatCurrency(receivable.amount)}</td>
                    <td>
                        <span class="status-badge status-${receivable.status} ${isOverdue ? 'overdue' : ''}">
                            ${receivable.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${receivable.status === 'pending' ? `
                                <button class="btn btn-icon btn-success" 
                                        onclick="receivables.markAsPaid('${receivable.id}')"
                                        title="Marcar como Pago">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-icon btn-primary" 
                                    onclick="receivables.editReceivable('${receivable.id}')"
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon btn-danger" 
                                    onclick="receivables.deleteReceivable('${receivable.id}')"
                                    title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                            ${client && client.phone ? `
                                <button class="btn btn-icon btn-info" 
                                        onclick="receivables.sendReminder('${receivable.id}')"
                                        title="Enviar Lembrete">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Mark as paid
    async markAsPaid(receivableId) {
        const receivable = this.receivables.find(r => r.id === receivableId);
        if (!receivable) return;

        const confirmed = await Notifications.confirm(
            `Marcar a conta "${receivable.description}" como paga?\n\nValor: ${Utils.formatCurrency(receivable.amount)}`,
            'Confirmar Pagamento'
        );

        if (!confirmed) return;

        const loadingId = app.showLoading('Processando pagamento...');

        try {
            const success = StorageManager.markReceivableAsPaid(receivableId);
            
            if (success) {
                this.refresh();
                Notifications.success('Conta marcada como paga com sucesso!');
            } else {
                throw new Error('Erro ao marcar conta como paga');
            }
        } catch (error) {
            Notifications.error('Erro ao processar pagamento: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Edit receivable
    editReceivable(receivableId) {
        const receivable = this.receivables.find(r => r.id === receivableId);
        if (!receivable) return;

        this.showReceivableForm(receivable);
    }

    // Show receivable form
    showReceivableForm(receivable) {
        const clients = StorageManager.getClients();
        
        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-edit"></i>
                    Editar Conta a Receber
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="receivable-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="receivable-client">Cliente *</label>
                            <select id="receivable-client" class="form-control" required>
                                <option value="">Selecione um cliente</option>
                                ${clients.map(client => `
                                    <option value="${client.id}" ${receivable.clientId === client.id ? 'selected' : ''}>
                                        ${Utils.sanitizeHtml(client.name)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="receivable-amount">Valor *</label>
                            <input type="number" id="receivable-amount" class="form-control" 
                                   value="${receivable.amount}" min="0" step="0.01" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="receivable-description">Descrição *</label>
                        <input type="text" id="receivable-description" class="form-control" 
                               value="${Utils.sanitizeHtml(receivable.description)}" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="receivable-due-date">Data de Vencimento *</label>
                            <input type="date" id="receivable-due-date" class="form-control" 
                                   value="${receivable.dueDate.split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="receivable-status">Status</label>
                            <select id="receivable-status" class="form-control">
                                <option value="pending" ${receivable.status === 'pending' ? 'selected' : ''}>Pendente</option>
                                <option value="paid" ${receivable.status === 'paid' ? 'selected' : ''}>Pago</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="receivable-notes">Observações</label>
                        <textarea id="receivable-notes" class="form-control" rows="3">${Utils.sanitizeHtml(receivable.notes || '')}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="receivables.saveReceivable('${receivable.id}')">
                    <i class="fas fa-save"></i>
                    Atualizar
                </button>
            </div>
        `;

        app.showModal(modalContent);
    }

    // Save receivable
    async saveReceivable(receivableId) {
        const formData = {
            clientId: document.getElementById('receivable-client').value,
            amount: parseFloat(document.getElementById('receivable-amount').value) || 0,
            description: document.getElementById('receivable-description').value.trim(),
            dueDate: document.getElementById('receivable-due-date').value,
            status: document.getElementById('receivable-status').value,
            notes: document.getElementById('receivable-notes').value.trim()
        };

        // Validate required fields
        if (!formData.clientId) {
            Notifications.error('Selecione um cliente');
            return;
        }

        if (formData.amount <= 0) {
            Notifications.error('Valor deve ser maior que zero');
            return;
        }

        if (!formData.description) {
            Notifications.error('Descrição é obrigatória');
            return;
        }

        if (!formData.dueDate) {
            Notifications.error('Data de vencimento é obrigatória');
            return;
        }

        const loadingId = app.showLoading('Salvando conta...');

        try {
            const receivableData = {
                ...formData,
                id: receivableId
            };

            const success = StorageManager.saveReceivable(receivableData);

            if (success) {
                app.closeModal();
                this.refresh();
                Notifications.success('Conta atualizada com sucesso!');
            } else {
                throw new Error('Erro ao salvar conta');
            }
        } catch (error) {
            Notifications.error('Erro ao salvar conta: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Delete receivable
    async deleteReceivable(receivableId) {
        const receivable = this.receivables.find(r => r.id === receivableId);
        if (!receivable) return;

        const confirmed = await Notifications.confirm(
            `Tem certeza que deseja excluir a conta "${receivable.description}"?\n\nEsta ação não pode ser desfeita.`,
            'Confirmar Exclusão'
        );

        if (!confirmed) return;

        const loadingId = app.showLoading('Excluindo conta...');

        try {
            const success = StorageManager.deleteReceivable(receivableId);
            
            if (success) {
                this.refresh();
                Notifications.success('Conta excluída com sucesso!');
            } else {
                throw new Error('Erro ao excluir conta');
            }
        } catch (error) {
            Notifications.error('Erro ao excluir conta: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Send reminder via WhatsApp
    sendReminder(receivableId) {
        const receivable = this.receivables.find(r => r.id === receivableId);
        if (!receivable) return;

        const clients = StorageManager.getClients();
        const client = clients.find(c => c.id === receivable.clientId);
        
        if (!client || !client.phone) {
            Notifications.error('Cliente não possui telefone cadastrado');
            return;
        }

        const isOverdue = Utils.isOverdue(receivable.dueDate);
        const daysUntilDue = Utils.daysBetween(new Date(), receivable.dueDate);
        
        let message = `🌸 *Flor de Maria* 🌸\n\n`;
        message += `Olá ${client.name}!\n\n`;
        
        if (isOverdue) {
            message += `⚠️ Lembrete: Sua conta está vencida há ${Math.abs(daysUntilDue)} dia(s).\n\n`;
        } else if (daysUntilDue <= 3) {
            message += `📅 Lembrete: Sua conta vence ${daysUntilDue === 0 ? 'hoje' : `em ${daysUntilDue} dia(s)`}.\n\n`;
        } else {
            message += `📋 Lembrete sobre sua conta:\n\n`;
        }
        
        message += `💰 Valor: ${Utils.formatCurrency(receivable.amount)}\n`;
        message += `📅 Vencimento: ${Utils.formatDate(receivable.dueDate)}\n`;
        message += `📝 Descrição: ${receivable.description}\n\n`;
        
        if (isOverdue) {
            message += `Por favor, entre em contato conosco para regularizar sua situação. 🙏\n\n`;
        } else {
            message += `Agradecemos sua atenção! 💕\n\n`;
        }
        
        message += `Obrigada! 😊`;

        const whatsappUrl = Utils.generateWhatsAppLink(client.phone, message);
        window.open(whatsappUrl, '_blank');
        
        Notifications.success('Lembrete enviado via WhatsApp!');
    }

    // Export receivables
    exportReceivables() {
        const data = {
            receivables: this.filteredReceivables,
            summary: this.getReceivablesSummary(),
            exportedAt: new Date().toISOString(),
            filters: {
                statusFilter: this.statusFilter,
                clientFilter: this.clientFilter,
                searchTerm: this.searchTerm
            }
        };

        const content = JSON.stringify(data, null, 2);
        const filename = `contas_receber_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Contas a receber exportadas com sucesso!');
    }

    // Get receivables summary
    getReceivablesSummary() {
        const pending = this.filteredReceivables.filter(r => r.status === 'pending');
        const overdue = pending.filter(r => Utils.isOverdue(r.dueDate));
        const paid = this.filteredReceivables.filter(r => r.status === 'paid');
        
        return {
            totalAmount: this.filteredReceivables.reduce((sum, r) => sum + r.amount, 0),
            pendingAmount: pending.reduce((sum, r) => sum + r.amount, 0),
            overdueAmount: overdue.reduce((sum, r) => sum + r.amount, 0),
            paidAmount: paid.reduce((sum, r) => sum + r.amount, 0),
            totalCount: this.filteredReceivables.length,
            pendingCount: pending.length,
            overdueCount: overdue.length,
            paidCount: paid.length
        };
    }

    // Refresh module
    refresh() {
        this.loadReceivables();
        this.populateClientFilter();
        this.renderTable();
    }

    // Search functionality
    search(query) {
        const searchInput = document.getElementById('receivables-search');
        if (searchInput) {
            searchInput.value = query;
            this.searchTerm = query;
            this.filterReceivables();
            this.renderTable();
        }
    }
}

// Add custom styles for receivables
const receivablesStyles = document.createElement('style');
receivablesStyles.textContent = `
    .receivables-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .controls-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .receivable-row.overdue {
        background: rgba(255, 107, 107, 0.1);
        border-left: 3px solid var(--color-danger);
    }
    
    .receivable-row.paid {
        background: rgba(81, 207, 102, 0.1);
        border-left: 3px solid var(--color-success);
    }
    
    .client-info strong {
        color: var(--color-text-primary);
    }
    
    .due-date-info {
        font-size: 0.9rem;
    }
    
    .amount-cell {
        font-weight: 600;
        text-align: right;
        color: var(--color-primary);
    }
    
    .status-badge.overdue {
        background: rgba(255, 107, 107, 0.2);
        color: var(--color-danger);
    }
    
    .text-danger {
        color: var(--color-danger) !important;
    }
    
    .text-warning {
        color: var(--color-warning) !important;
    }
`;
document.head.appendChild(receivablesStyles);

// Initialize and export
window.Receivables = Receivables;
