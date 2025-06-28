// Utility Functions
class Utils {
    // Format currency to Brazilian Real
    static formatCurrency(value) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Parse currency string to number
    static parseCurrency(currencyString) {
        if (typeof currencyString === 'number') return currencyString;
        if (!currencyString) return 0;
        return parseFloat(currencyString.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    }

    // Format date to Brazilian format
    static formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Corrige o problema de fuso horário adicionando o tempo UTC
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);
        return new Intl.DateTimeFormat('pt-BR').format(correctedDate);
    }

    // Format datetime to Brazilian format
    static formatDateTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Get current date in YYYY-MM-DD format
    static getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone (Brazilian format)
    static isValidPhone(phone) {
        const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    }

    // Format phone number
    static formatPhone(phone) {
        const cleaned = (phone || '').replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    }

    // Validate CPF (Brazilian tax ID)
    static isValidCPF(cpf) {
        cpf = (cpf || '').replace(/\D/g, '');

        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;

        return true;
    }

    // Format CPF
    static formatCPF(cpf) {
        const cleaned = (cpf || '').replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
        if (match) {
            return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
        }
        return cpf;
    }

    // Check if date is overdue
    static isOverdue(dateStr) {
        const today = new Date();
        const compareDate = new Date(dateStr);
        today.setHours(0, 0, 0, 0);
        compareDate.setHours(23, 59, 59, 999); // Consider the entire day
        return compareDate < today;
    }

    // Get days between dates
    static daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((new Date(date1) - new Date(date2)) / oneDay));
    }

    // Sanitize HTML
    static sanitizeHtml(str) {
        if (!str) return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Download file
    static downloadFile(content, filename, contentType = 'application/json') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Get browser info
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';
        
        return {
            browser,
            userAgent: ua,
            language: navigator.language,
            platform: navigator.platform
        };
    }
    
    // Generate WhatsApp link
    static generateWhatsAppLink(phone, message) {
        const cleanPhone = (phone || '').replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    }
    
    // Sort array of objects
    static sortArray(array, field, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Search in array of objects
    static searchInArray(array, searchTerm, fields) {
        if (!searchTerm) return array;
        const term = searchTerm.toString().toLowerCase();
        return array.filter(item => {
            return fields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    }

    // To Slug
     static toSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
}
