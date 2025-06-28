// Storage Management System
class StorageManager {
    constructor() {
        this.storageKey = 'flordemaria_sgi_v2';
        this.version = '2.0.0';
        this.init();
    }

    init() {
        const data = this.getAllData();
        if (!data.version || data.version !== this.version) {
            this.migrateData(data);
        }
    }

    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.getDefaultStructure();
        } catch (error) {
            console.error('Error reading from storage:', error);
            return this.getDefaultStructure();
        }
    }

    saveAllData(data) {
        try {
            data.version = this.version;
            data.lastUpdate = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            Notifications.error('Erro ao salvar dados. O armazenamento pode estar cheio.');
            return false;
        }
    }

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
                lowStockAlert: 5,
                currency: 'BRL',
                autoBackup: false,
                showTips: true
            }
        };
    }

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
    
    // Generic Getters
    getClients() { return this.getAllData().clients || []; }
    getProducts() { return this.getAllData().products || []; }
    getSales() { return this.getAllData().sales || []; }
    getCashFlow() { return this.getAllData().cashFlow || []; }
    getExpenses() { return this.getAllData().expenses || []; }
    getReceivables() { return this.getAllData().receivables || []; }
    getSettings() { return this.getAllData().settings || {}; }

    // Client Operations
    saveClient(client) {
        const data = this.getAllData();
        if (client.id) {
            const index = data.clients.findIndex(c => c.id === client.id);
            if (index > -1) data.clients[index] = { ...data.clients[index], ...client, updatedAt: new Date().toISOString() };
        } else {
            client.id = Utils.generateId();
            client.createdAt = new Date().toISOString();
            client.updatedAt = client.createdAt;
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
        return this.getClients().find(c => c.id === clientId);
    }

    // Product Operations
    saveProduct(product) {
        const data = this.getAllData();
        if (product.id) {
            const index = data.products.findIndex(p => p.id === product.id);
            if (index > -1) data.products[index] = { ...data.products[index], ...product, updatedAt: new Date().toISOString() };
        } else {
            product.id = Utils.generateId();
            product.createdAt = new Date().toISOString();
            product.updatedAt = product.createdAt;
            data.products.push(product);
        }
        return this.saveAllData(data);
    }

    deleteProduct(productId) {
        const data = this.getAllData();
        data.products = data.products.filter(p => p.id !== productId);
        return this.saveAllData(data);
    }
    
    updateProductStock(productId, quantityChange) {
        const data = this.getAllData();
        const productIndex = data.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            data.products[productIndex].quantity += quantityChange;
            data.products[productIndex].updatedAt = new Date().toISOString();
            return this.saveAllData(data);
        }
        return false;
    }

    // Sale Operations
    saveSale(sale) {
        const data = this.getAllData();
        sale.id = Utils.generateId();
        sale.createdAt = new Date().toISOString();

        // Update product stock from the main data object
        sale.items.forEach(item => {
            const productIndex = data.products.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                data.products[productIndex].quantity -= item.quantity;
                data.products[productIndex].updatedAt = new Date().toISOString();
            }
        });

        if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'pix') {
            data.cashFlow.push({
                id: Utils.generateId(), description: `Venda #${sale.id.substr(-6)}`,
                type: 'income', amount: sale.total, date: sale.createdAt,
                category: 'sales', saleId: sale.id, createdAt: new Date().toISOString()
            });
        }
        
        if ((sale.paymentMethod === 'credit' || sale.paymentMethod === 'card') && sale.installments >= 1) {
             const installmentValue = sale.total / sale.installments;
             for (let i = 1; i <= sale.installments; i++) {
                 const dueDate = new Date(sale.createdAt);
                 dueDate.setMonth(dueDate.getMonth() + i);
                 data.receivables.push({
                     id: Utils.generateId(), clientId: sale.clientId, saleId: sale.id,
                     description: `Parcela ${i}/${sale.installments} - Venda #${sale.id.substr(-6)}`,
                     amount: installmentValue, dueDate: dueDate.toISOString(),
                     status: 'pending', createdAt: new Date().toISOString()
                 });
             }
         }

        data.sales.push(sale);
        return this.saveAllData(data);
    }

    // Other Operations
    saveSettings(settings) {
        const data = this.getAllData();
        data.settings = { ...data.settings, ...settings };
        return this.saveAllData(data);
    }

    saveExpense(expense) {
        const data = this.getAllData();
        if (expense.id) {
            const index = data.expenses.findIndex(e => e.id === expense.id);
            if(index > -1) {
                 data.expenses[index] = {...data.expenses[index], ...expense, updatedAt: new Date().toISOString()};
                 const cashFlowIndex = data.cashFlow.findIndex(c => c.expenseId === expense.id);
                 if (cashFlowIndex > -1) {
                     data.cashFlow[cashFlowIndex].description = expense.description;
                     data.cashFlow[cashFlowIndex].amount = expense.amount;
                     data.cashFlow[cashFlowIndex].date = expense.date;
                 }
            }
        } else {
            expense.id = Utils.generateId();
            expense.createdAt = new Date().toISOString();
            data.expenses.push(expense);
            data.cashFlow.push({
                id: Utils.generateId(), description: expense.description, type: 'expense',
                amount: expense.amount, date: expense.date, category: 'expenses',
                expenseId: expense.id, createdAt: new Date().toISOString()
            });
        }
        return this.saveAllData(data);
    }
    
    deleteExpense(expenseId) {
        const data = this.getAllData();
        data.expenses = data.expenses.filter(e => e.id !== expenseId);
        data.cashFlow = data.cashFlow.filter(c => c.expenseId !== expenseId);
        return this.saveAllData(data);
    }

    markReceivableAsPaid(receivableId) {
        const data = this.getAllData();
        const index = data.receivables.findIndex(r => r.id === receivableId);
        if (index > -1) {
            data.receivables[index].status = 'paid';
            data.receivables[index].paidAt = new Date().toISOString();
            data.cashFlow.push({
                id: Utils.generateId(), description: data.receivables[index].description,
                type: 'income', amount: data.receivables[index].amount, date: new Date().toISOString(),
                category: 'receivables', receivableId, createdAt: new Date().toISOString()
            });
            return this.saveAllData(data);
        }
        return false;
    }

    saveReceivable(receivable) {
        const data = this.getAllData();
        if (receivable.id) {
            const index = data.receivables.findIndex(r => r.id === receivable.id);
            if(index > -1) data.receivables[index] = {...data.receivables[index], ...receivable, updatedAt: new Date().toISOString()};
        } else {
            receivable.id = Utils.generateId();
            receivable.createdAt = new Date().toISOString();
            data.receivables.push(receivable);
        }
        return this.saveAllData(data);
    }
    
    deleteReceivable(receivableId){
        const data = this.getAllData();
        data.receivables = data.receivables.filter(r => r.id !== receivableId);
        return this.saveAllData(data);
    }
    
    // Backup and Restore
    exportBackup() {
        const data = this.getAllData();
        return JSON.stringify({...data, exportedAt: new Date().toISOString(), exportedBy: `SGI v${this.version}`}, null, 2);
    }

    importBackup(backupDataString) {
        try {
            const data = JSON.parse(backupDataString);
            if (!data.version) throw new Error('Arquivo de backup inválido.');
            this.saveAllData(data);
            return true;
        } catch(error) {
            console.error('Error importing backup:', error);
            return false;
        }
    }

    getStorageSize() {
        return new Blob([JSON.stringify(localStorage)]).size;
    }
    
    getStatistics() {
        const data = this.getAllData();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthSales = data.sales.filter(s => {
            const saleDate = new Date(s.createdAt);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        });
        const currentMonthExpenses = data.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });

        const overdueReceivables = data.receivables.filter(r => r.status === 'pending' && Utils.isOverdue(r.dueDate));
        const lowStockThreshold = data.settings.lowStockAlert || 5;

        return {
            totalClients: data.clients.length,
            totalProducts: data.products.length,
            totalSales: data.sales.length,
            currentBalance: data.cashFlow.reduce((bal, entry) => entry.type === 'income' ? bal + entry.amount : bal - entry.amount, 0),
            monthlyRevenue: currentMonthSales.reduce((sum, sale) => sum + sale.total, 0),
            monthlyExpenses: currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
            totalReceivables: data.receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
            overdueReceivables: overdueReceivables.length,
            lowStockProducts: data.products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length
        };
    }
}

// Make a single instance available globally
window.StorageManager = new StorageManager();
