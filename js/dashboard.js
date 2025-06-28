// Dashboard Module
class Dashboard {
    constructor() {
        this.paymentMethodChart = null;
        this.salesTrendChart = null;
        this.refreshInterval = null;
        
        this.init();
    }

    // Initialize dashboard
    init() {
        this.bindEvents();
        this.setupCharts();
        this.startAutoRefresh();
    }

    // Bind dashboard events
    bindEvents() {
        // Refresh button (if exists)
        const refreshBtn = document.querySelector('#dashboard-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refresh();
            });
        }

        // Summary card click events for navigation
        this.bindSummaryCardNavigation();
    }

    // Bind summary card navigation
    bindSummaryCardNavigation() {
        const cashBalanceCard = document.querySelector('#cash-balance').closest('.summary-card');
        const receivablesCard = document.querySelector('#total-receivables').closest('.summary-card');
        const expensesCard = document.querySelector('#monthly-expenses').closest('.summary-card');
        const salesCard = document.querySelector('#monthly-sales').closest('.summary-card');

        if (cashBalanceCard) {
            cashBalanceCard.style.cursor = 'pointer';
            cashBalanceCard.addEventListener('click', () => {
                window.app.showModule('cashflow');
            });
        }

        if (receivablesCard) {
            receivablesCard.style.cursor = 'pointer';
            receivablesCard.addEventListener('click', () => {
                window.app.showModule('receivables');
            });
        }

        if (expensesCard) {
            expensesCard.style.cursor = 'pointer';
            expensesCard.addEventListener('click', () => {
                window.app.showModule('expenses');
            });
        }

        if (salesCard) {
            salesCard.style.cursor = 'pointer';
            salesCard.addEventListener('click', () => {
                window.app.showModule('sales');
            });
        }
    }

    // Setup charts
    setupCharts() {
        this.createPaymentMethodChart();
        this.createSalesTrendChart();
    }

    // Create payment method chart
    createPaymentMethodChart() {
        const ctx = document.getElementById('payment-methods-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.paymentMethodChart) {
            this.paymentMethodChart.destroy();
        }

        const data = this.getPaymentMethodData();

        this.paymentMethodChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#E6B800', // Gold - Cash
                        '#51CF66', // Green - PIX
                        '#74C0FC', // Blue - Credit
                        '#FFD43B'  // Yellow - Card
                    ],
                    borderColor: '#1e1e1e',
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f5f5f5',
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#2a2a2a',
                        titleColor: '#f5f5f5',
                        bodyColor: '#f5f5f5',
                        borderColor: '#E6B800',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = Utils.formatCurrency(context.raw);
                                const percentage = ((context.raw / data.total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    }

    // Create sales trend chart (additional chart)
    createSalesTrendChart() {
        // Add a canvas for sales trend if not exists
        let trendContainer = document.querySelector('#sales-trend-container');
        if (!trendContainer) {
            const chartsContainer = document.querySelector('.dashboard-charts');
            if (chartsContainer) {
                const trendCard = document.createElement('div');
                trendCard.className = 'card chart-card';
                trendCard.innerHTML = `
                    <div class="card-header">
                        <h3>Vendas dos Últimos 7 Dias</h3>
                    </div>
                    <div class="card-content">
                        <canvas id="sales-trend-chart"></canvas>
                    </div>
                `;
                chartsContainer.appendChild(trendCard);
            }
        }

        const ctx = document.getElementById('sales-trend-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.salesTrendChart) {
            this.salesTrendChart.destroy();
        }

        const data = this.getSalesTrendData();

        this.salesTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Vendas',
                    data: data.values,
                    borderColor: '#E6B800',
                    backgroundColor: 'rgba(230, 184, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#E6B800',
                    pointBorderColor: '#1e1e1e',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#2a2a2a',
                        titleColor: '#f5f5f5',
                        bodyColor: '#f5f5f5',
                        borderColor: '#E6B800',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Vendas: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#333333'
                        },
                        ticks: {
                            color: '#cccccc'
                        }
                    },
                    y: {
                        grid: {
                            color: '#333333'
                        },
                        ticks: {
                            color: '#cccccc',
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Get payment method data
    getPaymentMethodData() {
        const sales = StorageManager.getSales();
        const paymentMethods = {
            'À Vista': 0,
            'PIX': 0,
            'Crediário': 0,
            'Cartão': 0
        };

        const methodMap = {
            'cash': 'À Vista',
            'pix': 'PIX',
            'credit': 'Crediário',
            'card': 'Cartão'
        };

        sales.forEach(sale => {
            const method = methodMap[sale.paymentMethod] || 'Outros';
            if (paymentMethods.hasOwnProperty(method)) {
                paymentMethods[method] += sale.total;
            }
        });

        const labels = Object.keys(paymentMethods);
        const values = Object.values(paymentMethods);
        const total = values.reduce((sum, value) => sum + value, 0);

        return { labels, values, total };
    }

    // Get sales trend data (last 7 days)
    getSalesTrendData() {
        const sales = StorageManager.getSales();
        const labels = [];
        const values = [];
        
        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            labels.push(Utils.formatDate(date).split('/').slice(0, 2).join('/'));
            
            const dayTotal = sales
                .filter(sale => sale.createdAt.split('T')[0] === dateStr)
                .reduce((sum, sale) => sum + sale.total, 0);
            
            values.push(dayTotal);
        }

        return { labels, values };
    }

    // Refresh dashboard data
    refresh() {
        this.updateSummaryCards();
        this.updateCharts();
        this.updateAlerts();
        
        Notifications.success('Dashboard atualizado!', {
            duration: 2000
        });
    }

    // Update summary cards
    updateSummaryCards() {
        const stats = StorageManager.getStatistics();

        // Animate number changes
        this.animateValue('#cash-balance', stats.currentBalance);
        this.animateValue('#total-receivables', stats.totalReceivables);
        this.animateValue('#monthly-expenses', stats.monthlyExpenses);
        this.animateValue('#monthly-sales', stats.monthlyRevenue);
    }

    // Animate value changes
    animateValue(selector, newValue) {
        const element = document.querySelector(selector);
        if (!element) return;

        const currentValue = Utils.parseCurrency(element.textContent);
        const startValue = currentValue;
        const endValue = newValue;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            element.textContent = Utils.formatCurrency(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Update charts
    updateCharts() {
        this.createPaymentMethodChart();
        this.createSalesTrendChart();
    }

    // Update alerts
    updateAlerts() {
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) return;

        const alerts = this.generateAlerts();
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p class="no-data">Nenhum alerta no momento</p>';
            return;
        }

        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}" data-module="${alert.module}">
                <div class="alert-icon">
                    <i class="fas ${alert.icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                </div>
                <div class="alert-action">
                    <button class="btn btn-sm btn-${alert.type}" onclick="window.app.showModule('${alert.module}')">
                        Ver
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Generate alerts
    generateAlerts() {
        const alerts = [];
        const stats = StorageManager.getStatistics();
        
        // Overdue receivables
        if (stats.overdueReceivables > 0) {
            alerts.push({
                type: 'danger',
                icon: 'fa-exclamation-triangle',
                title: 'Contas Vencidas',
                message: `${stats.overdueReceivables} conta(s) em atraso`,
                module: 'receivables'
            });
        }

        // Low stock products
        if (stats.lowStockProducts > 0) {
            alerts.push({
                type: 'warning',
                icon: 'fa-boxes',
                title: 'Estoque Baixo',
                message: `${stats.lowStockProducts} produto(s) com estoque baixo`,
                module: 'inventory'
            });
        }

        // Negative cash flow
        if (stats.currentBalance < 0) {
            alerts.push({
                type: 'danger',
                icon: 'fa-wallet',
                title: 'Saldo Negativo',
                message: `Caixa com saldo negativo: ${Utils.formatCurrency(stats.currentBalance)}`,
                module: 'cashflow'
            });
        }

        // High monthly expenses
        const expenseRatio = stats.monthlyExpenses / (stats.monthlyRevenue || 1);
        if (expenseRatio > 0.8 && stats.monthlyRevenue > 0) {
            alerts.push({
                type: 'warning',
                icon: 'fa-chart-line',
                title: 'Despesas Altas',
                message: 'Despesas representam mais de 80% da receita mensal',
                module: 'expenses'
            });
        }

        return alerts;
    }

    // Start auto refresh
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 300000);
    }

    // Stop auto refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Get dashboard statistics for export
    getStatistics() {
        return {
            summary: StorageManager.getStatistics(),
            paymentMethods: this.getPaymentMethodData(),
            salesTrend: this.getSalesTrendData(),
            alerts: this.generateAlerts()
        };
    }

    // Export dashboard data
    exportDashboard() {
        const data = this.getStatistics();
        const content = JSON.stringify(data, null, 2);
        const filename = `dashboard_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Dashboard exportado com sucesso!');
    }

    // Quick actions
    quickAddSale() {
        window.app.showModule('sales');
    }

    quickAddExpense() {
        window.app.showModule('expenses');
        // Trigger new expense form if available
        setTimeout(() => {
            const addBtn = document.getElementById('add-expense-btn');
            if (addBtn) addBtn.click();
        }, 100);
    }

    quickAddClient() {
        window.app.showModule('clients');
        // Trigger new client form if available
        setTimeout(() => {
            const addBtn = document.getElementById('add-client-btn');
            if (addBtn) addBtn.click();
        }, 100);
    }

    // Cleanup
    destroy() {
        this.stopAutoRefresh();
        
        if (this.paymentMethodChart) {
            this.paymentMethodChart.destroy();
        }
        
        if (this.salesTrendChart) {
            this.salesTrendChart.destroy();
        }
    }
}

// Add custom styles for alerts
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
    .alert {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-sm);
        border-left: 4px solid;
        transition: all var(--transition-fast);
        cursor: pointer;
    }
    
    .alert:hover {
        transform: translateX(4px);
    }
    
    .alert-danger {
        background: rgba(255, 107, 107, 0.1);
        border-left-color: var(--color-danger);
    }
    
    .alert-warning {
        background: rgba(255, 212, 59, 0.1);
        border-left-color: var(--color-warning);
    }
    
    .alert-info {
        background: rgba(116, 192, 252, 0.1);
        border-left-color: var(--color-info);
    }
    
    .alert-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .alert-danger .alert-icon {
        background: rgba(255, 107, 107, 0.2);
        color: var(--color-danger);
    }
    
    .alert-warning .alert-icon {
        background: rgba(255, 212, 59, 0.2);
        color: var(--color-warning);
    }
    
    .alert-info .alert-icon {
        background: rgba(116, 192, 252, 0.2);
        color: var(--color-info);
    }
    
    .alert-content {
        flex: 1;
    }
    
    .alert-title {
        font-weight: 600;
        color: var(--color-text-primary);
        margin-bottom: var(--spacing-xs);
    }
    
    .alert-message {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
    }
    
    .alert-action {
        flex-shrink: 0;
    }
    
    .btn-sm {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 0.8rem;
    }
`;
document.head.appendChild(dashboardStyles);

// Export Dashboard class
window.Dashboard = Dashboard;

