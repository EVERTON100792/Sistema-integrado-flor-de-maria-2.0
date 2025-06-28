// Storage Management System
class StorageManager {
    constructor() {
        this.storageKey = 'flordemaria_sgi';
        this.version = '2.0.0';
        this.init();
    }

    // Initialize storage structure
    init() {
        const data = this.getAllData();
        if (!data.version || data.version !== this.version) {
            this.migrateData(data);
        }
    }

    // Get all data from localStorage
    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.getDefaultStructure();
        } catch (error) {
            console.error('Error reading from storage:', error);
            return this.getDefaultStructure();
        }
    }

    // Save all data to localStorage
    saveAllData(data) {
        try {
            data.version = this.version;
            data.lastUpdate = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    // Get default data structure
    getDefaultStructure() {
        return {
            version: this.version,
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            clients: [],
            products: [],
            sales: [],
            cashFlow: [],
            expenses: [],
            receivables: [],
            settings: {
                storeName: 'Flor de Maria',
                ownerName: 'Maria',
                phone: '',
                address: '',
                defaultInterestRate: 0,
                lowStockAlert: 5,
                currency: 'BRL'
            }
        };
    }

    // Migrate data from older versions
    migrateData(oldData) {
        const newData = this.getDefaultStructure();
        
        // Preserve existing data if available
        if (oldData.clients) newData.clients = oldData.clients;
        if (oldData.products) newData.products = oldData.products;
        if (oldData.sales) newData.sales = oldData.sales;
        if (oldData.cashFlow) newData.cashFlow = oldData.cashFlow;
        if (oldData.expenses) newData.expenses = oldData.expenses;
        if (oldData.receivables) newData.receivables = oldData.receivables;
        if (oldData.settings) {
            newData.settings = { ...newData.settings, ...oldData.settings };
        }

        this.saveAllData(newData);
        console.log('Data migrated to version', this.version);
    }

    // Client operations
    getClients() {
        return this.getAllData().clients || [];
    }

    saveClient(client) {
        const data = this.getAllData();
        if (client.id) {
            // Update existing client
            const index = data.clients.findIndex(c => c.id === client.id);
            if (index !== -1) {
                data.clients[index] = { ...client, updatedAt: new Date().toISOString() };
            }
        } else {
            // Add new client
            client.id = Utils.generateId();
            client.createdAt = new Date().toISOString();
            client.updatedAt = new Date().toISOString();
            data.clients.push(client);
        }
        return this.saveAllData(data);
    }

    deleteClient(clientId) {
        const data = this.getAllData();
        data.clients = data.clients.filter(c => c.id !== clientId);
        return this.saveAllData(data);
    }

    getClientById(clientId) {
        const clients = this.getClients();
        return clients.find(c => c.id === clientId);
    }

    // Product operations
    getProducts() {
        return this.getAllData().products || [];
    }

    saveProduct(product) {
        const data = this.getAllData();
        if (product.id) {
            // Update existing product
            const index = data.products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                data.products[index] = { ...product, updatedAt: new Date().toISOString() };
            }
        } else {
            // Add new product
            product.id = Utils.generateId();
            product.createdAt = new Date().toISOString();
            product.updatedAt = new Date().toISOString();
            data.products.push(product);
        }
        return this.saveAllData(data);
    }

    deleteProduct(productId) {
        const data = this.getAllData();
        data.products = data.products.filter(p => p.id !== productId);
        return this.saveAllData(data);
    }

    getProductById(productId) {
        const products = this.getProducts();
        return products.find(p => p.id === productId);
    }

    updateProductStock(productId, quantity) {
        const data = this.getAllData();
        const productIndex = data.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            data.products[productIndex].quantity += quantity;
            data.products[productIndex].updatedAt = new Date().toISOString();
            return this.saveAllData(data);
        }
        return false;
    }

    // Sales operations
    getSales() {
        return this.getAllData().sales || [];
    }

    saveSale(sale) {
        const data = this.getAllData();
        sale.id = Utils.generateId();
        sale.createdAt = new Date().toISOString();
        
        // Update product stock
        sale.items.forEach(item => {
            this.updateProductStock(item.productId, -item.quantity);
        });

        // Add to cash flow if payment is immediate
        if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'pix') {
            const cashEntry = {
                id: Utils.generateId(),
                description: `Venda #${sale.id.substr(-6)}`,
                type: 'income',
                amount: sale.total,
                date: sale.createdAt,
                category: 'sales',
                saleId: sale.id,
                createdAt: new Date().toISOString()
            };
            data.cashFlow.push(cashEntry);
        }

        // Create receivables for installment payments
        if ((sale.paymentMethod === 'credit' || sale.paymentMethod === 'card') && sale.installments > 1) {
            const installmentValue = sale.total / sale.installments;
            for (let i = 1; i <= sale.installments; i++) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i);
                
                const receivable = {
                    id: Utils.generateId(),
                    clientId: sale.clientId,
                    saleId: sale.id,
                    description: `Parcela ${i}/${sale.installments} - Venda #${sale.id.substr(-6)}`,
                    amount: installmentValue,
                    dueDate: dueDate.toISOString(),
                    status: 'pending',
                    createdAt: new Date().toISOString()
                };
                data.receivables.push(receivable);
            }
        }

        data.sales.push(sale);
        return this.saveAllData(data);
    }

    getSaleById(saleId) {
        const sales = this.getSales();
        return sales.find(s => s.id === saleId);
    }

    // Cash Flow operations
    getCashFlow() {
        return this.getAllData().cashFlow || [];
    }

    saveCashFlow(entry) {
        const data = this.getAllData();
        if (entry.id) {
            // Update existing entry
            const index = data.cashFlow.findIndex(c => c.id === entry.id);
            if (index !== -1) {
                data.cashFlow[index] = { ...entry, updatedAt: new Date().toISOString() };
            }
        } else {
            // Add new entry
            entry.id = Utils.generateId();
            entry.createdAt = new Date().toISOString();
            data.cashFlow.push(entry);
        }
        return this.saveAllData(data);
    }

    deleteCashFlow(entryId) {
        const data = this.getAllData();
        data.cashFlow = data.cashFlow.filter(c => c.id !== entryId);
        return this.saveAllData(data);
    }

    getCurrentBalance() {
        const cashFlow = this.getCashFlow();
        return cashFlow.reduce((balance, entry) => {
            return entry.type === 'income' ? balance + entry.amount : balance - entry.amount;
        }, 0);
    }

    // Expenses operations
    getExpenses() {
        return this.getAllData().expenses || [];
    }

    saveExpense(expense) {
        const data = this.getAllData();
        if (expense.id) {
            // Update existing expense
            const index = data.expenses.findIndex(e => e.id === expense.id);
            if (index !== -1) {
                data.expenses[index] = { ...expense, updatedAt: new Date().toISOString() };
                
                // Update corresponding cash flow entry
                const cashFlowIndex = data.cashFlow.findIndex(c => c.expenseId === expense.id);
                if (cashFlowIndex !== -1) {
                    data.cashFlow[cashFlowIndex].description = expense.description;
                    data.cashFlow[cashFlowIndex].amount = expense.amount;
                    data.cashFlow[cashFlowIndex].date = expense.date;
                }
            }
        } else {
            // Add new expense
            expense.id = Utils.generateId();
            expense.createdAt = new Date().toISOString();
            data.expenses.push(expense);
            
            // Add to cash flow
            const cashEntry = {
                id: Utils.generateId(),
                description: expense.description,
                type: 'expense',
                amount: expense.amount,
                date: expense.date,
                category: 'expenses',
                expenseId: expense.id,
                createdAt: new Date().toISOString()
            };
            data.cashFlow.push(cashEntry);
        }
        return this.saveAllData(data);
    }

    deleteExpense(expenseId) {
        const data = this.getAllData();
        data.expenses = data.expenses.filter(e => e.id !== expenseId);
        // Also remove from cash flow
        data.cashFlow = data.cashFlow.filter(c => c.expenseId !== expenseId);
        return this.saveAllData(data);
    }

    // Receivables operations
    getReceivables() {
        return this.getAllData().receivables || [];
    }

    saveReceivable(receivable) {
        const data = this.getAllData();
        if (receivable.id) {
            // Update existing receivable
            const index = data.receivables.findIndex(r => r.id === receivable.id);
            if (index !== -1) {
                data.receivables[index] = { ...receivable, updatedAt: new Date().toISOString() };
            }
        } else {
            // Add new receivable
            receivable.id = Utils.generateId();
            receivable.createdAt = new Date().toISOString();
            data.receivables.push(receivable);
        }
        return this.saveAllData(data);
    }

    deleteReceivable(receivableId) {
        const data = this.getAllData();
        data.receivables = data.receivables.filter(r => r.id !== receivableId);
        return this.saveAllData(data);
    }

    markReceivableAsPaid(receivableId) {
        const data = this.getAllData();
        const receivableIndex = data.receivables.findIndex(r => r.id === receivableId);
        if (receivableIndex !== -1) {
            const receivable = data.receivables[receivableIndex];
            receivable.status = 'paid';
            receivable.paidAt = new Date().toISOString();
            
            // Add to cash flow
            const cashEntry = {
                id: Utils.generateId(),
                description: receivable.description,
                type: 'income',
                amount: receivable.amount,
                date: new Date().toISOString(),
                category: 'receivables',
                receivableId: receivableId,
                createdAt: new Date().toISOString()
            };
            data.cashFlow.push(cashEntry);
            
            return this.saveAllData(data);
        }
        return false;
    }

    // Settings operations
    getSettings() {
        return this.getAllData().settings || {};
    }

    saveSettings(settings) {
        const data = this.getAllData();
        data.settings = { ...data.settings, ...settings };
        return this.saveAllData(data);
    }

    // Backup and restore
    exportBackup() {
        const data = this.getAllData();
        const backup = {
            ...data,
            exportedAt: new Date().toISOString(),
            exportedBy: 'Flor de Maria SGI v' + this.version
        };
        return JSON.stringify(backup, null, 2);
    }

    importBackup(backupData) {
        try {
            const data = JSON.parse(backupData);
            
            // Validate backup structure
            if (!data.version) {
                throw new Error('Arquivo de backup inválido');
            }
            
            // Clear current data and import backup
            localStorage.removeItem(this.storageKey);
            this.saveAllData(data);
            
            return true;
        } catch (error) {
            console.error('Error importing backup:', error);
            return false;
        }
    }

    // Statistics and reports
    getStatistics() {
        const data = this.getAllData();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Filter current month data
        const currentMonthSales = data.sales.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        });
        
        const currentMonthExpenses = data.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });
        
        const overdueReceivables = data.receivables.filter(r => 
            r.status === 'pending' && Utils.isOverdue(r.dueDate)
        );
        
        return {
            totalClients: data.clients.length,
            totalProducts: data.products.length,
            totalSales: data.sales.length,
            currentBalance: this.getCurrentBalance(),
            monthlyRevenue: currentMonthSales.reduce((sum, sale) => sum + sale.total, 0),
            monthlyExpenses: currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
            totalReceivables: data.receivables
                .filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + r.amount, 0),
            overdueReceivables: overdueReceivables.length,
            lowStockProducts: data.products.filter(p => p.quantity <= (data.settings.lowStockAlert || 5)).length
        };
    }

    // Clear all data (for testing purposes)
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.init();
        return true;
    }

    // Get storage size
    getStorageSize() {
        const data = localStorage.getItem(this.storageKey);
        return data ? new Blob([data]).size : 0;
    }
}

// Initialize storage manager
window.StorageManager = new StorageManager();
