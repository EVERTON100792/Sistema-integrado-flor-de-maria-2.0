// Reports Module
class Reports {
    constructor() {
        this.currentTab = 'sales-report';
        this.reportData = null;
        this.charts = {};
        this.filters = {
            startDate: '',
            endDate: '',
            clientId: '',
            productId: '',
            category: '',
            status: ''
        };
        
        this.init();
    }

    // Initialize reports module
    init() {
        this.bindEvents();
        this.setupDateFilters();
        this.showReport(this.currentTab);
    }

    // Bind events
    bindEvents() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.showReport(tabId);
            });
        });

        // Generate report button
        const generateBtn = document.getElementById('generate-report-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateCurrentReport();
            });
        }

        // Date filters
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', (e) => {
                this.filters.startDate = e.target.value;
            });
        }

        if (endDateInput) {
            endDateInput.addEventListener('change', (e) => {
                this.filters.endDate = e.target.value;
            });
        }
    }

    // Setup default date filters
    setupDateFilters() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');

        if (startDateInput) {
            startDateInput.value = startDate.toISOString().split('T')[0];
            this.filters.startDate = startDateInput.value;
        }

        if (endDateInput) {
            endDateInput.value = endDate.toISOString().split('T')[0];
            this.filters.endDate = endDateInput.value;
        }
    }

    // Show specific report tab
    showReport(tabId) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentTab = tabId;
        this.setupReportFilters(tabId);
        this.generateCurrentReport();
    }

    // Setup report-specific filters
    setupReportFilters(tabId) {
        const filtersContainer = document.querySelector('.report-filters');
        if (!filtersContainer) return;

        // Clear existing filters except date filters
        const existingFilters = filtersContainer.querySelectorAll('.additional-filter');
        existingFilters.forEach(filter => filter.remove());

        // Add report-specific filters
        let additionalFilters = '';

        switch (tabId) {
            case 'receivables-report':
                const clients = StorageManager.getClients();
                additionalFilters = `
                    <div class="form-group additional-filter">
                        <label>Cliente</label>
                        <select id="client-filter" class="form-control">
                            <option value="">Todos os clientes</option>
                            ${clients.map(client => `
                                <option value="${client.id}">${Utils.sanitizeHtml(client.name)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group additional-filter">
                        <label>Status</label>
                        <select id="status-filter" class="form-control">
                            <option value="">Todos</option>
                            <option value="pending">Pendentes</option>
                            <option value="paid">Pagas</option>
                            <option value="overdue">Vencidas</option>
                        </select>
                    </div>
                `;
                break;

            case 'products-report':
            case 'inventory-report':
                const products = StorageManager.getProducts();
                const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
                additionalFilters = `
                    <div class="form-group additional-filter">
                        <label>Categoria</label>
                        <select id="category-filter" class="form-control">
                            <option value="">Todas as categorias</option>
                            ${categories.map(category => `
                                <option value="${category}">${Utils.sanitizeHtml(category)}</option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;

            case 'inventory-report':
                additionalFilters += `
                    <div class="form-group additional-filter">
                        <label>Status do Estoque</label>
                        <select id="stock-status-filter" class="form-control">
                            <option value="">Todos</option>
                            <option value="available">Disponível</option>
                            <option value="low">Estoque Baixo</option>
                            <option value="out">Esgotado</option>
                        </select>
                    </div>
                `;
                break;
        }

        if (additionalFilters) {
            filtersContainer.insertAdjacentHTML('beforeend', additionalFilters);
            this.bindAdditionalFilters();
        }
    }

    // Bind additional filter events
    bindAdditionalFilters() {
        const clientFilter = document.getElementById('client-filter');
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        const stockStatusFilter = document.getElementById('stock-status-filter');

        if (clientFilter) {
            clientFilter.addEventListener('change', (e) => {
                this.filters.clientId = e.target.value;
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
            });
        }

        if (stockStatusFilter) {
            stockStatusFilter.addEventListener('change', (e) => {
                this.filters.stockStatus = e.target.value;
            });
        }
    }

    // Generate current report
    generateCurrentReport() {
        const loadingId = app.showLoading('Gerando relatório...');

        try {
            switch (this.currentTab) {
                case 'sales-report':
                    this.generateSalesReport();
                    break;
                case 'receivables-report':
                    this.generateReceivablesReport();
                    break;
                case 'profitability-report':
                    this.generateProfitabilityReport();
                    break;
                case 'products-report':
                    this.generateProductsReport();
                    break;
                case 'inventory-report':
                    this.generateInventoryReport();
                    break;
                case 'cashflow-report':
                    this.generateCashFlowReport();
                    break;
                default:
                    this.generateSalesReport();
            }
        } catch (error) {
            Notifications.error('Erro ao gerar relatório: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Generate sales report
    generateSalesReport() {
        const sales = this.getFilteredSales();
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
        const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

        // Group by payment method
        const paymentMethods = {};
        sales.forEach(sale => {
            const method = this.getPaymentMethodText(sale.paymentMethod);
            paymentMethods[method] = (paymentMethods[method] || 0) + sale.total;
        });

        // Group by day
        const dailySales = {};
        sales.forEach(sale => {
            const date = sale.createdAt.split('T')[0];
            dailySales[date] = (dailySales[date] || 0) + sale.total;
        });

        this.reportData = {
            sales,
            summary: {
                totalSales: sales.length,
                totalRevenue,
                averageTicket,
                period: this.getFilterPeriodText()
            },
            paymentMethods,
            dailySales
        };

        this.renderSalesReport();
    }

    // Render sales report
    renderSalesReport() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        const { sales, summary, paymentMethods, dailySales } = this.reportData;

        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Relatório de Vendas</h3>
                <div class="report-actions">
                    <button class="btn btn-secondary" onclick="reports.printReport()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn btn-primary" onclick="reports.exportReport()">
                        <i class="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total de Vendas</h4>
                        <p class="summary-value">${summary.totalSales}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Faturamento Total</h4>
                        <p class="summary-value">${Utils.formatCurrency(summary.totalRevenue)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Ticket Médio</h4>
                        <p class="summary-value">${Utils.formatCurrency(summary.averageTicket)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Período</h4>
                        <p class="summary-value">${summary.period}</p>
                    </div>
                </div>
            </div>

            <div class="report-charts">
                <div class="chart-container">
                    <h4>Vendas por Forma de Pagamento</h4>
                    <canvas id="payment-methods-report-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Vendas Diárias</h4>
                    <canvas id="daily-sales-chart"></canvas>
                </div>
            </div>

            <div class="report-table">
                <h4>Detalhes das Vendas</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Forma de Pagamento</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.map(sale => {
                                const client = sale.clientId ? this.getClientName(sale.clientId) : 'Não informado';
                                return `
                                    <tr>
                                        <td>${Utils.formatDateTime(sale.createdAt)}</td>
                                        <td>${Utils.sanitizeHtml(client)}</td>
                                        <td>${this.getPaymentMethodText(sale.paymentMethod)}</td>
                                        <td>${Utils.formatCurrency(sale.total)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Create charts
        setTimeout(() => {
            this.createPaymentMethodsChart(paymentMethods);
            this.createDailySalesChart(dailySales);
        }, 100);
    }

    // Generate receivables report
    generateReceivablesReport() {
        const receivables = this.getFilteredReceivables();
        const totalAmount = receivables.reduce((sum, r) => sum + r.amount, 0);
        const pendingAmount = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
        const paidAmount = receivables.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
        const overdueAmount = receivables.filter(r => r.status === 'pending' && Utils.isOverdue(r.dueDate)).reduce((sum, r) => sum + r.amount, 0);

        this.reportData = {
            receivables,
            summary: {
                totalCount: receivables.length,
                totalAmount,
                pendingAmount,
                paidAmount,
                overdueAmount,
                period: this.getFilterPeriodText()
            }
        };

        this.renderReceivablesReport();
    }

    // Render receivables report
    renderReceivablesReport() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        const { receivables, summary } = this.reportData;

        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Relatório de Contas a Receber</h3>
                <div class="report-actions">
                    <button class="btn btn-secondary" onclick="reports.printReport()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn btn-primary" onclick="reports.exportReport()">
                        <i class="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total de Contas</h4>
                        <p class="summary-value">${summary.totalCount}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Valor Total</h4>
                        <p class="summary-value">${Utils.formatCurrency(summary.totalAmount)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Pendente</h4>
                        <p class="summary-value">${Utils.formatCurrency(summary.pendingAmount)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Vencidas</h4>
                        <p class="summary-value text-danger">${Utils.formatCurrency(summary.overdueAmount)}</p>
                    </div>
                </div>
            </div>

            <div class="report-table">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Descrição</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${receivables.map(receivable => {
                                const isOverdue = Utils.isOverdue(receivable.dueDate) && receivable.status === 'pending';
                                return `
                                    <tr class="${isOverdue ? 'overdue-row' : ''}">
                                        <td>${Utils.sanitizeHtml(this.getClientName(receivable.clientId))}</td>
                                        <td>${Utils.sanitizeHtml(receivable.description)}</td>
                                        <td>${Utils.formatDate(receivable.dueDate)}</td>
                                        <td>${Utils.formatCurrency(receivable.amount)}</td>
                                        <td>
                                            <span class="status-badge status-${receivable.status} ${isOverdue ? 'overdue' : ''}">
                                                ${receivable.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Generate profitability report
    generateProfitabilityReport() {
        const sales = this.getFilteredSales();
        let totalRevenue = 0;
        let totalCost = 0;
        const products = StorageManager.getProducts();

        sales.forEach(sale => {
            totalRevenue += sale.total;
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    totalCost += product.costPrice * item.quantity;
                }
            });
        });

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        this.reportData = {
            sales,
            summary: {
                totalRevenue,
                totalCost,
                grossProfit,
                profitMargin,
                salesCount: sales.length,
                period: this.getFilterPeriodText()
            }
        };

        this.renderProfitabilityReport();
    }

    // Render profitability report
    renderProfitabilityReport() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        const { summary } = this.reportData;

        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Relatório de Lucratividade</h3>
                <div class="report-actions">
                    <button class="btn btn-secondary" onclick="reports.printReport()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn btn-primary" onclick="reports.exportReport()">
                        <i class="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Receita Total</h4>
                        <p class="summary-value">${Utils.formatCurrency(summary.totalRevenue)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Custo Total</h4>
                        <p class="summary-value text-danger">${Utils.formatCurrency(summary.totalCost)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Lucro Bruto</h4>
                        <p class="summary-value ${summary.grossProfit >= 0 ? 'text-success' : 'text-danger'}">
                            ${Utils.formatCurrency(summary.grossProfit)}
                        </p>
                    </div>
                    <div class="summary-card">
                        <h4>Margem de Lucro</h4>
                        <p class="summary-value ${summary.profitMargin >= 0 ? 'text-success' : 'text-danger'}">
                            ${summary.profitMargin.toFixed(2)}%
                        </p>
                    </div>
                </div>
            </div>

            <div class="profitability-analysis">
                <h4>Análise de Lucratividade</h4>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <strong>Vendas no Período:</strong>
                        <span>${summary.salesCount}</span>
                    </div>
                    <div class="analysis-item">
                        <strong>Lucro por Venda:</strong>
                        <span>${summary.salesCount > 0 ? Utils.formatCurrency(summary.grossProfit / summary.salesCount) : 'R$ 0,00'}</span>
                    </div>
                    <div class="analysis-item">
                        <strong>Período:</strong>
                        <span>${summary.period}</span>
                    </div>
                </div>
                
                <div class="profit-recommendations">
                    <h5>Recomendações:</h5>
                    <ul>
                        ${summary.profitMargin < 20 ? '<li class="text-warning">⚠️ Margem de lucro baixa. Considere revisar preços ou reduzir custos.</li>' : ''}
                        ${summary.profitMargin >= 20 && summary.profitMargin < 40 ? '<li class="text-info">ℹ️ Margem de lucro aceitável. Monitore regularmente.</li>' : ''}
                        ${summary.profitMargin >= 40 ? '<li class="text-success">✅ Excelente margem de lucro!</li>' : ''}
                        ${summary.grossProfit < 0 ? '<li class="text-danger">🚨 Prejuízo detectado! Revise urgentemente custos e preços.</li>' : ''}
                    </ul>
                </div>
            </div>
        `;
    }

    // Generate products report (most sold)
    generateProductsReport() {
        const sales = this.getFilteredSales();
        const productSales = {};

        // Aggregate product sales
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productId: item.productId,
                        productName: item.productName,
                        productCode: item.productCode,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        salesCount: 0
                    };
                }
                
                productSales[item.productId].totalQuantity += item.quantity;
                productSales[item.productId].totalRevenue += item.total;
                productSales[item.productId].salesCount += 1;
            });
        });

        // Convert to array and sort by quantity
        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.totalQuantity - a.totalQuantity);

        this.reportData = {
            products: sortedProducts,
            summary: {
                totalProducts: sortedProducts.length,
                totalQuantitySold: sortedProducts.reduce((sum, p) => sum + p.totalQuantity, 0),
                totalRevenue: sortedProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
                period: this.getFilterPeriodText()
            }
        };

        this.renderProductsReport();
    }

    // Render products report
    renderProductsReport() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        const { products, summary } = this.reportData;

        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Relatório de Produtos Mais Vendidos</h3>
                <div class="report-actions">
                    <button class="btn btn-secondary" onclick="reports.printReport()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn btn-primary" onclick="reports.exportReport()">
                        <i class="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Produtos Vendidos</h4>
                        <p class="summary-value">${summary.totalProducts}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Quantidade Total</h4>
                        <p class="summary-value">${summary.totalQuantitySold}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Receita Total</h4>
                        <p class="summary-value">${Utils.formatCurrency(summary.totalRevenue)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Período</h4>
                        <p class="summary-value">${summary.period}</p>
                    </div>
                </div>
            </div>

            <div class="report-table">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Posição</th>
                                <th>Produto</th>
                                <th>Código</th>
                                <th>Quantidade Vendida</th>
                                <th>Receita</th>
                                <th>Vendas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map((product, index) => `
                                <tr>
                                    <td><strong>${index + 1}º</strong></td>
                                    <td>${Utils.sanitizeHtml(product.productName)}</td>
                                    <td>${Utils.sanitizeHtml(product.productCode)}</td>
                                    <td>${product.totalQuantity}</td>
                                    <td>${Utils.formatCurrency(product.totalRevenue)}</td>
                                    <td>${product.salesCount}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Generate inventory report
    generateInventoryReport() {
        let products = StorageManager.getProducts();
        
        // Apply category filter
        if (this.filters.category) {
            products = products.filter(p => p.category === this.filters.category);
        }

        // Apply stock status filter
        if (this.filters.stockStatus) {
            const lowStockThreshold = StorageManager.getSettings().lowStockAlert || 5;
            products = products.filter(product => {
                switch (this.filters.stockStatus) {
                    case 'available':
                        return product.quantity > 0;
                    case 'low':
                        return product.quantity > 0 && product.quantity <= lowStockThreshold;
                    case 'out':
                        return product.quantity === 0;
                    default:
                        return true;
                }
            });
        }

        const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.salePrice), 0);
        const totalCost = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
        const lowStockThreshold = StorageManager.getSettings().lowStockAlert || 5;

        this.reportData = {
            products,
            summary: {
                totalProducts: products.length,
                totalValue,
                totalCost,
                outOfStock: products.filter(p => p.quantity === 0).length,
                lowStock: products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length
            }
        };

        this.renderInventoryReport();
    }

    // Render inventory report
    renderInventoryReport() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        const { products, summary } = this.reportData;
        const lowStockThreshold = StorageManager.getSettings().lowStockAlert || 5;

        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Relatório de Estoque</h3>
                <div class="report-actions">
                    <button class="btn btn-secondary" onclick="reports.printReport()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn btn-primary" onclick="reports.exportReport()">
                        <i class="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total de Produtos</h4>
                        <p class="summary-value">${summary.totalProducts}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Valor do Estoque</h4>
                        <p class="summary-value">${Utils.formatCurrency(summary.totalValue)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Estoque Baixo</h4>
                        <p class="summary-value text-warning">${summary.lowStock}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Esgotados</h4>
                        <p class="summary-value text-danger">${summary.outOfStock}</p>
                    </div>
                </div>
            </div>

            <div class="report-table">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Produto</th>
                                <th>Categoria</th>
                                <th>Quantidade</th>
                                <th>Preço Venda</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(product => {
                                const status = product.quantity === 0 ? 'Esgotado' : 
                                              product.quantity <= lowStockThreshold ? 'Baixo' : 'Disponível';
                                const statusClass = product.quantity === 0 ? 'status-out-of-stock' : 
                                                   product.quantity <= lowStockThreshold ? 'status-low' : 'status-available';
                                
                                return `
                                    <tr>
                                        <td>${Utils.sanitizeHtml(product.code)}</td>
                                        <td>${Utils.sanitizeHtml(product.name)}</td>
                                        <td>${Utils.sanitizeHtml(product.category || 'Sem categoria')}</td>
                                        <td>${product.quantity}</td>
                                        <td>${Utils.formatCurrency(product.salePrice)}</td>
                                        <td>${Utils.formatCurrency(product.quantity * product.salePrice)}</td>
                                        <td>
                                            <span class="status-badge ${statusClass}">
                                                ${status}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Generate cash flow report
    generateCashFlowReport() {
        const cashFlow = this.getFilteredCashFlow();
        const totalIncome = cashFlow.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const totalExpense = cashFlow.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const netFlow = totalIncome - totalExpense;

        this.reportData = {
            cashFlow,
            summary: {
                totalEntries: cashFlow.length,
                totalIncome,
                totalExpense,
                netFlow,
                period: this.getFilterPeriodText()
            }
        };

        this.renderCashFlowReport();
    }

    // Render cash flow report
    renderCashFlowReport() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        const { cashFlow, summary } = this.reportData;

        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Relatório de Fluxo de Caixa</h3>
                <div class="report-actions">
                    <button class="btn btn-secondary" onclick="reports.printReport()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn btn-primary" onclick="reports.exportReport()">
                        <i class="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total de Entradas</h4>
                        <p class="summary-value text-success">${Utils.formatCurrency(summary.totalIncome)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Total de Saídas</h4>
                        <p class="summary-value text-danger">${Utils.formatCurrency(summary.totalExpense)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Fluxo Líquido</h4>
                        <p class="summary-value ${summary.netFlow >= 0 ? 'text-success' : 'text-danger'}">
                            ${Utils.formatCurrency(summary.netFlow)}
                        </p>
                    </div>
                    <div class="summary-card">
                        <h4>Período</h4>
                        <p class="summary-value">${summary.period}</p>
                    </div>
                </div>
            </div>

            <div class="report-table">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cashFlow.map(entry => `
                                <tr>
                                    <td>${Utils.formatDate(entry.date)}</td>
                                    <td>${Utils.sanitizeHtml(entry.description)}</td>
                                    <td>${Utils.sanitizeHtml(entry.category || 'Sem categoria')}</td>
                                    <td>
                                        <span class="type-badge type-${entry.type}">
                                            ${entry.type === 'income' ? 'Entrada' : 'Saída'}
                                        </span>
                                    </td>
                                    <td class="amount-cell ${entry.type}">
                                        ${entry.type === 'income' ? '+' : '-'} ${Utils.formatCurrency(entry.amount)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Helper methods for filtering data
    getFilteredSales() {
        let sales = StorageManager.getSales();
        
        if (this.filters.startDate) {
            sales = sales.filter(sale => sale.createdAt >= this.filters.startDate);
        }
        
        if (this.filters.endDate) {
            const endDate = new Date(this.filters.endDate);
            endDate.setDate(endDate.getDate() + 1);
            sales = sales.filter(sale => sale.createdAt < endDate.toISOString());
        }
        
        return sales;
    }

    getFilteredReceivables() {
        let receivables = StorageManager.getReceivables();
        
        if (this.filters.startDate) {
            receivables = receivables.filter(r => r.dueDate >= this.filters.startDate);
        }
        
        if (this.filters.endDate) {
            const endDate = new Date(this.filters.endDate);
            endDate.setDate(endDate.getDate() + 1);
            receivables = receivables.filter(r => r.dueDate < endDate.toISOString());
        }
        
        if (this.filters.clientId) {
            receivables = receivables.filter(r => r.clientId === this.filters.clientId);
        }
        
        if (this.filters.status) {
            if (this.filters.status === 'overdue') {
                receivables = receivables.filter(r => r.status === 'pending' && Utils.isOverdue(r.dueDate));
            } else {
                receivables = receivables.filter(r => r.status === this.filters.status);
            }
        }
        
        return receivables;
    }

    getFilteredCashFlow() {
        let cashFlow = StorageManager.getCashFlow();
        
        if (this.filters.startDate) {
            cashFlow = cashFlow.filter(entry => entry.date >= this.filters.startDate);
        }
        
        if (this.filters.endDate) {
            const endDate = new Date(this.filters.endDate);
            endDate.setDate(endDate.getDate() + 1);
            cashFlow = cashFlow.filter(entry => entry.date < endDate.toISOString());
        }
        
        return cashFlow;
    }

    // Helper methods
    getClientName(clientId) {
        const clients = StorageManager.getClients();
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : 'Cliente não encontrado';
    }

    getPaymentMethodText(method) {
        const methods = {
            'cash': 'À Vista',
            'pix': 'PIX',
            'credit': 'Crediário',
            'card': 'Cartão de Crédito'
        };
        return methods[method] || method;
    }

    getFilterPeriodText() {
        if (this.filters.startDate && this.filters.endDate) {
            return `${Utils.formatDate(this.filters.startDate)} até ${Utils.formatDate(this.filters.endDate)}`;
        } else if (this.filters.startDate) {
            return `A partir de ${Utils.formatDate(this.filters.startDate)}`;
        } else if (this.filters.endDate) {
            return `Até ${Utils.formatDate(this.filters.endDate)}`;
        }
        return 'Todos os períodos';
    }

    // Chart creation methods
    createPaymentMethodsChart(data) {
        const ctx = document.getElementById('payment-methods-report-chart');
        if (!ctx || !data) return;

        // Destroy existing chart
        if (this.charts.paymentMethods) {
            this.charts.paymentMethods.destroy();
        }

        const labels = Object.keys(data);
        const values = Object.values(data);

        this.charts.paymentMethods = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#E6B800',
                        '#51CF66',
                        '#74C0FC',
                        '#FFD43B'
                    ],
                    borderColor: '#1e1e1e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f5f5f5'
                        }
                    }
                }
            }
        });
    }

    createDailySalesChart(data) {
        const ctx = document.getElementById('daily-sales-chart');
        if (!ctx || !data) return;

        // Destroy existing chart
        if (this.charts.dailySales) {
            this.charts.dailySales.destroy();
        }

        const labels = Object.keys(data).sort();
        const values = labels.map(label => data[label]);

        this.charts.dailySales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(date => Utils.formatDate(date)),
                datasets: [{
                    label: 'Vendas',
                    data: values,
                    borderColor: '#E6B800',
                    backgroundColor: 'rgba(230, 184, 0, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
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

    // Export and print methods
    printReport() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório - Flor de Maria</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        color: #000;
                    }
                    .report-header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        border-bottom: 2px solid #E6B800;
                        padding-bottom: 15px;
                    }
                    .summary-cards { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 15px; 
                        margin: 20px 0; 
                    }
                    .summary-card { 
                        border: 1px solid #ddd; 
                        padding: 15px; 
                        text-align: center;
                        background: #f9f9f9;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0; 
                    }
                    th, td { 
                        padding: 8px; 
                        text-align: left; 
                        border-bottom: 1px solid #ddd; 
                    }
                    th { 
                        background-color: #E6B800; 
                        color: #000;
                        font-weight: bold;
                    }
                    .report-actions { display: none; }
                    .text-success { color: #28a745; }
                    .text-danger { color: #dc3545; }
                    .text-warning { color: #ffc107; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>Flor de Maria - Sistema de Gestão</h1>
                    <h2>${document.querySelector('.report-header h3').textContent}</h2>
                    <p>Gerado em: ${Utils.formatDateTime(new Date())}</p>
                </div>
                ${reportContent.innerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    exportReport() {
        if (!this.reportData) {
            Notifications.error('Nenhum relatório gerado para exportar');
            return;
        }

        let csvContent = '';
        let filename = '';

        switch (this.currentTab) {
            case 'sales-report':
                csvContent = this.generateSalesCSV();
                filename = 'relatorio_vendas';
                break;
            case 'receivables-report':
                csvContent = this.generateReceivablesCSV();
                filename = 'relatorio_contas_receber';
                break;
            case 'profitability-report':
                csvContent = this.generateProfitabilityCSV();
                filename = 'relatorio_lucratividade';
                break;
            case 'products-report':
                csvContent = this.generateProductsCSV();
                filename = 'relatorio_produtos_vendidos';
                break;
            case 'inventory-report':
                csvContent = this.generateInventoryCSV();
                filename = 'relatorio_estoque';
                break;
            case 'cashflow-report':
                csvContent = this.generateCashFlowCSV();
                filename = 'relatorio_fluxo_caixa';
                break;
        }

        if (csvContent) {
            const finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
            Utils.downloadFile(csvContent, finalFilename, 'text/csv');
            Notifications.success('Relatório exportado com sucesso!');
        }
    }

    // CSV generation methods
    generateSalesCSV() {
        let csv = 'Data,Cliente,Forma Pagamento,Valor\n';
        this.reportData.sales.forEach(sale => {
            const client = sale.clientId ? this.getClientName(sale.clientId) : 'Não informado';
            csv += `"${Utils.formatDateTime(sale.createdAt)}","${client}","${this.getPaymentMethodText(sale.paymentMethod)}","${sale.total}"\n`;
        });
        return csv;
    }

    generateReceivablesCSV() {
        let csv = 'Cliente,Descrição,Vencimento,Valor,Status\n';
        this.reportData.receivables.forEach(receivable => {
            const isOverdue = Utils.isOverdue(receivable.dueDate) && receivable.status === 'pending';
            const status = receivable.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente';
            csv += `"${this.getClientName(receivable.clientId)}","${receivable.description}","${Utils.formatDate(receivable.dueDate)}","${receivable.amount}","${status}"\n`;
        });
        return csv;
    }

    generateProfitabilityCSV() {
        const { summary } = this.reportData;
        let csv = 'Métrica,Valor\n';
        csv += `"Receita Total","${summary.totalRevenue}"\n`;
        csv += `"Custo Total","${summary.totalCost}"\n`;
        csv += `"Lucro Bruto","${summary.grossProfit}"\n`;
        csv += `"Margem de Lucro","${summary.profitMargin}%"\n`;
        csv += `"Vendas no Período","${summary.salesCount}"\n`;
        return csv;
    }

    generateProductsCSV() {
        let csv = 'Posição,Produto,Código,Quantidade Vendida,Receita,Vendas\n';
        this.reportData.products.forEach((product, index) => {
            csv += `"${index + 1}","${product.productName}","${product.productCode}","${product.totalQuantity}","${product.totalRevenue}","${product.salesCount}"\n`;
        });
        return csv;
    }

    generateInventoryCSV() {
        let csv = 'Código,Produto,Categoria,Quantidade,Preço Venda,Valor Total,Status\n';
        const lowStockThreshold = StorageManager.getSettings().lowStockAlert || 5;
        
        this.reportData.products.forEach(product => {
            const status = product.quantity === 0 ? 'Esgotado' : 
                          product.quantity <= lowStockThreshold ? 'Baixo' : 'Disponível';
            csv += `"${product.code}","${product.name}","${product.category || 'Sem categoria'}","${product.quantity}","${product.salePrice}","${product.quantity * product.salePrice}","${status}"\n`;
        });
        return csv;
    }

    generateCashFlowCSV() {
        let csv = 'Data,Descrição,Categoria,Tipo,Valor\n';
        this.reportData.cashFlow.forEach(entry => {
            const type = entry.type === 'income' ? 'Entrada' : 'Saída';
            csv += `"${Utils.formatDate(entry.date)}","${entry.description}","${entry.category || 'Sem categoria'}","${type}","${entry.amount}"\n`;
        });
        return csv;
    }

    // Refresh module
    refresh() {
        this.generateCurrentReport();
    }

    // Search functionality
    search(query) {
        // Reports module doesn't have a global search, but could be implemented per report type
        Notifications.info('Use os filtros para refinar os relatórios');
    }

    // Cleanup charts on module change
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Add custom styles for reports
const reportsStyles = document.createElement('style');
reportsStyles.textContent = `
    .report-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 2px solid var(--color-primary);
    }
    
    .report-actions {
        display: flex;
        gap: var(--spacing-sm);
    }
    
    .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
    }
    
    .summary-card {
        background: linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-surface) 100%);
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        text-align: center;
    }
    
    .summary-card h4 {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-sm);
        font-size: 0.9rem;
    }
    
    .summary-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-primary);
        margin: 0;
    }
    
    .report-charts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
    }
    
    .chart-container {
        background: var(--color-bg-card);
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
    }
    
    .chart-container h4 {
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
        text-align: center;
    }
    
    .report-table {
        margin-top: var(--spacing-lg);
    }
    
    .report-table h4 {
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
    }
    
    .profitability-analysis {
        background: var(--color-bg-card);
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        margin-top: var(--spacing-lg);
    }
    
    .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
    }
    
    .analysis-item {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-sm);
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);
    }
    
    .profit-recommendations {
        margin-top: var(--spacing-lg);
    }
    
    .profit-recommendations h5 {
        color: var(--color-primary);
        margin-bottom: var(--spacing-sm);
    }
    
    .profit-recommendations ul {
        list-style: none;
        padding: 0;
    }
    
    .profit-recommendations li {
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
        border-radius: var(--radius-md);
        background: var(--color-bg-tertiary);
    }
    
    .overdue-row {
        background: rgba(255, 107, 107, 0.1);
    }
    
    @media (max-width: 768px) {
        .report-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
        }
        
        .report-charts {
            grid-template-columns: 1fr;
        }
        
        .summary-cards {
            grid-template-columns: 1fr;
        }
        
        .analysis-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(reportsStyles);

// Initialize and export
window.Reports = Reports;
