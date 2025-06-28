// Sales Module (Point of Sale - PDV)
class Sales {
    constructor() {
        this.cart = [];
        this.selectedClient = null;
        this.paymentMethod = 'cash';
        this.installments = 1;
        this.products = [];
        this.clients = [];
        this.filteredProducts = [];
        this.searchTerm = '';
        
        this.init();
    }

    // Initialize sales module
    init() {
        this.bindEvents();
        this.loadData();
        this.renderInterface();
    }

    // Bind events
    bindEvents() {
        // Client selection
        const clientSelect = document.getElementById('sale-client');
        if (clientSelect) {
            clientSelect.addEventListener('change', (e) => {
                this.selectedClient = e.target.value;
            });
        }

        // Product search
        const productSearch = document.getElementById('product-search');
        if (productSearch) {
            productSearch.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterProducts();
                this.renderProducts();
            }, 300));
        }

        // Payment method
        const paymentMethodSelect = document.getElementById('payment-method');
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', (e) => {
                this.paymentMethod = e.target.value;
                this.updateInstallmentsVisibility();
            });
        }

        // Installments
        const installmentsSelect = document.getElementById('installments');
        if (installmentsSelect) {
            installmentsSelect.addEventListener('change', (e) => {
                this.installments = parseInt(e.target.value);
            });
        }

        // Finalize sale
        const finalizeSaleBtn = document.getElementById('finalize-sale-btn');
        if (finalizeSaleBtn) {
            finalizeSaleBtn.addEventListener('click', () => {
                this.finalizeSale();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (app.currentModule === 'sales') {
                this.handleKeyboardShortcuts(e);
            }
        });
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // F2 - Focus product search
        if (e.key === 'F2') {
            e.preventDefault();
            document.getElementById('product-search').focus();
        }
        
        // F3 - Focus client selection
        if (e.key === 'F3') {
            e.preventDefault();
            document.getElementById('sale-client').focus();
        }
        
        // F9 - Finalize sale
        if (e.key === 'F9') {
            e.preventDefault();
            this.finalizeSale();
        }
        
        // Escape - Clear cart
        if (e.key === 'Escape' && e.ctrlKey) {
            e.preventDefault();
            this.clearCart();
        }
    }

    // Load data
    loadData() {
        this.products = StorageManager.getProducts().filter(p => p.quantity > 0);
        this.clients = StorageManager.getClients();
        this.filterProducts();
    }

    // Filter products
    filterProducts() {
        if (!this.searchTerm) {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = Utils.searchInArray(
                this.products,
                this.searchTerm,
                ['code', 'name', 'description', 'category']
            );
        }
    }

    // Render interface
    renderInterface() {
        this.renderClients();
        this.renderProducts();
        this.renderCart();
        this.updateInstallmentsVisibility();
    }

    // Render clients
    renderClients() {
        const clientSelect = document.getElementById('sale-client');
        if (!clientSelect) return;

        clientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }

    // Render products
    renderProducts() {
        const productsList = document.getElementById('products-list');
        if (!productsList) return;

        if (this.filteredProducts.length === 0) {
            productsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Nenhum produto encontrado</p>
                </div>
            `;
            return;
        }

        productsList.innerHTML = this.filteredProducts.map(product => `
            <div class="product-item" onclick="sales.addToCart('${product.id}')">
                <div class="product-info">
                    <h4>${Utils.sanitizeHtml(product.name)}</h4>
                    <p>Código: ${Utils.sanitizeHtml(product.code)} | Estoque: ${product.quantity}</p>
                    ${product.category ? `<span class="product-category">${Utils.sanitizeHtml(product.category)}</span>` : ''}
                </div>
                <div class="product-price">
                    ${Utils.formatCurrency(product.salePrice)}
                </div>
            </div>
        `).join('');
    }

    // Add product to cart
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Check if product already in cart
        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            // Check stock availability
            if (existingItem.quantity >= product.quantity) {
                Notifications.warning('Quantidade em estoque insuficiente');
                return;
            }
            existingItem.quantity += 1;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            // Add new item to cart
            this.cart.push({
                productId: product.id,
                productCode: product.code,
                productName: product.name,
                price: product.salePrice,
                quantity: 1,
                total: product.salePrice,
                availableStock: product.quantity
            });
        }

        this.renderCart();
        Notifications.success(`${product.name} adicionado ao carrinho`, {
            duration: 2000
        });
    }

    // Remove from cart
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.renderCart();
    }

    // Update cart item quantity
    updateCartQuantity(productId, quantity) {
        const item = this.cart.find(item => item.productId === productId);
        if (!item) return;

        const newQuantity = parseInt(quantity);
        
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (newQuantity > item.availableStock) {
            Notifications.warning('Quantidade maior que o estoque disponível');
            return;
        }

        item.quantity = newQuantity;
        item.total = item.quantity * item.price;
        this.renderCart();
    }

    // Render cart
    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems || !cartTotal) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Carrinho vazio</p>
                    <small>Adicione produtos para iniciar uma venda</small>
                </div>
            `;
            cartTotal.textContent = 'R$ 0,00';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h5>${Utils.sanitizeHtml(item.productName)}</h5>
                    <p>Código: ${Utils.sanitizeHtml(item.productCode)} | ${Utils.formatCurrency(item.price)}</p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="sales.updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               min="1" max="${item.availableStock}"
                               onchange="sales.updateCartQuantity('${item.productId}', this.value)">
                        <button class="quantity-btn" onclick="sales.updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="item-total">${Utils.formatCurrency(item.total)}</div>
                    <button class="btn btn-icon btn-danger btn-sm" onclick="sales.removeFromCart('${item.productId}')" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + item.total, 0);
        cartTotal.textContent = Utils.formatCurrency(total);
    }

    // Update installments visibility
    updateInstallmentsVisibility() {
        const installmentsGroup = document.getElementById('installments-group');
        if (!installmentsGroup) return;

        if (this.paymentMethod === 'credit' || this.paymentMethod === 'card') {
            installmentsGroup.classList.remove('hidden');
        } else {
            installmentsGroup.classList.add('hidden');
            this.installments = 1;
        }
    }

    // Clear cart
    async clearCart() {
        if (this.cart.length === 0) return;

        const confirmed = await Notifications.confirm(
            'Tem certeza que deseja limpar o carrinho?',
            'Limpar Carrinho'
        );

        if (confirmed) {
            this.cart = [];
            this.renderCart();
            Notifications.info('Carrinho limpo');
        }
    }

    // Finalize sale
    async finalizeSale() {
        // Validate cart
        if (this.cart.length === 0) {
            Notifications.error('Adicione produtos ao carrinho');
            return;
        }

        // Validate client for credit sales
        if ((this.paymentMethod === 'credit' || this.paymentMethod === 'card') && !this.selectedClient) {
            Notifications.error('Selecione um cliente para vendas a prazo');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + item.total, 0);

        // Show confirmation
        const confirmed = await this.showSaleConfirmation(total);
        if (!confirmed) return;

        const loadingId = app.showLoading('Processando venda...');

        try {
            // Prepare sale data
            const saleData = {
                clientId: this.selectedClient,
                items: [...this.cart],
                total,
                paymentMethod: this.paymentMethod,
                installments: this.installments,
                saleDate: new Date().toISOString()
            };

            // Save sale
            const success = StorageManager.saveSale(saleData);

            if (success) {
                // Generate receipt
                const receipt = this.generateReceipt(saleData);
                this.showReceipt(receipt, saleData);
                
                // Clear cart and reset form
                this.clearSaleForm();
                
                Notifications.success('Venda realizada com sucesso!');
            } else {
                throw new Error('Erro ao processar venda');
            }
        } catch (error) {
            Notifications.error('Erro ao finalizar venda: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Show sale confirmation
    async showSaleConfirmation(total) {
        const client = this.selectedClient ? this.clients.find(c => c.id === this.selectedClient) : null;
        const paymentMethodText = this.getPaymentMethodText();
        
        let confirmationText = `Confirmar venda de ${Utils.formatCurrency(total)}?\n\n`;
        confirmationText += `Pagamento: ${paymentMethodText}\n`;
        
        if (client) {
            confirmationText += `Cliente: ${client.name}\n`;
        }
        
        if (this.installments > 1) {
            const installmentValue = total / this.installments;
            confirmationText += `Parcelas: ${this.installments}x de ${Utils.formatCurrency(installmentValue)}`;
        }

        return await Notifications.confirm(confirmationText, 'Finalizar Venda');
    }

    // Get payment method text
    getPaymentMethodText() {
        const methods = {
            'cash': 'À Vista',
            'pix': 'PIX',
            'credit': 'Crediário',
            'card': 'Cartão de Crédito'
        };
        return methods[this.paymentMethod] || 'Desconhecido';
    }

    // Generate receipt
    generateReceipt(saleData) {
        const client = saleData.clientId ? this.clients.find(c => c.id === saleData.clientId) : null;
        const saleId = saleData.id || Utils.generateId();
        
        return {
            id: saleId,
            date: new Date().toISOString(),
            client,
            items: saleData.items,
            total: saleData.total,
            paymentMethod: this.getPaymentMethodText(),
            installments: saleData.installments
        };
    }

    // Show receipt
    showReceipt(receipt, saleData) {
        const modalContent = `
            <div class="receipt-modal">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-receipt"></i>
                        Recibo de Venda
                    </h3>
                    <button class="modal-close" onclick="app.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="receipt-content" id="receipt-content">
                        <div class="receipt-header">
                            <h2>Flor de Maria</h2>
                            <p>Sistema de Gestão Integrado</p>
                            <hr>
                        </div>
                        
                        <div class="receipt-info">
                            <p><strong>Recibo:</strong> #${receipt.id.substr(-6)}</p>
                            <p><strong>Data:</strong> ${Utils.formatDateTime(receipt.date)}</p>
                            ${receipt.client ? `<p><strong>Cliente:</strong> ${Utils.sanitizeHtml(receipt.client.name)}</p>` : ''}
                            <p><strong>Pagamento:</strong> ${receipt.paymentMethod}</p>
                            ${receipt.installments > 1 ? `<p><strong>Parcelas:</strong> ${receipt.installments}x de ${Utils.formatCurrency(receipt.total / receipt.installments)}</p>` : ''}
                        </div>
                        
                        <div class="receipt-items">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Qtd</th>
                                        <th>Valor</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${receipt.items.map(item => `
                                        <tr>
                                            <td>${Utils.sanitizeHtml(item.productName)}</td>
                                            <td>${item.quantity}</td>
                                            <td>${Utils.formatCurrency(item.price)}</td>
                                            <td>${Utils.formatCurrency(item.total)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="receipt-total">
                            <strong>Total: ${Utils.formatCurrency(receipt.total)}</strong>
                        </div>
                        
                        <div class="receipt-footer">
                            <p>Obrigada pela preferência!</p>
                            <small>Recibo gerado em ${Utils.formatDateTime(new Date())}</small>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="receipt-actions">
                        <button class="btn btn-secondary" onclick="sales.printReceipt()">
                            <i class="fas fa-print"></i>
                            Imprimir
                        </button>
                        <button class="btn btn-success" onclick="sales.sendWhatsApp('${receipt.id}')">
                            <i class="fab fa-whatsapp"></i>
                            WhatsApp
                        </button>
                        <button class="btn btn-primary" onclick="app.closeModal()">
                            <i class="fas fa-check"></i>
                            Finalizar
                        </button>
                    </div>
                </div>
            </div>
        `;

        app.showModal(modalContent);
    }

    // Print receipt
    printReceipt() {
        const receiptContent = document.getElementById('receipt-content');
        if (!receiptContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo - Flor de Maria</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-header h2 { margin: 0; }
                    .receipt-info p { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #f2f2f2; }
                    .receipt-total { text-align: center; font-size: 18px; margin: 20px 0; }
                    .receipt-footer { text-align: center; margin-top: 20px; }
                    hr { margin: 15px 0; }
                </style>
            </head>
            <body>
                ${receiptContent.innerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    // Send via WhatsApp
    sendWhatsApp(receiptId) {
        const client = this.selectedClient ? this.clients.find(c => c.id === this.selectedClient) : null;
        
        if (!client || !client.phone) {
            Notifications.error('Cliente não possui telefone cadastrado');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + item.total, 0);
        const paymentMethod = this.getPaymentMethodText();
        
        let message = `🌸 *Flor de Maria* 🌸\n\n`;
        message += `Olá ${client.name}!\n\n`;
        message += `Aqui está o recibo da sua compra:\n`;
        message += `📋 Recibo: #${receiptId.substr(-6)}\n`;
        message += `💰 Total: ${Utils.formatCurrency(total)}\n`;
        message += `💳 Pagamento: ${paymentMethod}\n\n`;
        
        if (this.installments > 1) {
            message += `📅 Parcelamento: ${this.installments}x de ${Utils.formatCurrency(total / this.installments)}\n\n`;
        }
        
        message += `*Itens:*\n`;
        this.cart.forEach(item => {
            message += `• ${item.productName} - ${item.quantity}x ${Utils.formatCurrency(item.price)} = ${Utils.formatCurrency(item.total)}\n`;
        });
        
        message += `\nObrigada pela preferência! 💕`;

        const whatsappUrl = Utils.generateWhatsAppLink(client.phone, message);
        window.open(whatsappUrl, '_blank');
    }

    // Clear sale form
    clearSaleForm() {
        this.cart = [];
        this.selectedClient = null;
        this.paymentMethod = 'cash';
        this.installments = 1;
        
        // Reset form elements
        const clientSelect = document.getElementById('sale-client');
        const paymentMethodSelect = document.getElementById('payment-method');
        const installmentsSelect = document.getElementById('installments');
        const productSearch = document.getElementById('product-search');
        
        if (clientSelect) clientSelect.value = '';
        if (paymentMethodSelect) paymentMethodSelect.value = 'cash';
        if (installmentsSelect) installmentsSelect.value = '2';
        if (productSearch) productSearch.value = '';
        
        this.searchTerm = '';
        this.filterProducts();
        this.renderInterface();
    }

    // Quick actions
    addNewClient() {
        if (window.app.modules && window.app.modules.clients) {
            window.app.modules.clients.showClientForm();
        }
    }

    addNewProduct() {
        if (window.app.modules && window.app.modules.inventory) {
            window.app.modules.inventory.showProductForm();
        }
    }

    // Refresh module
    refresh() {
        this.loadData();
        this.renderInterface();
    }

    // Search functionality
    search(query) {
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.value = query;
            this.searchTerm = query;
            this.filterProducts();
            this.renderProducts();
        }
    }

    // Get sales statistics
    getSalesStatistics() {
        const sales = StorageManager.getSales();
        const today = new Date().toISOString().split('T')[0];
        
        return {
            todaySales: sales.filter(s => s.createdAt.split('T')[0] === today),
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
            averageTicket: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0
        };
    }
}

// Add custom styles for sales
const salesStyles = document.createElement('style');
salesStyles.textContent = `
    .empty-cart {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--color-text-muted);
    }
    
    .empty-cart i {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
        opacity: 0.5;
    }
    
    .cart-item {
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
    }
    
    .cart-item-info h5 {
        color: var(--color-text-primary);
        margin-bottom: var(--spacing-xs);
    }
    
    .cart-item-info p {
        color: var(--color-text-secondary);
        font-size: 0.85rem;
    }
    
    .cart-item-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
    }
    
    .item-total {
        font-weight: 600;
        color: var(--color-primary);
        min-width: 80px;
        text-align: right;
    }
    
    .receipt-content table {
        width: 100%;
        border-collapse: collapse;
        margin: var(--spacing-md) 0;
    }
    
    .receipt-content th,
    .receipt-content td {
        padding: var(--spacing-sm);
        text-align: left;
        border-bottom: 1px solid var(--color-border-light);
    }
    
    .receipt-content th {
        background: var(--color-bg-surface);
        font-weight: 600;
    }
    
    .receipt-footer {
        text-align: center;
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-md);
        border-top: 1px dashed var(--color-border);
    }
    
    @media (max-width: 768px) {
        .cart-item-controls {
            flex-direction: column;
            align-items: stretch;
        }
        
        .item-total {
            text-align: center;
        }
    }
`;
document.head.appendChild(salesStyles);

// Initialize and export
window.Sales = Sales;
