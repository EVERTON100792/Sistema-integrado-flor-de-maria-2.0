// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
        }
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
    }

    show(message, type = 'info', options = {}) {
        const id = Utils.generateId();
        const duration = options.duration !== undefined ? options.duration : this.defaultDuration;
        const title = options.title || this.getDefaultTitle(type);
        const persistent = options.persistent || false;

        const notificationElement = document.createElement('div');
        notificationElement.className = `toast ${type}`;
        notificationElement.dataset.id = id;

        notificationElement.innerHTML = `
            <div class="toast-icon"><i class="fas ${this.getIcon(type)}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${Utils.sanitizeHtml(title)}</div>
                <div class="toast-message">${Utils.sanitizeHtml(message)}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>`;

        notificationElement.querySelector('.toast-close').onclick = () => this.hide(id);
        
        const timeoutId = (persistent || duration <= 0) ? null : setTimeout(() => this.hide(id), duration);
        
        const notification = { id, element: notificationElement, timeoutId };
        this.addNotification(notification);
        return id;
    }
    
    addNotification(notification) {
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.hide(oldest.id, true);
        }
        this.notifications.push(notification);
        this.container.appendChild(notification.element);
        requestAnimationFrame(() => notification.element.classList.add('show'));
    }

    hide(id, immediate = false) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const [notification] = this.notifications.splice(index, 1);
        if (notification.timeoutId) clearTimeout(notification.timeoutId);
        
        if (immediate) {
             if (notification.element.parentNode) notification.element.parentNode.removeChild(notification.element);
        } else {
            notification.element.classList.add('hiding');
            notification.element.addEventListener('transitionend', () => {
                if (notification.element.parentNode) notification.element.parentNode.removeChild(notification.element);
            });
        }
    }

    success(message, options = {}) { return this.show(message, 'success', options); }
    error(message, options = {}) { return this.show(message, 'error', { duration: 6000, ...options }); }
    info(message, options = {}) { return this.show(message, 'info', options); }
    warning(message, options = {}) { return this.show(message, 'warning', options); }

    showLoading(message = 'Carregando...') {
        return this.show(message, 'loading', { persistent: true, title: 'Aguarde' });
    }
    
    hideLoading(id) {
        if (id) this.hide(id);
    }
    
    async confirm(message, title = 'Confirmação') {
        return new Promise(resolve => {
            const id = Utils.generateId();
            const modalContent = `
                <div class="modal-header"><h3>${Utils.sanitizeHtml(title)}</h3></div>
                <div class="modal-body"><p>${Utils.sanitizeHtml(message)}</p></div>
                <div class="modal-footer">
                    <button id="confirm-cancel-${id}" class="btn btn-secondary">Cancelar</button>
                    <button id="confirm-ok-${id}" class="btn btn-danger">Confirmar</button>
                </div>`;
            
            window.app.showModal(modalContent);

            const okBtn = document.getElementById(`confirm-ok-${id}`);
            const cancelBtn = document.getElementById(`confirm-cancel-${id}`);

            okBtn.onclick = () => { window.app.closeModal(); resolve(true); };
            cancelBtn.onclick = () => { window.app.closeModal(); resolve(false); };
        });
    }

    getDefaultTitle(type) {
        const titles = { success: 'Sucesso!', error: 'Erro!', warning: 'Atenção!', info: 'Informação', loading: 'Processando...' };
        return titles[type] || 'Notificação';
    }

    getIcon(type) {
        const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle', loading: 'fa-spinner fa-spin' };
        return icons[type] || 'fa-bell';
    }
}

window.Notifications = new NotificationManager();
