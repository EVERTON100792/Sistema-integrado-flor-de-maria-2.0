// Expenses Module
class Expenses {
    constructor() {
        this.expenses = [];
        this.filteredExpenses = [];
        this.currentExpense = null;
        this.searchTerm = '';
        this.dateFilter = 'all';
        this.categoryFilter = 'all';
        this.sortField = 'date';
        this.sortDirection = 'desc';
        
        this.init();
    }

    // Initialize expenses module
    init() {
        this.bindEvents();
        this.loadExpenses();
        this.renderTable();
    }

    // Bind events
    bindEvents() {
        // Add expense button
        const addExpenseBtn = document.getElementById('add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                this.showExpenseForm();
            });
        }

        // Setup filters and search
        this.setupFilters();
        this.setupTableSorting();
    }

    // Setup filters
    setupFilters() {
        const moduleHeader = document.querySelector('#expenses-module .module-header');
        if (moduleHeader && !document.getElementById('expenses-controls')) {
            const controlsContainer = document.createElement('div');
            controlsContainer.id = 'expenses-controls';
            controlsContainer.className = 'expenses-controls';
            controlsContainer.innerHTML = `
                <div class="controls-row">
                    <input type="text" id="expenses-search" class="form-control" 
                           placeholder="Buscar despesas..." style="max-width: 250px;">
                    <select id="expenses-date-filter" class="form-control" style="max-width: 150px;">
                        <option value="all">Todos os períodos</option>
                        <option value="today">Hoje</option>
                        <option value="week">Esta semana</option>
                        <option value="month">Este mês</option>
                        <option value="year">Este ano</option>
                    </select>
                    <select id="expenses-category-filter" class="form-control" style="max-width: 150px;">
                        <option value="all">Todas categorias</option>
                        <option value="rent">Aluguel</option>
                        <option value="utilities">Utilidades</option>
                        <option value="salary">Salários</option>
                        <option value="marketing">Marketing</option>
                        <option value="purchase">Compras</option>
                        <option value="maintenance">Manutenção</option>
                        <option value="transport">Transporte</option>
                        <option value="other">Outros</option>
                    </select>
                    <button class="btn btn-secondary" onclick="expenses.exportExpenses()">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
            moduleHeader.appendChild(controlsContainer);
        }

        // Search
        const searchInput = document.getElementById('expenses-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterExpenses();
                this.renderTable();
            }, 300));
        }

        // Date filter
        const dateFilter = document.getElementById('expenses-date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.dateFilter = e.target.value;
                this.filterExpenses();
                this.renderTable();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('expenses-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.categoryFilter = e.target.value;
                this.filterExpenses();
                this.renderTable();
            });
        }
    }

    // Setup table sorting
    setupTableSorting() {
        const headers = document.querySelectorAll('#expenses-table th');
        const sortableFields = ['date', 'description', 'amount'];
        
        headers.forEach((header, index) => {
            if (sortableFields[index]) {
                header.setAttribute('data-sort', sortableFields[index]);
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    this.sortExpenses(sortableFields[index]);
                });
            }
        });
    }

    // Load expenses
    loadExpenses() {
        this.expenses = StorageManager.getExpenses();
        this.filterExpenses();
    }

    // Filter expenses
    filterExpenses() {
        let filtered = [...this.expenses];

        // Apply search filter
        if (this.searchTerm) {
            filtered = Utils.searchInArray(
                filtered,
                this.searchTerm,
                ['description', 'category', 'notes']
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
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(expense => new Date(expense.date) >= startDate);
            }
        }

        // Apply category filter
        if (this.categoryFilter !== 'all') {
            filtered = filtered.filter(expense => expense.category === this.categoryFilter);
        }

        this.filteredExpenses = filtered;
    }

    // Sort expenses
    sortExpenses(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'desc';
        }

        this.filteredExpenses = Utils.sortArray(
            this.filteredExpenses,
            this.sortField,
            this.sortDirection
        );

        this.renderTable();
        this.updateSortIcons();
    }

    // Update sort icons
    updateSortIcons() {
        const headers = document.querySelectorAll('#expenses-table th[data-sort]');
        headers.forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (icon) icon.remove();
        });

        const activeHeader = document.querySelector(`#expenses-table th[data-sort="${this.sortField}"]`);
        if (activeHeader) {
            const icon = document.createElement('i');
            icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
            icon.style.marginLeft = '5px';
            activeHeader.appendChild(icon);
        }
    }

    // Render expenses table
    renderTable() {
        const tbody = document.querySelector('#expenses-table tbody');
        if (!tbody) return;

        if (this.filteredExpenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <h3>Nenhuma despesa encontrada</h3>
                            <p>Registre suas despesas para manter o controle financeiro.</p>
                            <button class="btn btn-primary" onclick="expenses.showExpenseForm()">
                                <i class="fas fa-plus"></i> Nova Despesa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredExpenses.map(expense => `
            <tr>
                <td>${Utils.formatDate(expense.date)}</td>
                <td>
                    <div class="expense-description">
                        <strong>${Utils.sanitizeHtml(expense.description)}</strong>
                        ${expense.category ? `<br><span class="expense-category">${this.getCategoryName(expense.category)}</span>` : ''}
                        ${expense.notes ? `<br><small class="text-muted">${Utils.sanitizeHtml(expense.notes)}</small>` : ''}
                    </div>
                </td>
                <td class="amount-cell expense">${Utils.formatCurrency(expense.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-primary" 
                                onclick="expenses.editExpense('${expense.id}')"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon btn-danger" 
                                onclick="expenses.deleteExpense('${expense.id}')"
                                title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Get category name
    getCategoryName(category) {
        const categories = {
            'rent': 'Aluguel',
            'utilities': 'Utilidades',
            'salary': 'Salários',
            'marketing': 'Marketing',
            'purchase': 'Compras',
            'maintenance': 'Manutenção',
            'transport': 'Transporte',
            'tax': 'Impostos',
            'insurance': 'Seguros',
            'equipment': 'Equipamentos',
            'office': 'Escritório',
            'professional': 'Serviços Profissionais',
            'other': 'Outros'
        };
        return categories[category] || category;
    }

    // Show expense form
    showExpenseForm(expense = null) {
        this.currentExpense = expense;
        const isEdit = !!expense;
        
        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-receipt"></i>
                    ${isEdit ? 'Editar Despesa' : 'Nova Despesa'}
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="expense-form" class="expense-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="expense-description">Descrição *</label>
                            <input type="text" id="expense-description" class="form-control" 
                                   value="${expense ? Utils.sanitizeHtml(expense.description) : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="expense-amount">Valor *</label>
                            <input type="number" id="expense-amount" class="form-control" 
                                   value="${expense ? expense.amount : ''}" min="0" step="0.01" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="expense-category">Categoria</label>
                            <select id="expense-category" class="form-control">
                                <option value="">Selecione uma categoria</option>
                                <option value="rent" ${expense && expense.category === 'rent' ? 'selected' : ''}>Aluguel</option>
                                <option value="utilities" ${expense && expense.category === 'utilities' ? 'selected' : ''}>Utilidades (Água, Luz, Internet)</option>
                                <option value="salary" ${expense && expense.category === 'salary' ? 'selected' : ''}>Salários</option>
                                <option value="marketing" ${expense && expense.category === 'marketing' ? 'selected' : ''}>Marketing e Publicidade</option>
                                <option value="purchase" ${expense && expense.category === 'purchase' ? 'selected' : ''}>Compras de Produtos</option>
                                <option value="maintenance" ${expense && expense.category === 'maintenance' ? 'selected' : ''}>Manutenção</option>
                                <option value="transport" ${expense && expense.category === 'transport' ? 'selected' : ''}>Transporte</option>
                                <option value="tax" ${expense && expense.category === 'tax' ? 'selected' : ''}>Impostos</option>
                                <option value="insurance" ${expense && expense.category === 'insurance' ? 'selected' : ''}>Seguros</option>
                                <option value="equipment" ${expense && expense.category === 'equipment' ? 'selected' : ''}>Equipamentos</option>
                                <option value="office" ${expense && expense.category === 'office' ? 'selected' : ''}>Material de Escritório</option>
                                <option value="professional" ${expense && expense.category === 'professional' ? 'selected' : ''}>Serviços Profissionais</option>
                                <option value="other" ${expense && expense.category === 'other' ? 'selected' : ''}>Outros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="expense-date">Data *</label>
                            <input type="date" id="expense-date" class="form-control" 
                                   value="${expense ? expense.date.split('T')[0] : Utils.getCurrentDate()}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="expense-supplier">Fornecedor/Beneficiário</label>
                        <input type="text" id="expense-supplier" class="form-control" 
                               value="${expense ? Utils.sanitizeHtml(expense.supplier || '') : ''}"
                               placeholder="Nome do fornecedor ou beneficiário">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="expense-payment-method">Forma de Pagamento</label>
                            <select id="expense-payment-method" class="form-control">
                                <option value="">Selecione</option>
                                <option value="cash" ${expense && expense.paymentMethod === 'cash' ? 'selected' : ''}>Dinheiro</option>
                                <option value="pix" ${expense && expense.paymentMethod === 'pix' ? 'selected' : ''}>PIX</option>
                                <option value="card" ${expense && expense.paymentMethod === 'card' ? 'selected' : ''}>Cartão</option>
                                <option value="transfer" ${expense && expense.paymentMethod === 'transfer' ? 'selected' : ''}>Transferência</option>
                                <option value="check" ${expense && expense.paymentMethod === 'check' ? 'selected' : ''}>Cheque</option>
                                <option value="boleto" ${expense && expense.paymentMethod === 'boleto' ? 'selected' : ''}>Boleto</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="expense-document">Documento/Nota</label>
                            <input type="text" id="expense-document" class="form-control" 
                                   value="${expense ? Utils.sanitizeHtml(expense.document || '') : ''}"
                                   placeholder="Número da nota fiscal, recibo, etc.">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="expense-notes">Observações</label>
                        <textarea id="expense-notes" class="form-control" rows="3"
                                  placeholder="Detalhes adicionais sobre a despesa">${expense ? Utils.sanitizeHtml(expense.notes || '') : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <div class="form-check">
                            <input type="checkbox" id="expense-recurring" class="form-check-input" 
                                   ${expense && expense.recurring ? 'checked' : ''}>
                            <label for="expense-recurring" class="form-check-label">
                                Despesa recorrente (mensal)
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="expenses.saveExpense()">
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
        const form = document.getElementById('expense-form');
        if (!form) return;

        const descriptionInput = document.getElementById('expense-description');
        const amountInput = document.getElementById('expense-amount');

        // Real-time validation
        descriptionInput.addEventListener('input', () => {
            this.validateField(descriptionInput, descriptionInput.value.trim().length >= 3, 'Descrição deve ter pelo menos 3 caracteres');
        });

        amountInput.addEventListener('input', () => {
            const value = parseFloat(amountInput.value);
            this.validateField(amountInput, value > 0, 'Valor deve ser maior que zero');
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

    // Save expense
    async saveExpense() {
        const form = document.getElementById('expense-form');
        if (!form) return;

        // Get form data
        const formData = {
            description: document.getElementById('expense-description').value.trim(),
            amount: parseFloat(document.getElementById('expense-amount').value) || 0,
            category: document.getElementById('expense-category').value,
            date: document.getElementById('expense-date').value,
            supplier: document.getElementById('expense-supplier').value.trim(),
            paymentMethod: document.getElementById('expense-payment-method').value,
            document: document.getElementById('expense-document').value.trim(),
            notes: document.getElementById('expense-notes').value.trim(),
            recurring: document.getElementById('expense-recurring').checked
        };

        // Validate required fields
        if (!formData.description) {
            Notifications.error('Descrição é obrigatória');
            document.getElementById('expense-description').focus();
            return;
        }

        if (formData.amount <= 0) {
            Notifications.error('Valor deve ser maior que zero');
            document.getElementById('expense-amount').focus();
            return;
        }

        if (!formData.date) {
            Notifications.error('Data é obrigatória');
            document.getElementById('expense-date').focus();
            return;
        }

        const loadingId = app.showLoading('Salvando despesa...');

        try {
            // Prepare expense data
            const expenseData = {
                ...formData,
                id: this.currentExpense ? this.currentExpense.id : undefined
            };

            // Save to storage
            const success = StorageManager.saveExpense(expenseData);

            if (success) {
                app.closeModal();
                this.refresh();
                
                const message = this.currentExpense ? 'Despesa atualizada com sucesso!' : 'Despesa cadastrada com sucesso!';
                Notifications.success(message);
            } else {
                throw new Error('Erro ao salvar despesa');
            }
        } catch (error) {
            Notifications.error('Erro ao salvar despesa: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Edit expense
    editExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (expense) {
            this.showExpenseForm(expense);
        }
    }

    // Delete expense
    async deleteExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) return;

        const confirmed = await Notifications.confirm(
            `Tem certeza que deseja excluir a despesa "${expense.description}"?\n\nEsta ação também removerá o lançamento correspondente do fluxo de caixa.`,
            'Confirmar Exclusão'
        );

        if (!confirmed) return;

        const loadingId = app.showLoading('Excluindo despesa...');

        try {
            const success = StorageManager.deleteExpense(expenseId);
            
            if (success) {
                this.refresh();
                Notifications.success('Despesa excluída com sucesso!');
            } else {
                throw new Error('Erro ao excluir despesa');
            }
        } catch (error) {
            Notifications.error('Erro ao excluir despesa: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Export expenses
    exportExpenses() {
        const data = {
            expenses: this.filteredExpenses,
            summary: this.getExpensesSummary(),
            exportedAt: new Date().toISOString(),
            filters: {
                dateFilter: this.dateFilter,
                categoryFilter: this.categoryFilter,
                searchTerm: this.searchTerm
            }
        };

        const content = JSON.stringify(data, null, 2);
        const filename = `despesas_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Despesas exportadas com sucesso!');
    }

    // Get expenses summary
    getExpensesSummary() {
        const total = this.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const categoryTotals = {};
        
        this.filteredExpenses.forEach(expense => {
            const category = expense.category || 'other';
            categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        });

        return {
            totalAmount: total,
            expenseCount: this.filteredExpenses.length,
            averageAmount: this.filteredExpenses.length > 0 ? total / this.filteredExpenses.length : 0,
            categoryTotals,
            recurringExpenses: this.filteredExpenses.filter(e => e.recurring).length
        };
    }

    // Get monthly recurring expenses
    getRecurringExpenses() {
        return this.expenses.filter(expense => expense.recurring);
    }

    // Create recurring expense for next month
    createRecurringExpenses() {
        const recurringExpenses = this.getRecurringExpenses();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        recurringExpenses.forEach(expense => {
            const newExpense = {
                ...expense,
                id: undefined, // Will get new ID
                date: nextMonth.toISOString().split('T')[0],
                notes: (expense.notes || '') + ' (Despesa recorrente)'
            };
            
            StorageManager.saveExpense(newExpense);
        });
        
        if (recurringExpenses.length > 0) {
            Notifications.success(`${recurringExpenses.length} despesa(s) recorrente(s) criada(s) para o próximo mês`);
            this.refresh();
        }
    }

    // Refresh module
    refresh() {
        this.loadExpenses();
        this.renderTable();
    }

    // Search functionality
    search(query) {
        const searchInput = document.getElementById('expenses-search');
        if (searchInput) {
            searchInput.value = query;
            this.searchTerm = query;
            this.filterExpenses();
            this.renderTable();
        }
    }
}

// Add custom styles for expenses
const expensesStyles = document.createElement('style');
expensesStyles.textContent = `
    .expenses-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .controls-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .expense-description strong {
        color: var(--color-text-primary);
    }
    
    .expense-category {
        background: rgba(255, 107, 107, 0.2);
        color: var(--color-danger);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
    }
    
    .amount-cell.expense {
        color: var(--color-danger);
        font-weight: 600;
        text-align: right;
    }
    
    .form-check {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }
    
    .form-check-input {
        width: 18px;
        height: 18px;
        accent-color: var(--color-primary);
    }
    
    .form-check-label {
        margin: 0;
        cursor: pointer;
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
document.head.appendChild(expensesStyles);

// Initialize and export
window.Expenses = Expenses;
