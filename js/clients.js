// Clients Module
class Clients {
    constructor() {
        this.clients = [];
        this.filteredClients = [];
        this.currentClient = null;
        this.searchTerm = '';
        this.sortField = 'name';
        this.sortDirection = 'asc';
    }

    init() {
        this.bindEvents();
        this.loadClients();
        this.renderTable();
    }

    bindEvents() {
        document.getElementById('add-client-btn')?.addEventListener('click', () => this.showClientForm());
        
        const searchInput = document.getElementById('clients-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(e => {
                this.searchTerm = e.target.value;
                this.filterAndRender();
            }, 300));
        }

        document.querySelectorAll('#clients-table th[data-sort]').forEach(header => {
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

    loadClients() {
        this.clients = StorageManager.getClients();
    }

    filterAndRender() {
        this.filteredClients = Utils.searchInArray(this.clients, this.searchTerm, ['name', 'phone', 'email', 'cpf']);
        this.filteredClients = Utils.sortArray(this.filteredClients, this.sortField, this.sortDirection);
        this.renderTable();
    }

    renderTable() {
        const tbody = document.querySelector('#clients-table tbody');
        if (!tbody) return;

        if (this.filteredClients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Nenhum cliente encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.filteredClients.map(client => `
            <tr data-client-id="${client.id}">
                <td>${Utils.sanitizeHtml(client.name)}</td>
                <td>${Utils.sanitizeHtml(client.phone)}</td>
                <td>${Utils.formatDate(client.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-primary" onclick="clients.editClient('${client.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-icon btn-danger" onclick="clients.deleteClient('${client.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        this.updateSortIcons();
    }

    updateSortIcons() {
        document.querySelectorAll('#clients-table th[data-sort]').forEach(header => {
            header.innerHTML = header.innerHTML.replace(/ <i.*<\/i>$/, '');
            if (header.dataset.sort === this.sortField) {
                const iconClass = this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
                header.innerHTML += ` <i class="fas ${iconClass}"></i>`;
            }
        });
    }

    showClientForm(client = null) {
        this.currentClient = client;
        const isEdit = !!client;
        const modalContent = `
            <div class="modal-header"><h3>${isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h3></div>
            <div class="modal-body">
                <form id="client-form">
                    <div class="form-group"><label>Nome *</label><input type="text" id="client-name" class="form-control" value="${client ? Utils.sanitizeHtml(client.name) : ''}" required></div>
                    <div class="form-group"><label>Telefone</label><input type="tel" id="client-phone" class="form-control" value="${client ? Utils.sanitizeHtml(client.phone || '') : ''}"></div>
                    <div class="form-group"><label>E-mail</label><input type="email" id="client-email" class="form-control" value="${client ? Utils.sanitizeHtml(client.email || '') : ''}"></div>
                    <div class="form-group"><label>CPF</label><input type="text" id="client-cpf" class="form-control" value="${client ? Utils.sanitizeHtml(client.cpf || '') : ''}"></div>
                    <div class="form-group"><label>Endereço</label><textarea id="client-address" class="form-control">${client ? Utils.sanitizeHtml(client.address || '') : ''}</textarea></div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                <button type="button" class="btn btn-primary" id="save-client-btn">Salvar</button>
            </div>`;
        app.showModal(modalContent);
        document.getElementById('save-client-btn').onclick = () => this.saveClient();
    }

    async saveClient() {
        const name = document.getElementById('client-name').value.trim();
        if (!name) {
            Notifications.error('O nome do cliente é obrigatório.');
            return;
        }

        const clientData = {
            id: this.currentClient ? this.currentClient.id : null,
            name: name,
            phone: document.getElementById('client-phone').value.trim(),
            email: document.getElementById('client-email').value.trim(),
            cpf: document.getElementById('client-cpf').value.trim(),
            address: document.getElementById('client-address').value.trim(),
        };

        if (StorageManager.saveClient(clientData)) {
            Notifications.success(`Cliente ${this.currentClient ? 'atualizado' : 'cadastrado'} com sucesso!`);
            app.closeModal();
            this.refresh();
        }
    }

    async deleteClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        const confirmed = await Notifications.confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`);
        if (confirmed) {
            if (StorageManager.deleteClient(clientId)) {
                Notifications.success('Cliente excluído com sucesso!');
                this.refresh();
            }
        }
    }

    editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) this.showClientForm(client);
    }
    
    refresh() {
        this.loadClients();
        this.filterAndRender();
    }
}
