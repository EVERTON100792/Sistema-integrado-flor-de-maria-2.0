// Inventory Module
class Inventory {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentProduct = null;
        this.searchTerm = '';
        this.sortField = 'name';
        this.sortDirection = 'asc';
    }

    init() {
        this.bindEvents();
        this.loadProducts();
        this.renderTable();
    }

    bindEvents() {
        document.getElementById('add-product-btn')?.addEventListener('click', () => this.showProductForm());

        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(e => {
                this.searchTerm = e.target.value;
                this.filterAndRender();
            }, 300));
        }

        document.querySelectorAll('#inventory-table th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                if (this.sortField === field) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortDirection = 'asc';
                }
                this.filterAndRender();
            });
        });
    }

    loadProducts() {
        this.products = StorageManager.getProducts();
    }

    filterAndRender() {
        this.filteredProducts = Utils.searchInArray(this.products, this.searchTerm, ['code', 'name']);
        this.filteredProducts = Utils.sortArray(this.filteredProducts, this.sortField, this.sortDirection);
        this.renderTable();
    }

    renderTable() {
        const tbody = document.querySelector('#inventory-table tbody');
        if (!tbody) return;

        if (this.filteredProducts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum produto encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.filteredProducts.map(product => `
            <tr data-product-id="${product.id}">
                <td>${Utils.sanitizeHtml(product.code)}</td>
                <td>${Utils.sanitizeHtml(product.name)}</td>
                <td>${product.quantity}</td>
                <td>${Utils.formatCurrency(product.costPrice)}</td>
                <td>${Utils.formatCurrency(product.salePrice)}</td>
                <td><span class="status-badge ${product.quantity > 0 ? 'status-available' : 'status-out-of-stock'}">${product.quantity > 0 ? 'Disponível' : 'Esgotado'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-primary" onclick="inventory.editProduct('${product.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-icon btn-danger" onclick="inventory.deleteProduct('${product.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        this.updateSortIcons();
    }
    
    updateSortIcons() {
        document.querySelectorAll('#inventory-table th[data-sort]').forEach(header => {
            header.innerHTML = header.innerHTML.replace(/ <i.*<\/i>$/, '');
            if (header.dataset.sort === this.sortField) {
                const iconClass = this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
                header.innerHTML += ` <i class="fas ${iconClass}"></i>`;
            }
        });
    }

    showProductForm(product = null) {
        this.currentProduct = product;
        const isEdit = !!product;
        const modalContent = `
            <div class="modal-header"><h3>${isEdit ? 'Editar Produto' : 'Novo Produto'}</h3></div>
            <div class="modal-body">
                <form id="product-form">
                    <div class="form-group"><label>Código *</label><input type="text" id="product-code" class="form-control" value="${product ? Utils.sanitizeHtml(product.code) : ''}" required></div>
                    <div class="form-group"><label>Nome *</label><input type="text" id="product-name" class="form-control" value="${product ? Utils.sanitizeHtml(product.name) : ''}" required></div>
                    <div class="form-group"><label>Quantidade *</label><input type="number" id="product-quantity" class="form-control" value="${product ? product.quantity : '0'}" required></div>
                    <div class="form-group"><label>Preço de Custo *</label><input type="number" id="product-cost" class="form-control" value="${product ? product.costPrice : ''}" required></div>
                    <div class="form-group"><label>Preço de Venda *</label><input type="number" id="product-sale" class="form-control" value="${product ? product.salePrice : ''}" required></div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                <button type="button" class="btn btn-primary" id="save-product-btn">Salvar</button>
            </div>`;
        app.showModal(modalContent);
        document.getElementById('save-product-btn').onclick = () => this.saveProduct();
    }

    async saveProduct() {
        const code = document.getElementById('product-code').value.trim();
        const name = document.getElementById('product-name').value.trim();
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const costPrice = parseFloat(document.getElementById('product-cost').value);
        const salePrice = parseFloat(document.getElementById('product-sale').value);

        if (!code || !name || isNaN(quantity) || isNaN(costPrice) || isNaN(salePrice)) {
            Notifications.error('Todos os campos marcados com * são obrigatórios.');
            return;
        }

        const productData = {
            id: this.currentProduct ? this.currentProduct.id : null,
            code, name, quantity, costPrice, salePrice
        };

        if (StorageManager.saveProduct(productData)) {
            Notifications.success(`Produto ${this.currentProduct ? 'atualizado' : 'cadastrado'} com sucesso!`);
            app.closeModal();
            this.refresh();
        }
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const confirmed = await Notifications.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`);
        if (confirmed) {
            if (StorageManager.deleteProduct(productId)) {
                Notifications.success('Produto excluído com sucesso!');
                this.refresh();
            }
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) this.showProductForm(product);
    }
    
    refresh() {
        this.loadProducts();
        this.filterAndRender();
    }
}
