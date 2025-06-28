// Inventory Module
class Inventory {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentProduct = null;
        this.searchTerm = '';
        this.sortField = 'name';
        this.sortDirection = 'asc';
        this.stockFilter = 'all'; // all, available, low, out
        
        this.init();
    }

    // Initialize inventory module
    init() {
        this.bindEvents();
        this.loadProducts();
        this.renderTable();
    }

    // Bind events
    bindEvents() {
        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showProductForm();
            });
        }

        // Setup search and filters
        this.setupSearch();
        this.setupFilters();
        this.setupTableSorting();
    }

    // Setup search functionality
    setupSearch() {
        const moduleHeader = document.querySelector('#inventory-module .module-header');
        if (moduleHeader && !document.getElementById('inventory-controls')) {
            const controlsContainer = document.createElement('div');
            controlsContainer.id = 'inventory-controls';
            controlsContainer.className = 'inventory-controls';
            controlsContainer.innerHTML = `
                <div class="controls-row">
                    <input type="text" id="inventory-search" class="form-control" 
                           placeholder="Buscar produtos..." style="max-width: 300px;">
                    <select id="stock-filter" class="form-control" style="max-width: 150px;">
                        <option value="all">Todos</option>
                        <option value="available">Disponível</option>
                        <option value="low">Estoque Baixo</option>
                        <option value="out">Esgotado</option>
                    </select>
                    <button class="btn btn-secondary" onclick="inventory.exportInventory()">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
            moduleHeader.appendChild(controlsContainer);
        }

        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterProducts();
                this.renderTable();
            }, 300));
        }
    }

    // Setup filters
    setupFilters() {
        const stockFilter = document.getElementById('stock-filter');
        if (stockFilter) {
            stockFilter.addEventListener('change', (e) => {
                this.stockFilter = e.target.value;
                this.filterProducts();
                this.renderTable();
            });
        }
    }

    // Setup table sorting
    setupTableSorting() {
        // Add data-sort attributes to headers
        const headers = document.querySelectorAll('#inventory-table th');
        const sortableFields = ['code', 'name', 'quantity', 'costPrice', 'salePrice'];
        
        headers.forEach((header, index) => {
            if (sortableFields[index]) {
                header.setAttribute('data-sort', sortableFields[index]);
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    this.sortProducts(sortableFields[index]);
                });
            }
        });
    }

    // Load products from storage
    loadProducts() {
        this.products = StorageManager.getProducts();
        this.filterProducts();
    }

    // Filter products
    filterProducts() {
        let filtered = [...this.products];

        // Apply search filter
        if (this.searchTerm) {
            filtered = Utils.searchInArray(
                filtered,
                this.searchTerm,
                ['code', 'name', 'description', 'category']
            );
        }

        // Apply stock filter
        if (this.stockFilter !== 'all') {
            const lowStockThreshold = StorageManager.getSettings().lowStockAlert || 5;
            
            filtered = filtered.filter(product => {
                switch (this.stockFilter) {
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

        this.filteredProducts = filtered;
    }

    // Sort products
    sortProducts(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.filteredProducts = Utils.sortArray(
            this.filteredProducts,
            this.sortField,
            this.sortDirection
        );

        this.renderTable();
        this.updateSortIcons();
    }

    // Update sort icons
    updateSortIcons() {
        const headers = document.querySelectorAll('#inventory-table th[data-sort]');
        headers.forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (icon) icon.remove();
        });

        const activeHeader = document.querySelector(`#inventory-table th[data-sort="${this.sortField}"]`);
        if (activeHeader) {
            const icon = document.createElement('i');
            icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
            icon.style.marginLeft = '5px';
            activeHeader.appendChild(icon);
        }
    }

    // Render products table
    renderTable() {
        const tbody = document.querySelector('#inventory-table tbody');
        if (!tbody) return;

        if (this.filteredProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-boxes"></i>
                            <h3>Nenhum produto encontrado</h3>
                            <p>Adicione produtos para começar a gerenciar seu estoque.</p>
                            <button class="btn btn-primary" onclick="inventory.showProductForm()">
                                <i class="fas fa-plus"></i> Adicionar Produto
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const lowStockThreshold = StorageManager.getSettings().lowStockAlert || 5;

        tbody.innerHTML = this.filteredProducts.map(product => {
            const stockStatus = this.getStockStatus(product, lowStockThreshold);
            
            return `
                <tr data-product-id="${product.id}" class="${stockStatus.class}">
                    <td>
                        <span class="product-code">${Utils.sanitizeHtml(product.code)}</span>
                    </td>
                    <td>
                        <div class="product-info">
                            <strong>${Utils.sanitizeHtml(product.name)}</strong>
                            ${product.description ? `<br><small class="text-muted">${Utils.sanitizeHtml(product.description)}</small>` : ''}
                            ${product.category ? `<br><span class="product-category">${Utils.sanitizeHtml(product.category)}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="quantity-display">
                            <span class="quantity-value">${product.quantity}</span>
                            ${product.unit ? `<span class="quantity-unit">${Utils.sanitizeHtml(product.unit)}</span>` : ''}
                        </div>
                    </td>
                    <td>${Utils.formatCurrency(product.costPrice)}</td>
                    <td>${Utils.formatCurrency(product.salePrice)}</td>
                    <td>
                        <span class="status-badge ${stockStatus.badge}">
                            ${stockStatus.text}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-icon btn-success" 
                                    onclick="inventory.adjustStock('${product.id}')"
                                    title="Ajustar Estoque">
                                <i class="fas fa-plus-minus"></i>
                            </button>
                            <button class="btn btn-icon btn-primary" 
                                    onclick="inventory.editProduct('${product.id}')"
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon btn-danger" 
                                    onclick="inventory.deleteProduct('${product.id}')"
                                    title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Get stock status
    getStockStatus(product, threshold) {
        if (product.quantity === 0) {
            return {
                text: 'Esgotado',
                badge: 'status-out-of-stock',
                class: 'row-danger'
            };
        } else if (product.quantity <= threshold) {
            return {
                text: 'Baixo',
                badge: 'status-low',
                class: 'row-warning'
            };
        } else {
            return {
                text: 'Disponível',
                badge: 'status-available',
                class: ''
            };
        }
    }

    // Show product form
    showProductForm(product = null) {
        this.currentProduct = product;
        const isEdit = !!product;
        
        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-box"></i>
                    ${isEdit ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="product-form" class="product-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-code">Código *</label>
                            <input type="text" id="product-code" class="form-control" 
                                   value="${product ? Utils.sanitizeHtml(product.code) : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="product-name">Nome *</label>
                            <input type="text" id="product-name" class="form-control" 
                                   value="${product ? Utils.sanitizeHtml(product.name) : ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="product-description">Descrição</label>
                        <textarea id="product-description" class="form-control" rows="2"
                                  placeholder="Descrição do produto">${product ? Utils.sanitizeHtml(product.description || '') : ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-category">Categoria</label>
                            <input type="text" id="product-category" class="form-control" 
                                   value="${product ? Utils.sanitizeHtml(product.category || '') : ''}"
                                   placeholder="Ex: Roupas, Acessórios">
                        </div>
                        <div class="form-group">
                            <label for="product-unit">Unidade</label>
                            <select id="product-unit" class="form-control">
                                <option value="">Selecione</option>
                                <option value="un" ${product && product.unit === 'un' ? 'selected' : ''}>Unidade</option>
                                <option value="kg" ${product && product.unit === 'kg' ? 'selected' : ''}>Quilograma</option>
                                <option value="g" ${product && product.unit === 'g' ? 'selected' : ''}>Grama</option>
                                <option value="l" ${product && product.unit === 'l' ? 'selected' : ''}>Litro</option>
                                <option value="ml" ${product && product.unit === 'ml' ? 'selected' : ''}>Mililitro</option>
                                <option value="m" ${product && product.unit === 'm' ? 'selected' : ''}>Metro</option>
                                <option value="cm" ${product && product.unit === 'cm' ? 'selected' : ''}>Centímetro</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-quantity">Quantidade *</label>
                            <input type="number" id="product-quantity" class="form-control" 
                                   value="${product ? product.quantity : 0}" min="0" step="1" required>
                        </div>
                        <div class="form-group">
                            <label for="product-min-stock">Estoque Mínimo</label>
                            <input type="number" id="product-min-stock" class="form-control" 
                                   value="${product ? (product.minStock || 5) : 5}" min="0" step="1">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-cost-price">Preço de Custo *</label>
                            <input type="number" id="product-cost-price" class="form-control" 
                                   value="${product ? product.costPrice : ''}" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="product-sale-price">Preço de Venda *</label>
                            <input type="number" id="product-sale-price" class="form-control" 
                                   value="${product ? product.salePrice : ''}" min="0" step="0.01" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-margin">Margem de Lucro (%)</label>
                            <input type="number" id="product-margin" class="form-control" 
                                   min="0" step="0.01" readonly>
                        </div>
                        <div class="form-group">
                            <label for="product-barcode">Código de Barras</label>
                            <input type="text" id="product-barcode" class="form-control" 
                                   value="${product ? Utils.sanitizeHtml(product.barcode || '') : ''}"
                                   placeholder="EAN, UPC, etc.">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="product-notes">Observações</label>
                        <textarea id="product-notes" class="form-control" rows="2"
                                  placeholder="Anotações sobre o produto">${product ? Utils.sanitizeHtml(product.notes || '') : ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="inventory.saveProduct()">
                    <i class="fas fa-save"></i>
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        `;

        app.showModal(modalContent);
        this.setupFormCalculations();
        this.setupFormValidation();
    }

    // Setup form calculations
    setupFormCalculations() {
        const costPriceInput = document.getElementById('product-cost-price');
        const salePriceInput = document.getElementById('product-sale-price');
        const marginInput = document.getElementById('product-margin');

        const calculateMargin = () => {
            const costPrice = parseFloat(costPriceInput.value) || 0;
            const salePrice = parseFloat(salePriceInput.value) || 0;
            
            if (costPrice > 0 && salePrice > 0) {
                const margin = ((salePrice - costPrice) / costPrice) * 100;
                marginInput.value = margin.toFixed(2);
                
                // Color code the margin
                if (margin < 20) {
                    marginInput.style.color = 'var(--color-danger)';
                } else if (margin < 50) {
                    marginInput.style.color = 'var(--color-warning)';
                } else {
                    marginInput.style.color = 'var(--color-success)';
                }
            } else {
                marginInput.value = '';
                marginInput.style.color = '';
            }
        };

        costPriceInput.addEventListener('input', calculateMargin);
        salePriceInput.addEventListener('input', calculateMargin);

        // Calculate initial margin
        calculateMargin();
    }

    // Setup form validation
    setupFormValidation() {
        const form = document.getElementById('product-form');
        if (!form) return;

        const codeInput = document.getElementById('product-code');
        const nameInput = document.getElementById('product-name');
        const costPriceInput = document.getElementById('product-cost-price');
        const salePriceInput = document.getElementById('product-sale-price');

        // Real-time validation
        codeInput.addEventListener('input', () => {
            this.validateField(codeInput, codeInput.value.trim().length >= 1, 'Código é obrigatório');
        });

        nameInput.addEventListener('input', () => {
            this.validateField(nameInput, nameInput.value.trim().length >= 2, 'Nome deve ter pelo menos 2 caracteres');
        });

        costPriceInput.addEventListener('input', () => {
            const value = parseFloat(costPriceInput.value);
            this.validateField(costPriceInput, value > 0, 'Preço de custo deve ser maior que zero');
        });

        salePriceInput.addEventListener('input', () => {
            const value = parseFloat(salePriceInput.value);
            const costPrice = parseFloat(costPriceInput.value) || 0;
            this.validateField(salePriceInput, value > 0 && value >= costPrice, 
                'Preço de venda deve ser maior que zero e não inferior ao custo');
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

    // Save product
    async saveProduct() {
        const form = document.getElementById('product-form');
        if (!form) return;

        // Get form data
        const formData = {
            code: document.getElementById('product-code').value.trim(),
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            category: document.getElementById('product-category').value.trim(),
            unit: document.getElementById('product-unit').value,
            quantity: parseInt(document.getElementById('product-quantity').value) || 0,
            minStock: parseInt(document.getElementById('product-min-stock').value) || 5,
            costPrice: parseFloat(document.getElementById('product-cost-price').value) || 0,
            salePrice: parseFloat(document.getElementById('product-sale-price').value) || 0,
            barcode: document.getElementById('product-barcode').value.trim(),
            notes: document.getElementById('product-notes').value.trim()
        };

        // Validate required fields
        if (!formData.code) {
            Notifications.error('Código é obrigatório');
            document.getElementById('product-code').focus();
            return;
        }

        if (!formData.name) {
            Notifications.error('Nome é obrigatório');
            document.getElementById('product-name').focus();
            return;
        }

        if (formData.costPrice <= 0) {
            Notifications.error('Preço de custo deve ser maior que zero');
            document.getElementById('product-cost-price').focus();
            return;
        }

        if (formData.salePrice <= 0) {
            Notifications.error('Preço de venda deve ser maior que zero');
            document.getElementById('product-sale-price').focus();
            return;
        }

        if (formData.salePrice < formData.costPrice) {
            const confirmed = await Notifications.confirm(
                'O preço de venda é menor que o custo. Deseja continuar mesmo assim?',
                'Preço de Venda Baixo'
            );
            if (!confirmed) return;
        }

        // Check for duplicate code
        if (await this.checkDuplicateCode(formData.code)) {
            return;
        }

        const loadingId = app.showLoading('Salvando produto...');

        try {
            // Prepare product data
            const productData = {
                ...formData,
                id: this.currentProduct ? this.currentProduct.id : undefined
            };

            // Save to storage
            const success = StorageManager.saveProduct(productData);

            if (success) {
                app.closeModal();
                this.refresh();
                
                const message = this.currentProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!';
                Notifications.success(message);
            } else {
                throw new Error('Erro ao salvar produto');
            }
        } catch (error) {
            Notifications.error('Erro ao salvar produto: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Check for duplicate code
    async checkDuplicateCode(code) {
        const existingProducts = this.products.filter(p => 
            p.id !== (this.currentProduct ? this.currentProduct.id : null)
        );

        if (existingProducts.some(p => p.code === code)) {
            Notifications.error('Já existe um produto com este código');
            document.getElementById('product-code').focus();
            return true;
        }

        return false;
    }

    // Edit product
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductForm(product);
        }
    }

    // Delete product
    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const confirmed = await Notifications.confirm(
            `Tem certeza que deseja excluir o produto "${product.name}"?\n\nEsta ação não pode ser desfeita.`,
            'Confirmar Exclusão'
        );

        if (!confirmed) return;

        const loadingId = app.showLoading('Excluindo produto...');

        try {
            const success = StorageManager.deleteProduct(productId);
            
            if (success) {
                this.refresh();
                Notifications.success('Produto excluído com sucesso!');
            } else {
                throw new Error('Erro ao excluir produto');
            }
        } catch (error) {
            Notifications.error('Erro ao excluir produto: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Adjust stock
    adjustStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-plus-minus"></i>
                    Ajustar Estoque - ${Utils.sanitizeHtml(product.name)}
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="stock-adjustment">
                    <div class="current-stock">
                        <label>Estoque Atual:</label>
                        <span class="stock-value">${product.quantity} ${product.unit || 'un'}</span>
                    </div>
                    
                    <form id="stock-adjustment-form">
                        <div class="form-group">
                            <label for="adjustment-type">Tipo de Ajuste</label>
                            <select id="adjustment-type" class="form-control" required>
                                <option value="">Selecione</option>
                                <option value="add">Entrada (Adicionar)</option>
                                <option value="remove">Saída (Remover)</option>
                                <option value="set">Definir Quantidade</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="adjustment-quantity">Quantidade</label>
                            <input type="number" id="adjustment-quantity" class="form-control" 
                                   min="0" step="1" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="adjustment-reason">Motivo</label>
                            <select id="adjustment-reason" class="form-control">
                                <option value="">Selecione</option>
                                <option value="purchase">Compra</option>
                                <option value="return">Devolução</option>
                                <option value="loss">Perda</option>
                                <option value="damage">Avaria</option>
                                <option value="count">Contagem</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="adjustment-notes">Observações</label>
                            <textarea id="adjustment-notes" class="form-control" rows="2"
                                      placeholder="Detalhes do ajuste"></textarea>
                        </div>
                        
                        <div id="new-stock-preview" class="new-stock-preview hidden">
                            <label>Novo Estoque:</label>
                            <span class="new-stock-value"></span>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="inventory.saveStockAdjustment('${productId}')">
                    <i class="fas fa-save"></i>
                    Aplicar Ajuste
                </button>
            </div>
        `;

        app.showModal(modalContent);
        this.setupStockAdjustmentCalculation(product);
    }

    // Setup stock adjustment calculation
    setupStockAdjustmentCalculation(product) {
        const typeSelect = document.getElementById('adjustment-type');
        const quantityInput = document.getElementById('adjustment-quantity');
        const preview = document.getElementById('new-stock-preview');
        const previewValue = preview.querySelector('.new-stock-value');

        const calculateNewStock = () => {
            const type = typeSelect.value;
            const quantity = parseInt(quantityInput.value) || 0;
            
            if (!type || quantity === 0) {
                preview.classList.add('hidden');
                return;
            }

            let newStock;
            switch (type) {
                case 'add':
                    newStock = product.quantity + quantity;
                    break;
                case 'remove':
                    newStock = Math.max(0, product.quantity - quantity);
                    break;
                case 'set':
                    newStock = quantity;
                    break;
                default:
                    preview.classList.add('hidden');
                    return;
            }

            previewValue.textContent = `${newStock} ${product.unit || 'un'}`;
            preview.classList.remove('hidden');

            // Color code based on stock level
            const minStock = product.minStock || 5;
            if (newStock === 0) {
                previewValue.style.color = 'var(--color-danger)';
            } else if (newStock <= minStock) {
                previewValue.style.color = 'var(--color-warning)';
            } else {
                previewValue.style.color = 'var(--color-success)';
            }
        };

        typeSelect.addEventListener('change', calculateNewStock);
        quantityInput.addEventListener('input', calculateNewStock);
    }

    // Save stock adjustment
    async saveStockAdjustment(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const type = document.getElementById('adjustment-type').value;
        const quantity = parseInt(document.getElementById('adjustment-quantity').value) || 0;
        const reason = document.getElementById('adjustment-reason').value;
        const notes = document.getElementById('adjustment-notes').value.trim();

        if (!type) {
            Notifications.error('Selecione o tipo de ajuste');
            return;
        }

        if (quantity <= 0) {
            Notifications.error('Quantidade deve ser maior que zero');
            return;
        }

        const loadingId = app.showLoading('Aplicando ajuste...');

        try {
            let newQuantity;
            switch (type) {
                case 'add':
                    newQuantity = product.quantity + quantity;
                    break;
                case 'remove':
                    newQuantity = Math.max(0, product.quantity - quantity);
                    break;
                case 'set':
                    newQuantity = quantity;
                    break;
                default:
                    throw new Error('Tipo de ajuste inválido');
            }

            // Update product quantity
            const adjustmentQuantity = newQuantity - product.quantity;
            const success = StorageManager.updateProductStock(productId, adjustmentQuantity);

            if (success) {
                // Log the adjustment (could be saved for audit trail)
                const adjustmentLog = {
                    productId,
                    productName: product.name,
                    type,
                    quantity,
                    oldQuantity: product.quantity,
                    newQuantity,
                    reason,
                    notes,
                    timestamp: new Date().toISOString()
                };

                app.closeModal();
                this.refresh();
                
                Notifications.success('Estoque ajustado com sucesso!');
            } else {
                throw new Error('Erro ao ajustar estoque');
            }
        } catch (error) {
            Notifications.error('Erro ao ajustar estoque: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Export inventory
    exportInventory() {
        const data = {
            products: this.products,
            statistics: this.getInventoryStatistics(),
            exportedAt: new Date().toISOString(),
            totalProducts: this.products.length
        };

        const content = JSON.stringify(data, null, 2);
        const filename = `estoque_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Estoque exportado com sucesso!');
    }

    // Get inventory statistics
    getInventoryStatistics() {
        const lowStockThreshold = StorageManager.getSettings().lowStockAlert || 5;
        
        const stats = {
            totalProducts: this.products.length,
            totalValue: this.products.reduce((sum, p) => sum + (p.quantity * p.salePrice), 0),
            totalCost: this.products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0),
            outOfStock: this.products.filter(p => p.quantity === 0).length,
            lowStock: this.products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length,
            categories: {}
        };

        // Group by categories
        this.products.forEach(product => {
            const category = product.category || 'Sem Categoria';
            if (!stats.categories[category]) {
                stats.categories[category] = {
                    count: 0,
                    value: 0,
                    cost: 0
                };
            }
            stats.categories[category].count++;
            stats.categories[category].value += product.quantity * product.salePrice;
            stats.categories[category].cost += product.quantity * product.costPrice;
        });

        return stats;
    }

    // Refresh module
    refresh() {
        this.loadProducts();
        this.renderTable();
    }

    // Search functionality
    search(query) {
        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
            searchInput.value = query;
            this.searchTerm = query;
            this.filterProducts();
            this.renderTable();
        }
    }
}

// Add custom styles for inventory
const inventoryStyles = document.createElement('style');
inventoryStyles.textContent = `
    .inventory-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .controls-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .product-info strong {
        color: var(--color-text-primary);
    }
    
    .product-category {
        background: rgba(230, 184, 0, 0.2);
        color: var(--color-primary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
    }
    
    .product-code {
        font-family: monospace;
        background: var(--color-bg-surface);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.9rem;
    }
    
    .quantity-display {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .quantity-value {
        font-weight: 600;
        font-size: 1.1rem;
    }
    
    .quantity-unit {
        color: var(--color-text-muted);
        font-size: 0.8rem;
    }
    
    .row-danger {
        background: rgba(255, 107, 107, 0.1) !important;
    }
    
    .row-warning {
        background: rgba(255, 212, 59, 0.1) !important;
    }
    
    .status-low {
        background: rgba(255, 212, 59, 0.2);
        color: var(--color-warning);
    }
    
    .stock-adjustment {
        padding: var(--spacing-md);
    }
    
    .current-stock {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background: var(--color-bg-surface);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-lg);
    }
    
    .stock-value {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--color-primary);
    }
    
    .new-stock-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);
        margin-top: var(--spacing-md);
        border-left: 4px solid var(--color-primary);
    }
    
    .new-stock-value {
        font-size: 1.2rem;
        font-weight: 600;
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
document.head.appendChild(inventoryStyles);

// Initialize and export
window.Inventory = Inventory;

