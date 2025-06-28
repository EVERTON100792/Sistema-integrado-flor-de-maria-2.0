// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
    }

    // Show notification
    show(message, type = 'info', options = {}) {
        const notification = this.createNotification(message, type, options);
        this.addNotification(notification);
        return notification.id;
    }

    // Show success notification
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    // Show error notification
    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: 8000 });
    }

    // Show warning notification
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    // Show info notification
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Create notification element
    createNotification(message, type, options) {
        const id = Utils.generateId();
        const duration = options.duration || this.defaultDuration;
        const title = options.title || this.getDefaultTitle(type);
        const persistent = options.persistent || false;

        const notificationElement = document.createElement('div');
        notificationElement.className = `toast ${type}`;
        notificationElement.setAttribute('data-id', id);

        notificationElement.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${this.getIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" type="button">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add click event to close button
        const closeBtn = notificationElement.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hide(id);
        });

        // Auto-hide after duration (if not persistent)
        let timeoutId = null;
        if (!persistent && duration > 0) {
            timeoutId = setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        const notification = {
            id,
            element: notificationElement,
            type,
            message,
            title,
            duration,
            persistent,
            timeoutId,
            createdAt: new Date()
        };

        return notification;
    }

    // Add notification to container
    addNotification(notification) {
        // Remove oldest notification if max limit reached
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications[0];
            this.hide(oldest.id);
        }

        // Add to notifications array
        this.notifications.push(notification);

        // Add to DOM
        this.container.appendChild(notification.element);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
    }

    // Hide notification
    hide(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        // Clear timeout
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }

        // Add hiding animation
        notification.element.classList.add('hiding');

        // Remove after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            // Remove from notifications array
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    // Hide all notifications
    hideAll() {
        this.notifications.forEach(notification => {
            this.hide(notification.id);
        });
    }

    // Get default title for notification type
    getDefaultTitle(type) {
        const titles = {
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Atenção!',
            info: 'Informação'
        };
        return titles[type] || 'Notificação';
    }

    // Get icon for notification type
    getIcon(type) {
        const icons = {
            success: 'fa-check',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation',
            info: 'fa-info'
        };
        return icons[type] || 'fa-bell';
    }

    // Show confirmation dialog
    async confirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(message, title, resolve);
            document.body.appendChild(modal);
            modal.classList.remove('hidden');
        });
    }

    // Create confirmation modal
    createConfirmModal(message, title, callback) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="width: 400px;">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary confirm-cancel">Cancelar</button>
                    <button class="btn btn-danger confirm-ok">Confirmar</button>
                </div>
            </div>
        `;

        // Add event listeners
        const cancelBtn = modal.querySelector('.confirm-cancel');
        const okBtn = modal.querySelector('.confirm-ok');
        
        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
            callback(false);
        });
        
        okBtn.addEventListener('click', () => {
            this.closeModal(modal);
            callback(true);
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
                callback(false);
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                callback(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return modal;
    }

    // Close modal
    closeModal(modal) {
        modal.classList.add('hidden');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    // Show loading notification
    showLoading(message = 'Carregando...') {
        return this.show(message, 'info', {
            persistent: true,
            title: 'Aguarde'
        });
    }

    // Hide loading notification
    hideLoading(id) {
        if (id) {
            this.hide(id);
        } else {
            // Hide all loading notifications
            this.notifications
                .filter(n => n.persistent && n.title === 'Aguarde')
                .forEach(n => this.hide(n.id));
        }
    }

    // Show progress notification
    showProgress(message, progress = 0) {
        const id = Utils.generateId();
        const notificationElement = document.createElement('div');
        notificationElement.className = 'toast info';
        notificationElement.setAttribute('data-id', id);

        notificationElement.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">Processando</div>
                <div class="toast-message">${message}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;

        const notification = {
            id,
            element: notificationElement,
            type: 'progress',
            message,
            persistent: true,
            progress,
            createdAt: new Date()
        };

        this.addNotification(notification);
        return id;
    }

    // Update progress notification
    updateProgress(id, progress, message = null) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        const progressFill = notification.element.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (message) {
            const messageElement = notification.element.querySelector('.toast-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }

        // Auto-hide when complete
        if (progress >= 100) {
            setTimeout(() => {
                this.hide(id);
            }, 2000);
        }
    }

    // Show system notification (browser notification)
    async showSystemNotification(title, message, options = {}) {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: options.icon || '/favicon.ico',
                ...options
            });
            return true;
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: options.icon || '/favicon.ico',
                    ...options
                });
                return true;
            }
        }

        return false;
    }

    // Clear old notifications
    clearOld(maxAge = 30000) { // 30 seconds
        const now = new Date();
        this.notifications
            .filter(n => !n.persistent && (now - n.createdAt) > maxAge)
            .forEach(n => this.hide(n.id));
    }

    // Get notification count
    getCount() {
        return this.notifications.length;
    }

    // Get notifications by type
    getByType(type) {
        return this.notifications.filter(n => n.type === type);
    }

    // Set max notifications
    setMaxNotifications(max) {
        this.maxNotifications = max;
    }

    // Set default duration
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }
}

// Initialize notification manager and make it globally available
window.Notifications = new NotificationManager();

// Add CSS for progress bar if not already present
const style = document.createElement('style');
style.textContent = `
    .progress-bar {
        width: 100%;
        height: 4px;
        background: var(--color-bg-surface);
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.3s ease;
        border-radius: 2px;
    }
`;
document.head.appendChild(style);
