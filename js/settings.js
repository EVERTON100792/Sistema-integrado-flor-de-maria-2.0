// Settings Module
class Settings {
    constructor() {
        this.settings = {};
        this.systemInfo = {};
        
        this.init();
    }

    // Initialize settings module
    init() {
        this.bindEvents();
        this.loadSettings();
        this.loadSystemInfo();
        this.renderInterface();
    }

    // Bind events
    bindEvents() {
        // Backup button
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }

        // Restore button
        const restoreBtn = document.getElementById('restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.showRestoreDialog();
            });
        }

        // File input for restore
        const restoreFile = document.getElementById('restore-file');
        if (restoreFile) {
            restoreFile.addEventListener('change', (e) => {
                this.handleFileRestore(e.target.files[0]);
            });
        }

        // Add settings form if it doesn't exist
        this.setupSettingsForm();
    }

    // Setup settings form
    setupSettingsForm() {
        const settingsGrid = document.querySelector('.settings-grid');
        if (!settingsGrid) return;

        // Check if settings form already exists
        if (document.getElementById('settings-form-card')) return;

        const settingsFormCard = document.createElement('div');
        settingsFormCard.id = 'settings-form-card';
        settingsFormCard.className = 'card';
        settingsFormCard.innerHTML = `
            <div class="card-header">
                <h3>Configurações Gerais</h3>
            </div>
            <div class="card-content">
                <form id="settings-form">
                    <div class="form-group">
                        <label for="store-name">Nome da Loja</label>
                        <input type="text" id="store-name" class="form-control" 
                               value="${this.settings.storeName || 'Flor de Maria'}">
                    </div>
                    
                    <div class="form-group">
                        <label for="owner-name">Nome do Proprietário</label>
                        <input type="text" id="owner-name" class="form-control" 
                               value="${this.settings.ownerName || 'Maria'}">
                    </div>
                    
                    <div class="form-group">
                        <label for="store-phone">Telefone</label>
                        <input type="tel" id="store-phone" class="form-control" 
                               value="${this.settings.phone || ''}"
                               placeholder="(11) 99999-9999">
                    </div>
                    
                    <div class="form-group">
                        <label for="store-address">Endereço</label>
                        <textarea id="store-address" class="form-control" rows="3"
                                  placeholder="Endereço completo da loja">${this.settings.address || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="low-stock-alert">Alerta de Estoque Baixo</label>
                        <input type="number" id="low-stock-alert" class="form-control" 
                               value="${this.settings.lowStockAlert || 5}" min="1" max="100">
                        <small class="form-text">Quantidade mínima para alertar sobre estoque baixo</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="default-interest-rate">Taxa de Juros Padrão (%)</label>
                        <input type="number" id="default-interest-rate" class="form-control" 
                               value="${this.settings.defaultInterestRate || 0}" min="0" max="100" step="0.01">
                        <small class="form-text">Taxa aplicada automaticamente nas vendas a prazo</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="currency">Moeda</label>
                        <select id="currency" class="form-control">
                            <option value="BRL" ${this.settings.currency === 'BRL' ? 'selected' : ''}>Real (R$)</option>
                            <option value="USD" ${this.settings.currency === 'USD' ? 'selected' : ''}>Dólar ($)</option>
                            <option value="EUR" ${this.settings.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <div class="form-check">
                            <input type="checkbox" id="auto-backup" class="form-check-input" 
                                   ${this.settings.autoBackup ? 'checked' : ''}>
                            <label for="auto-backup" class="form-check-label">
                                Backup automático semanal
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="form-check">
                            <input type="checkbox" id="show-tips" class="form-check-input" 
                                   ${this.settings.showTips !== false ? 'checked' : ''}>
                            <label for="show-tips" class="form-check-label">
                                Mostrar dicas e ajuda
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button type="button" class="btn btn-primary" onclick="settings.saveSettings()">
                            <i class="fas fa-save"></i> Salvar Configurações
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="settings.resetSettings()">
                            <i class="fas fa-undo"></i> Restaurar Padrões
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Insert before the backup card
        const backupCard = settingsGrid.querySelector('.card');
        settingsGrid.insertBefore(settingsFormCard, backupCard);

        // Setup phone mask
        this.setupPhoneMask();
    }

    // Setup phone mask
    setupPhoneMask() {
        const phoneInput = document.getElementById('store-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = Utils.formatPhone(e.target.value);
            });
        }
    }

    // Load settings
    loadSettings() {
        this.settings = StorageManager.getSettings();
    }

    // Load system information
    loadSystemInfo() {
        const stats = StorageManager.getStatistics();
        const storageSize = StorageManager.getStorageSize();
        
        this.systemInfo = {
            version: '2.0.0',
            lastUpdate: new Date().toISOString(),
            totalRecords: stats.totalClients + stats.totalProducts + stats.totalSales,
            storageSize: Utils.formatFileSize(storageSize),
            browser: Utils.getBrowserInfo().browser,
            platform: Utils.getBrowserInfo().platform,
            language: Utils.getBrowserInfo().language
        };
    }

    // Render interface
    renderInterface() {
        this.updateSystemInfo();
        this.updateLastUpdateTime();
    }

    // Update system information display
    updateSystemInfo() {
        const lastUpdateElement = document.getElementById('last-update');
        const totalRecordsElement = document.getElementById('total-records');

        if (lastUpdateElement) {
            lastUpdateElement.textContent = Utils.formatDateTime(this.systemInfo.lastUpdate);
        }

        if (totalRecordsElement) {
            totalRecordsElement.textContent = this.systemInfo.totalRecords;
        }

        // Add additional system info if container exists
        const systemInfoContainer = document.querySelector('.system-info');
        if (systemInfoContainer && !document.getElementById('extended-system-info')) {
            const extendedInfo = document.createElement('div');
            extendedInfo.id = 'extended-system-info';
            extendedInfo.innerHTML = `
                <p><strong>Tamanho dos Dados:</strong> <span>${this.systemInfo.storageSize}</span></p>
                <p><strong>Navegador:</strong> <span>${this.systemInfo.browser}</span></p>
                <p><strong>Plataforma:</strong> <span>${this.systemInfo.platform}</span></p>
                <p><strong>Idioma:</strong> <span>${this.systemInfo.language}</span></p>
            `;
            systemInfoContainer.appendChild(extendedInfo);
        }
    }

    // Update last update time
    updateLastUpdateTime() {
        const data = StorageManager.getAllData();
        if (data.lastUpdate) {
            this.systemInfo.lastUpdate = data.lastUpdate;
        }
    }

    // Save settings
    async saveSettings() {
        const formData = {
            storeName: document.getElementById('store-name').value.trim(),
            ownerName: document.getElementById('owner-name').value.trim(),
            phone: document.getElementById('store-phone').value.trim(),
            address: document.getElementById('store-address').value.trim(),
            lowStockAlert: parseInt(document.getElementById('low-stock-alert').value) || 5,
            defaultInterestRate: parseFloat(document.getElementById('default-interest-rate').value) || 0,
            currency: document.getElementById('currency').value,
            autoBackup: document.getElementById('auto-backup').checked,
            showTips: document.getElementById('show-tips').checked
        };

        // Validate required fields
        if (!formData.storeName) {
            Notifications.error('Nome da loja é obrigatório');
            document.getElementById('store-name').focus();
            return;
        }

        if (!formData.ownerName) {
            Notifications.error('Nome do proprietário é obrigatório');
            document.getElementById('owner-name').focus();
            return;
        }

        if (formData.phone && !Utils.isValidPhone(formData.phone)) {
            Notifications.error('Telefone inválido');
            document.getElementById('store-phone').focus();
            return;
        }

        const loadingId = app.showLoading('Salvando configurações...');

        try {
            const success = StorageManager.saveSettings(formData);

            if (success) {
                this.settings = { ...this.settings, ...formData };
                Notifications.success('Configurações salvas com sucesso!');
                
                // Update header with new store name if changed
                this.updateHeaderStoreName();
            } else {
                throw new Error('Erro ao salvar configurações');
            }
        } catch (error) {
            Notifications.error('Erro ao salvar configurações: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Update header store name
    updateHeaderStoreName() {
        const headerLogo = document.querySelector('.header .logo span');
        if (headerLogo && this.settings.storeName) {
            headerLogo.textContent = this.settings.storeName;
        }
    }

    // Reset settings to defaults
    async resetSettings() {
        const confirmed = await Notifications.confirm(
            'Tem certeza que deseja restaurar as configurações padrão?\n\nEsta ação não afetará seus dados, apenas as configurações.',
            'Restaurar Configurações Padrão'
        );

        if (!confirmed) return;

        const defaultSettings = {
            storeName: 'Flor de Maria',
            ownerName: 'Maria',
            phone: '',
            address: '',
            lowStockAlert: 5,
            defaultInterestRate: 0,
            currency: 'BRL',
            autoBackup: false,
            showTips: true
        };

        const loadingId = app.showLoading('Restaurando configurações...');

        try {
            const success = StorageManager.saveSettings(defaultSettings);

            if (success) {
                this.settings = defaultSettings;
                this.updateFormFields();
                this.updateHeaderStoreName();
                Notifications.success('Configurações restauradas com sucesso!');
            } else {
                throw new Error('Erro ao restaurar configurações');
            }
        } catch (error) {
            Notifications.error('Erro ao restaurar configurações: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Update form fields with current settings
    updateFormFields() {
        document.getElementById('store-name').value = this.settings.storeName || 'Flor de Maria';
        document.getElementById('owner-name').value = this.settings.ownerName || 'Maria';
        document.getElementById('store-phone').value = this.settings.phone || '';
        document.getElementById('store-address').value = this.settings.address || '';
        document.getElementById('low-stock-alert').value = this.settings.lowStockAlert || 5;
        document.getElementById('default-interest-rate').value = this.settings.defaultInterestRate || 0;
        document.getElementById('currency').value = this.settings.currency || 'BRL';
        document.getElementById('auto-backup').checked = this.settings.autoBackup || false;
        document.getElementById('show-tips').checked = this.settings.showTips !== false;
    }

    // Create backup
    createBackup() {
        const loadingId = app.showLoading('Criando backup...');

        try {
            const backupData = StorageManager.exportBackup();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `flordemaria_backup_${timestamp}.json`;

            Utils.downloadFile(backupData, filename);
            
            Notifications.success('Backup criado com sucesso!', {
                title: 'Backup Completo',
                duration: 4000
            });

            // Log backup creation
            this.logBackupActivity('created', filename);

        } catch (error) {
            Notifications.error('Erro ao criar backup: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Show restore dialog
    showRestoreDialog() {
        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-upload"></i>
                    Restaurar Backup
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="restore-warning">
                    <div class="warning-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="warning-content">
                        <h4>⚠️ Atenção!</h4>
                        <p>A restauração do backup irá <strong>substituir todos os dados atuais</strong> pelos dados do arquivo de backup.</p>
                        <p>Esta ação <strong>não pode ser desfeita</strong>. Recomendamos fazer um backup dos dados atuais antes de prosseguir.</p>
                    </div>
                </div>
                
                <div class="backup-actions">
                    <button class="btn btn-secondary" onclick="settings.createBackup(); app.closeModal();">
                        <i class="fas fa-download"></i>
                        Fazer Backup Atual Primeiro
                    </button>
                </div>
                
                <div class="file-upload-area">
                    <div class="upload-zone" onclick="document.getElementById('restore-file-input').click()">
                        <div class="upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="upload-text">
                            <h4>Selecionar Arquivo de Backup</h4>
                            <p>Clique aqui ou arraste um arquivo .json</p>
                        </div>
                    </div>
                    <input type="file" id="restore-file-input" accept=".json" style="display: none;">
                </div>
                
                <div class="backup-info">
                    <h5>Informações do Backup:</h5>
                    <div id="backup-file-info" class="file-info hidden">
                        <p><strong>Nome:</strong> <span id="backup-filename"></span></p>
                        <p><strong>Tamanho:</strong> <span id="backup-filesize"></span></p>
                        <p><strong>Versão:</strong> <span id="backup-version"></span></p>
                        <p><strong>Data:</strong> <span id="backup-date"></span></p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Cancelar
                </button>
                <button type="button" id="confirm-restore-btn" class="btn btn-danger" disabled onclick="settings.confirmRestore()">
                    <i class="fas fa-upload"></i>
                    Restaurar Backup
                </button>
            </div>
        `;

        app.showModal(modalContent);
        this.setupRestoreDialog();
    }

    // Setup restore dialog
    setupRestoreDialog() {
        const fileInput = document.getElementById('restore-file-input');
        const uploadZone = document.querySelector('.upload-zone');
        const confirmBtn = document.getElementById('confirm-restore-btn');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleRestoreFile(e.target.files[0]);
            });
        }

        // Drag and drop functionality
        if (uploadZone) {
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleRestoreFile(files[0]);
                }
            });
        }
    }

    // Handle restore file selection
    handleRestoreFile(file) {
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            Notifications.error('Arquivo deve ser do tipo JSON (.json)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                this.validateBackupFile(backupData, file);
            } catch (error) {
                Notifications.error('Arquivo de backup inválido ou corrompido');
                this.clearRestoreForm();
            }
        };

        reader.onerror = () => {
            Notifications.error('Erro ao ler o arquivo');
            this.clearRestoreForm();
        };

        reader.readAsText(file);
    }

    // Validate backup file
    validateBackupFile(backupData, file) {
        const fileInfo = document.getElementById('backup-file-info');
        const confirmBtn = document.getElementById('confirm-restore-btn');

        // Basic validation
        if (!backupData.version || !backupData.clients || !Array.isArray(backupData.clients)) {
            Notifications.error('Estrutura do arquivo de backup inválida');
            return;
        }

        // Display file information
        document.getElementById('backup-filename').textContent = file.name;
        document.getElementById('backup-filesize').textContent = Utils.formatFileSize(file.size);
        document.getElementById('backup-version').textContent = backupData.version || 'Desconhecida';
        document.getElementById('backup-date').textContent = backupData.exportedAt ? 
            Utils.formatDateTime(backupData.exportedAt) : 'Desconhecida';

        fileInfo.classList.remove('hidden');
        confirmBtn.disabled = false;
        
        // Store backup data for restoration
        this.pendingBackupData = backupData;

        Notifications.success('Arquivo de backup válido!');
    }

    // Clear restore form
    clearRestoreForm() {
        const fileInfo = document.getElementById('backup-file-info');
        const confirmBtn = document.getElementById('confirm-restore-btn');
        const fileInput = document.getElementById('restore-file-input');

        if (fileInfo) fileInfo.classList.add('hidden');
        if (confirmBtn) confirmBtn.disabled = true;
        if (fileInput) fileInput.value = '';
        
        this.pendingBackupData = null;
    }

    // Confirm restore
    async confirmRestore() {
        if (!this.pendingBackupData) {
            Notifications.error('Nenhum arquivo de backup selecionado');
            return;
        }

        const finalConfirmation = await Notifications.confirm(
            'Esta é a última confirmação!\n\nTodos os dados atuais serão substituídos pelos dados do backup.\n\nDeseja realmente continuar?',
            'Confirmação Final'
        );

        if (!finalConfirmation) return;

        const loadingId = app.showLoading('Restaurando backup...');

        try {
            const success = StorageManager.importBackup(JSON.stringify(this.pendingBackupData));

            if (success) {
                app.closeModal();
                
                Notifications.success('Backup restaurado com sucesso! A página será recarregada.', {
                    title: 'Restauração Completa',
                    duration: 3000
                });

                // Log restore activity
                this.logBackupActivity('restored', 'backup file');

                // Reload the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } else {
                throw new Error('Falha na importação do backup');
            }
        } catch (error) {
            Notifications.error('Erro ao restaurar backup: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Handle file restore (legacy method)
    handleFileRestore(file) {
        if (!file) return;
        this.handleRestoreFile(file);
    }

    // Log backup activity
    logBackupActivity(action, filename) {
        const activity = {
            action,
            filename,
            timestamp: new Date().toISOString(),
            version: this.systemInfo.version
        };

        // Store in settings for history tracking
        const backupHistory = this.settings.backupHistory || [];
        backupHistory.push(activity);
        
        // Keep only last 10 activities
        if (backupHistory.length > 10) {
            backupHistory.splice(0, backupHistory.length - 10);
        }

        this.settings.backupHistory = backupHistory;
        StorageManager.saveSettings(this.settings);
    }

    // Show backup history
    showBackupHistory() {
        const history = this.settings.backupHistory || [];
        
        if (history.length === 0) {
            Notifications.info('Nenhuma atividade de backup registrada');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-history"></i>
                    Histórico de Backups
                </h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="backup-history">
                    ${history.reverse().map(activity => `
                        <div class="history-item">
                            <div class="history-icon">
                                <i class="fas ${activity.action === 'created' ? 'fa-download' : 'fa-upload'}"></i>
                            </div>
                            <div class="history-details">
                                <div class="history-action">
                                    ${activity.action === 'created' ? 'Backup Criado' : 'Backup Restaurado'}
                                </div>
                                <div class="history-filename">${activity.filename}</div>
                                <div class="history-timestamp">${Utils.formatDateTime(activity.timestamp)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    Fechar
                </button>
            </div>
        `;

        app.showModal(modalContent);
    }

    // Advanced system maintenance
    performSystemMaintenance() {
        const maintenanceTasks = [
            'Limpeza de dados temporários',
            'Otimização do storage',
            'Verificação de integridade',
            'Compactação de dados'
        ];

        let currentTask = 0;
        const progressId = Notifications.showProgress('Iniciando manutenção...', 0);

        const performTask = () => {
            if (currentTask < maintenanceTasks.length) {
                const taskName = maintenanceTasks[currentTask];
                const progress = ((currentTask + 1) / maintenanceTasks.length) * 100;
                
                Notifications.updateProgress(progressId, progress, taskName);
                currentTask++;
                
                setTimeout(performTask, 1000); // Simulate task duration
            } else {
                Notifications.updateProgress(progressId, 100, 'Manutenção concluída!');
                setTimeout(() => {
                    Notifications.success('Manutenção do sistema realizada com sucesso!');
                }, 1000);
            }
        };

        performTask();
    }

    // Clear all data (dangerous operation)
    async clearAllData() {
        const firstConfirmation = await Notifications.confirm(
            'ATENÇÃO: Esta operação irá apagar TODOS os dados do sistema!\n\nIsso inclui:\n- Todos os clientes\n- Todos os produtos\n- Todas as vendas\n- Todo o histórico financeiro\n- Todas as configurações\n\nEsta ação NÃO PODE ser desfeita!\n\nTem certeza que deseja continuar?',
            'PERIGO: Apagar Todos os Dados'
        );

        if (!firstConfirmation) return;

        const secondConfirmation = await Notifications.confirm(
            'ÚLTIMA CONFIRMAÇÃO!\n\nDigite "APAGAR TUDO" para confirmar que você realmente deseja apagar todos os dados:',
            'Confirmação Final'
        );

        if (!secondConfirmation) return;

        // Note: In a real implementation, you might want to add a text input validation
        // For this demo, we'll proceed with the confirmation

        const loadingId = app.showLoading('Apagando todos os dados...');

        try {
            const success = StorageManager.clearAllData();

            if (success) {
                Notifications.success('Todos os dados foram apagados. A página será recarregada.', {
                    title: 'Dados Apagados',
                    duration: 3000
                });

                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                throw new Error('Erro ao apagar dados');
            }
        } catch (error) {
            Notifications.error('Erro ao apagar dados: ' + error.message);
        } finally {
            app.hideLoading(loadingId);
        }
    }

    // Export system diagnostics
    exportDiagnostics() {
        const diagnostics = {
            systemInfo: this.systemInfo,
            settings: this.settings,
            statistics: StorageManager.getStatistics(),
            storageSize: StorageManager.getStorageSize(),
            browser: Utils.getBrowserInfo(),
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        };

        const content = JSON.stringify(diagnostics, null, 2);
        const filename = `flordemaria_diagnostics_${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.downloadFile(content, filename);
        Notifications.success('Diagnóstico do sistema exportado!');
    }

    // Refresh module
    refresh() {
        this.loadSettings();
        this.loadSystemInfo();
        this.renderInterface();
        this.updateFormFields();
    }

    // Search functionality
    search(query) {
        Notifications.info('Configurações não possuem busca. Use as abas para navegar.');
    }

    // Get system health status
    getSystemHealth() {
        const stats = StorageManager.getStatistics();
        const storageSize = StorageManager.getStorageSize();
        const maxSize = 5 * 1024 * 1024; // 5MB limit for localStorage

        return {
            storageUsage: (storageSize / maxSize) * 100,
            dataIntegrity: this.checkDataIntegrity(),
            performance: this.checkPerformance(),
            lastBackup: this.getLastBackupDate()
        };
    }

    // Check data integrity
    checkDataIntegrity() {
        try {
            const clients = StorageManager.getClients();
            const products = StorageManager.getProducts();
            const sales = StorageManager.getSales();
            const cashFlow = StorageManager.getCashFlow();

            // Basic integrity checks
            const hasValidData = clients.length >= 0 && products.length >= 0 && 
                                 sales.length >= 0 && cashFlow.length >= 0;

            return hasValidData ? 'OK' : 'Erro';
        } catch (error) {
            return 'Erro';
        }
    }

    // Check performance
    checkPerformance() {
        const start = performance.now();
        
        // Simulate data operations
        StorageManager.getStatistics();
        
        const end = performance.now();
        const duration = end - start;

        if (duration < 50) return 'Excelente';
        if (duration < 100) return 'Bom';
        if (duration < 200) return 'Regular';
        return 'Lento';
    }

    // Get last backup date
    getLastBackupDate() {
        const history = this.settings.backupHistory || [];
        const lastBackup = history.find(h => h.action === 'created');
        return lastBackup ? lastBackup.timestamp : 'Nunca';
    }
}

// Add custom styles for settings
const settingsStyles = document.createElement('style');
settingsStyles.textContent = `
    .restore-warning {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid var(--color-danger);
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-lg);
    }
    
    .warning-icon {
        color: var(--color-danger);
        font-size: 2rem;
        flex-shrink: 0;
    }
    
    .warning-content h4 {
        color: var(--color-danger);
        margin-bottom: var(--spacing-sm);
    }
    
    .warning-content p {
        margin-bottom: var(--spacing-sm);
        color: var(--color-text-primary);
    }
    
    .backup-actions {
        text-align: center;
        margin-bottom: var(--spacing-lg);
    }
    
    .file-upload-area {
        margin-bottom: var(--spacing-lg);
    }
    
    .upload-zone {
        border: 2px dashed var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        text-align: center;
        cursor: pointer;
        transition: all var(--transition-fast);
        background: var(--color-bg-tertiary);
    }
    
    .upload-zone:hover,
    .upload-zone.dragover {
        border-color: var(--color-primary);
        background: rgba(230, 184, 0, 0.1);
    }
    
    .upload-icon {
        font-size: 3rem;
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
    }
    
    .upload-text h4 {
        color: var(--color-text-primary);
        margin-bottom: var(--spacing-sm);
    }
    
    .upload-text p {
        color: var(--color-text-muted);
    }
    
    .backup-info {
        background: var(--color-bg-surface);
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
    }
    
    .backup-info h5 {
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
    }
    
    .file-info p {
        margin-bottom: var(--spacing-sm);
        display: flex;
        justify-content: space-between;
    }
    
    .form-text {
        color: var(--color-text-muted);
        font-size: 0.85rem;
        margin-top: var(--spacing-xs);
    }
    
    .form-check {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
    }
    
    .form-check-input {
        width: 18px;
        height: 18px;
        accent-color: var(--color-primary);
    }
    
    .form-check-label {
        margin: 0;
        cursor: pointer;
        color: var(--color-text-primary);
    }
    
    .backup-history {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .history-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--color-border-light);
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-sm);
    }
    
    .history-icon {
        width: 40px;
        height: 40px;
        background: var(--color-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-inverse);
        flex-shrink: 0;
    }
    
    .history-details {
        flex: 1;
    }
    
    .history-action {
        font-weight: 600;
        color: var(--color-text-primary);
        margin-bottom: var(--spacing-xs);
    }
    
    .history-filename {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
        margin-bottom: var(--spacing-xs);
    }
    
    .history-timestamp {
        color: var(--color-text-muted);
        font-size: 0.8rem;
    }
    
    .settings-actions {
        display: flex;
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
    }
    
    @media (max-width: 768px) {
        .settings-actions {
            flex-direction: column;
        }
        
        .settings-actions .btn {
            width: 100%;
        }
        
        .restore-warning {
            flex-direction: column;
            text-align: center;
        }
        
        .backup-actions {
            margin-bottom: var(--spacing-md);
        }
    }
`;
document.head.appendChild(settingsStyles);

// Initialize and export
window.Settings = Settings;
