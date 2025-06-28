// Cash Flow Module
class CashFlow {
    constructor() {
        this.cashFlow = [];
        this.filteredEntries = [];
        this.currentEntry = null;
        this.dateFilter = 'all'; // all, today, week, month
        this.typeFilter = 'all'; // all, income, expense
        this.searchTerm = '';
        this.sortField = 'date';
        this.sortDirection = 'desc';
        
        this.init();
    }

    // Initialize cash flow module
    init() {
        this.bindEvents();
        this.loadCashFlow();
        this.renderInterface();
    }

    // Bind events
    bindEvents() {
        // Add cash flow button
        const addCashFlowBtn = document.getElementById('add-cashflow-btn');
        if (addCashFlowBtn) {
            addCashFlowBtn.addEventListener('click', () => {
                this.showCashFlowForm();
            });
        }

        // Setup filters and search
        this.setupFilters();
        this.setupTableSorting();
    }

    // Setup filters
    setupFilters() {
        const moduleHeader = document.querySelector('#cashflow-module .module-header');
        if (moduleHeader && !document.getElementById('cashflow-controls')) {
            const controlsContainer = document.createElement('div');
            controlsContainer.id = 'cashflow-controls';
            controlsContainer.className = 'cashflow-controls';
            controlsContainer.innerHTML = `
                <div class="controls-row">
                    <input type="text" id="cashflow-search" class="form-control" 
                           placeholder="Buscar lançamentos..." style="max-width: 250px;">
                    <select id="date-filter" class="form-control" style="max-width: 150px;">
                        <option value="all">Todos os períodos</option>
                        <option value="today">Hoje</option>
                        <option value="week">Esta semana</option>
                        <option value="month">Este mês</option>
                    </select>
                    <select id="type-filter" class="form-control" style="max-width: 120px;">
                        <option value="all">Todos</option>
                        <option value="income">Entradas</option>
                        <option value="expense">Saídas</option>
                    </select>
                    <button class="btn btn-secondary" onclick="cashFlow.exportCashFlow()">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
            moduleHeader.appendChild(controlsContainer);
        }

        // Search
        const searchInput = document.getElementById('cashflow-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterEntries();
                this.renderTable();
            }, 300));
        }

        // Date filter
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.dateFilter = e.target.value;
                this.filterEntries();
                this.renderTable();
            });
        }

        // Type filter
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.typeFilter = e.target.value;
                this.filterEntries();
                this.renderTable();
            });
        }
    }

    // Setup table sorting
    setupTableSorting() {
        const headers = document.querySelectorAll('#cashflow-table th');
        const sortableFields = ['date', 'description', 'type', 'amount'];
        
        headers.forEach((header, index) => {
            if (sortableFields[index]) {
                header.setAttribute('data-sort', sortableFields[index]);
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    this.sortEntries(sortableFields[index]);
                });
            }
        });
    }

    // Load cash flow data
    loadCashFlow() {
        this.cashFlow = StorageManager.getCashFlow();
        this.filterEntries();
    }

    // Filter entries
    filterEntries() {
        let filtered = [...this.cashFlow];

        // Apply search filter
        if (this.searchTerm) {
            filtered = Utils.searchInArray(
                filtered,
                this.searchTerm,
                ['description', 'category']
            );
        }

        // Apply date filter
        if (this.dateFilter !== 'all') {
            const now = new Date();
            let startDate;

            switch (this.dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(entry => new Date(entry.date) >= startDate);
            }
        }

        // Apply type filter
        if (this.typeFilter !== 'all') {
            filtered = filtered.filter(entry => entry.type === this.typeFilter);
        }

        this.filteredEntries = filtered;
    }

    // Sort entries
    sortEntries(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'desc';
        }

        this.filteredEntries = Utils.sortArray(
            this.filteredEntries,
            this.sortField,
            this.sortDirection
        );

        this.renderTable();
        this.updateSortIcons();
    }

    // Update sort icons
    updateSortIcons() {
        const headers = document.querySelectorAll('#cashflow-table th[data-sort]');
        headers.forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (icon) icon.remove();
        });

        const activeHeader = document.querySelector(`#cashflow-table th[data-sort="${this.sortField}"]`);
        if (activeHeader) {
            const icon = document.createElement('i');
            icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
            icon.style.marginLeft = '5px';
            activeHeader.appendChild(icon);
        }
    }

    // Render interface
    renderInterface() {
        this.updateBalance();
        this.renderTable();
    }

    // Update balance display
    updateBalance() {
        const balanceElement = document.getElementById('current-balance');
        if (!balanceElement) return;

        const balance = StorageManager.getCurrentBalance();
        balanceElement.textContent = Utils.formatCurrency(balance);
        
        // Color code the balance
        if (balance < 0) {
            balanceElement.className = 'amount expense';
        } else {
            balanceElement.className = 'amount';
        }
    }

    // Render cash flow table
    renderTable() {
        const tbody = document.querySelector('#cashflow-table tbody');
        if (!tbody) return;

        if (this.filteredEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-chart-line"></i>
                            <h3>Nenhum lançamento encontrado</h3>
                            <p>Adicione lançamentos para acompanhar seu fluxo de caixa.</p>
                            <button class="btn btn-primary" onclick="cashFlow.showCashFlowForm()">
                                <i class="fas fa-plus"></i> Novo Lançamento
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Calculate running balance
        let runningBalance = 0;
        const entriesWithBalance = this.filteredEntries.map(entry => {
            if (entry.type === 'income') {
                runningBalance += entry.amount;
            } else {
                runningBalance -= entry.amount;
            }
            return { ...entry, runningBalance };
        });

        tbody.innerHTML = entriesWithBalance.map(entry => `
            <tr class="cashflow-row cashflow-${entry.type}">
                <td>${Utils.formatDate(entry.date)}</td>
                <td>
                    <div class="entry-description">
                        <strong>${Utils.sanitizeHtml(entry.description)}</strong>
                        ${entry.category ? `<br><span class="entry-category">${Utils.sanitizeHtml(entry.category)}</span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="type-badge type-${entry.type}">
                        <i class="fas ${entry.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                        ${entry.type === 'income' ? 'Entrada' : 'Saída'}
                    </span>
                </td>
                <td class="amount-cell ${entry.type}">
                    ${entry.type === 'income' ? '+' : '-'} ${Utils.formatCurrency(entry.amount)}
                </td>
                <td class="balance-cell ${entry.runningBalance < 0 ? 'negative' : 'positive'}">
                    ${Utils.formatCurrency(entry.runningBalance)}
                </td>
                <td>
                    <div class="action-buttons">
                        ${!entry.saleId && !entry.expenseId && !entry.receivableId ? `
                            <button class="btn btn-icon btn-primary" 
                                    onclick="cashFlow.editEntry('${entry.id}')"
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon btn-danger" 
                                    onclick="cashFlow.deleteEntry('${entry.id}')"
                                    title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <span class="text-muted" title="Lançamento automático">
                                <i class="fas fa-lock"></i>
                            </span>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Show cash flow form
    showCashFlowForm(entry = null) {
        this.currentEntry = entry;
        const isEdit = !!entry;
        
        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-plus-minus"></i>
                    ${isEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="cashflow-form" class="cashflow-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="entry-type">Tipo *</label>
                            <select id="entry-type" class="form-control" required>
                                <option value="">Selecione</option>
                                <option value="income" ${entry && entry.type === 'income' ? 'selected' : ''}>Entrada</option>
                                <option value="expense" ${entry && entry.type === 'expense' ? 'selected' : ''}>Saída</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="entry-amount">Valor *</label>
                            <input type="number" id="entry-amount" class="form-control" 
                                   value="${entry ? entry.amount : ''}" min="0" step="0.01" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="entry-description">Descrição *</label>
                        <input type="text" id="entry-description" class="form-control" 
                               value="${entry ? Utils.sanitizeHtml(entry.description) : ''}" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="entry-category">Categoria</label>
                            <select id="entry-category" class="form-control">
                                <option value="">Selecione</option>
                                <optgroup label="Entradas">
                                    <option value="sales" ${entry && entry.category === 'sales' ? 'selected' : ''}>Vendas</option>
                                    <option value="receivables" ${entry && entry.category === 'receivables' ? 'selected' : ''}>Recebimentos</option>
                                    <option value="investment" ${entry && entry.category === 'investment' ? 'selected' : ''}>Investimento</option>
                                    <option value="other_income" ${entry && entry.category === 'other_income' ? 'selected' : ''}>Outras Receitas</option>
                                </optgroup>
                                <optgroup label="Saídas">
                                    <option value="expenses" ${entry && entry.category === 'expenses' ? 'selected' : ''}>Despesas</option>
                                    <option value="purchase" ${entry && entry.category === 'purchase' ? 'selected' : ''}>Compras</option>
                                    <option value="salary" ${entry && entry.category === 'salary' ? 'selected' : ''}>Salários</option>
                                    <option value="rent" ${entry && entry.category === 'rent' ? 'selected' : ''}>Aluguel</option>
                                    <option value="utilities" ${entry && entry.category === 'utilities' ? 'selected' : ''}>Utilidades</option>
                                    <option value="marketing" ${entry && entry.category === 'marketing' ? 'selected' : ''}>Marketing</option>
                                    <option value="other_expense" ${entry && entry.category === 'other_expense' ? 'selected' : ''}>Outras Despesas</option>
                                </optgroup>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="entry-date">Data *</label>
                            <input type="date" id="entry-date" class="form-control" 
                                   value="${entry ? entry.date.split('T')[0] : Utils.getCurrentDate()}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="entry-notes">Observações</label>
                        <textarea id="entry-notes" class="form-control" rows="3"
                                  placeholder="Detalhes adicionais sobre o lançamento">${entry ? Utils.sanitizeHtml(entry.notes || '') : ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="cashFlow.saveCashFlowEntry()">
                    <i class="fas fa-save"></i>
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        `;

        app.showModal(modalContent);
        this.setupFormValidation();
    }

    // Setup form validation
    setupFormValidation() {
        const form = document.getElementById('cashflow-form');
        if (!form) return;

        const typeSelect = document.getElementById('entry-type');
        const amountInput = document.getElementById('entry-amount');
        const descriptionInput = document.getElementById('entry-description');

        // Real-time validation
        typeSelect.addEventListener('change', () => {
            this.validateField(typeSelect, typeSelect.value !== '', 'Tipo é obrigatório');
        });

        amountInput.addEventListener('input', () => {
            const value = parseFloat(amountInput.value);
            this.validateField(amountInput, value > 0, 'Valor deve ser maior que zero');
        });

        descriptionInput.addEventListener('input', () => {
            this.validateField(descriptionInput, descriptionInput.value.trim().length >= 3, 'Descrição deve ter pelo menos 3 caracteres');
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

    // Save cash flow entry
    async saveCashFlowEntry() {
        const form = document.getElementById('cashflow-form');
        if (!form) return;

        // Get form data
        const formData = {
            type: document.getElementById('entry-type').value,
            amount: parseFloat(document.getElementById('entry-amount').value) || 0,
            description: document.getElementById('entry-description').value.trim(),
            category: document.getElementById('entry-category').value,
            date: document.getElementById('entry-date').value,
            notes: document.getElementById('entry-notes').value.trim()
        };

        // Validate required fields
        if (!formData.type) {
            Notifications.error('Selecione o tipo de lançamento');
            document.getElementById('entry-type').focus();
            return;
        }

        if (formData.amount <= 0) {
            Notifications.error('Valor deve ser maior que zero');
            document.getElementById('entry-amount').focus();
            return;
        }

        if (!formData.description) {
            Notifications.error('Descrição é obrigatória');
            document.getElementById('entry-description').focus();
            return;
        }

        if (!formData.date) {
            Notifications.error('Data é obrigatória');
            document.getElementById('entry-date').focus();
            return;
        }

        const loadingId = app.showLoading('Salvando lançamento...');

        try {
            // Prepare entry data
            const entryData = {
                ...formData,
                id: this.currentEntry ? this.currentEntry.id : undefined
            };

            // Save to storage
            const success = StorageManager.saveCashFlow(entryData);

            if (success) {
                app.closeModal();
                this.refresh();
                
                const message = this.currentEntry ? 'Lançamento atualizado com sucesso!' : 'Lançamento cadastrado com sucesso!';
                Notifications.success(message);
            } else {
                throw new Error('Erro ao salvar lançamento');
            }
        } catch (error) {
            Notifications.error('Erro ao salvar lançamento: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Edit entry
    editEntry(entryId) {
        const entry = this.cashFlow.find(e => e.id === entryId);
        if (entry) {
            this.showCashFlowForm(entry);
        }
    }

    // Delete entry
    async deleteEntry(entryId) {
        const entry = this.cashFlow.find(e => e.id === entryId);
        if (!entry) return;

        const confirmed = await Notifications.confirm(
            `Tem certeza que deseja excluir o lançamento "${entry.description}"?\n\nEsta ação não pode ser desfeita.`,
            'Confirmar Exclusão'
        );

        if (!confirmed) return;

        const loadingId = app.showLoading('Excluindo lançamento...');

        try {
            const success = StorageManager.deleteCashFlow(entryId);
            
            if (success) {
                this.refresh();
                Notifications.success('Lançamento excluído com sucesso!');
            } else {
                throw new Error('Erro ao excluir lançamento');
            }
        } catch (error) {
            Notifications.error('Erro ao excluir lançamento: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Export cash flow
    exportCashFlow() {
        const data = {
            entries: this.filteredEntries,
            summary: this.getCashFlowSummary(),
            currentBalance: StorageManager.getCurrentBalance(),
            exportedAt: new Date().toISOString(),
            filters: {
                dateFilter: this.dateFilter,
                typeFilter: this.typeFilter,
                searchTerm: this.searchTerm
            }
        };

        const content = JSON.stringify(data, null, 2);
        const filename = `fluxo_caixa_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Fluxo de caixa exportado com sucesso!');
    }

    // Get cash flow summary
    getCashFlowSummary() {
        const totalIncome = this.filteredEntries
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const totalExpense = this.filteredEntries
            .filter(e => e.type === 'expense')
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            totalIncome,
            totalExpense,
            netFlow: totalIncome - totalExpense,
            entryCount: this.filteredEntries.length
        };
    }

    // Refresh module
    refresh() {
        this.loadCashFlow();
        this.renderInterface();
    }

    // Search functionality
    search(query) {
        const searchInput = document.getElementById('cashflow-search');
        if (searchInput) {
            searchInput.value = query;
            this.searchTerm = query;
            this.filterEntries();
            this.renderTable();
        }
    }
}

// Add custom styles for cash flow
const cashFlowStyles = document.createElement('style');
cashFlowStyles.textContent = `
    .cashflow-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .controls-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .cashflow-row.cashflow-income {
        border-left: 3px solid var(--color-success);
    }
    
    .cashflow-row.cashflow-expense {
        border-left: 3px solid var(--color-danger);
    }
    
    .entry-description strong {
        color: var(--color-text-primary);
    }
    
    .entry-category {
        background: rgba(230, 184, 0, 0.2);
        color: var(--color-primary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
    }
    
    .type-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .type-income {
        background: rgba(81, 207, 102, 0.2);
        color: var(--color-success);
    }
    
    .type-expense {
        background: rgba(255, 107, 107, 0.2);
        color: var(--color-danger);
    }
    
    .amount-cell {
        font-weight: 600;
        text-align: right;
    }
    
    .amount-cell.income {
        color: var(--color-success);
    }
    
    .amount-cell.expense {
        color: var(--color-danger);
    }
    
    .balance-cell {
        font-weight: 600;
        text-align: right;
    }
    
    .balance-cell.positive {
        color: var(--color-success);
    }
    
    .balance-cell.negative {
        color: var(--color-danger);
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
`;
document.head.appendChild(cashFlowStyles);

// Initialize and export
window.CashFlow = CashFlow;
