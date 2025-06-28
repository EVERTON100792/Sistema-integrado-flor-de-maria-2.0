// Authentication Module
class Auth {
    constructor() {
        this.credentials = {
            username: 'maria',
            password: 'flor123'
        };
        
        this.init();
    }

    // Initialize authentication
    init() {
        this.bindLoginForm();
        this.setupLoginAnimation();
    }

    // Bind login form events
    bindLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Add input event listeners for real-time validation
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                this.clearError(usernameInput);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.clearError(passwordInput);
            });
        }

        // Add enter key support
        [usernameInput, passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });
            }
        });
    }

    // Setup login screen animations
    setupLoginAnimation() {
        // Add staggered animation to floating shapes
        const shapes = document.querySelectorAll('.shape');
        shapes.forEach((shape, index) => {
            shape.style.animationDelay = `${index * 2}s`;
        });

        // Add typing effect to login title
        this.addTypingEffect();
    }

    // Add typing effect to title
    addTypingEffect() {
        const titleElement = document.querySelector('.login-header h1');
        if (!titleElement) return;

        const originalText = titleElement.textContent;
        titleElement.textContent = '';
        titleElement.style.borderRight = '2px solid var(--color-primary)';

        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < originalText.length) {
                titleElement.textContent += originalText.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    titleElement.style.borderRight = 'none';
                }, 1000);
            }
        }, 100);
    }

    // Handle login process
    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('.login-btn');

        // Clear previous errors
        this.clearAllErrors();

        // Validate inputs
        if (!this.validateInputs(username, password)) {
            return;
        }

        // Show loading state
        this.setLoginLoading(true);

        try {
            // Simulate API call delay for better UX
            await this.delay(1500);

            // Check credentials
            if (this.authenticateUser(username, password)) {
                this.onLoginSuccess();
            } else {
                this.onLoginFailure('Usuário ou senha incorretos');
            }
        } catch (error) {
            this.onLoginFailure('Erro interno. Tente novamente.');
        } finally {
            this.setLoginLoading(false);
        }
    }

    // Validate login inputs
    validateInputs(username, password) {
        let isValid = true;

        if (!username) {
            this.showFieldError('username', 'Nome de usuário é obrigatório');
            isValid = false;
        }

        if (!password) {
            this.showFieldError('password', 'Senha é obrigatória');
            isValid = false;
        }

        if (password && password.length < 3) {
            this.showFieldError('password', 'Senha deve ter pelo menos 3 caracteres');
            isValid = false;
        }

        return isValid;
    }

    // Authenticate user
    authenticateUser(username, password) {
        return username === this.credentials.username && 
               password === this.credentials.password;
    }

    // Handle successful login
    onLoginSuccess() {
        // Save authentication state
        this.setAuthenticationState(true);
        
        // Add success animation
        this.playSuccessAnimation();

        // Notify app of successful authentication
        setTimeout(() => {
            if (window.app) {
                window.app.onAuthenticationSuccess();
            }
        }, 1000);
    }

    // Handle failed login
    onLoginFailure(message) {
        this.playErrorAnimation();
        
        // Show error after animation
        setTimeout(() => {
            Notifications.error(message, {
                title: 'Erro de Autenticação'
            });
        }, 500);

        if (window.app) {
            window.app.onAuthenticationFailure(message);
        }
    }

    // Play success animation
    playSuccessAnimation() {
        const loginCard = document.querySelector('.login-card');
        const loginBtn = document.querySelector('.login-btn');

        // Change button to success state
        loginBtn.innerHTML = `
            <i class="fas fa-check"></i>
            <span>Sucesso!</span>
        `;
        loginBtn.style.background = 'linear-gradient(135deg, var(--color-success) 0%, #45b049 100%)';

        // Scale up and fade out card
        loginCard.style.transform = 'scale(1.05)';
        loginCard.style.opacity = '0.8';

        // Add particles effect
        this.createParticlesEffect();
    }

    // Play error animation
    playErrorAnimation() {
        const loginCard = document.querySelector('.login-card');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        // Shake animation
        loginCard.style.animation = 'shake 0.5s ease-in-out';
        
        // Reset animation
        setTimeout(() => {
            loginCard.style.animation = '';
        }, 500);

        // Add error state to inputs
        [usernameInput, passwordInput].forEach(input => {
            if (input) {
                input.style.borderColor = 'var(--color-danger)';
                input.style.background = 'rgba(255, 107, 107, 0.1)';
            }
        });
    }

    // Create particles effect
    createParticlesEffect() {
        const container = document.querySelector('.login-container');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: var(--color-primary);
                border-radius: 50%;
                pointer-events: none;
                left: 50%;
                top: 50%;
                opacity: 1;
                animation: particle-explosion 1s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
                transform: translate(-50%, -50%);
            `;
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1300);
        }
    }

    // Show field error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const inputGroup = field.closest('.input-group');
        
        // Add error class
        inputGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = inputGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        inputGroup.appendChild(errorElement);
        
        // Focus field
        field.focus();
    }

    // Clear field error
    clearError(field) {
        const inputGroup = field.closest('.input-group');
        inputGroup.classList.remove('error');
        
        const errorMessage = inputGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
        
        // Reset field styles
        field.style.borderColor = '';
        field.style.background = '';
    }

    // Clear all errors
    clearAllErrors() {
        const errorInputs = document.querySelectorAll('.input-group.error');
        errorInputs.forEach(inputGroup => {
            inputGroup.classList.remove('error');
            
            const errorMessage = inputGroup.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });

        // Reset input styles
        const inputs = document.querySelectorAll('#username, #password');
        inputs.forEach(input => {
            input.style.borderColor = '';
            input.style.background = '';
        });
    }

    // Set login loading state
    setLoginLoading(loading) {
        const loginBtn = document.querySelector('.login-btn');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            usernameInput.disabled = true;
            passwordInput.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            usernameInput.disabled = false;
            passwordInput.disabled = false;
            
            // Reset button content
            loginBtn.innerHTML = `
                <span>Entrar</span>
                <i class="fas fa-arrow-right"></i>
            `;
        }
    }

    // Set authentication state
    setAuthenticationState(authenticated) {
        const sessionData = {
            authenticated,
            timestamp: new Date().toISOString(),
            username: authenticated ? this.credentials.username : null
        };
        
        localStorage.setItem('flordemaria_session', JSON.stringify(sessionData));
    }

    // Check if user is authenticated
    static isAuthenticated() {
        try {
            const sessionData = localStorage.getItem('flordemaria_session');
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            
            // Check if session is valid (within 24 hours)
            const sessionTime = new Date(session.timestamp);
            const now = new Date();
            const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
            
            return session.authenticated && hoursDiff < 24;
        } catch (error) {
            return false;
        }
    }

    // Get current user
    static getCurrentUser() {
        try {
            const sessionData = localStorage.getItem('flordemaria_session');
            if (!sessionData) return null;
            
            const session = JSON.parse(sessionData);
            return session.authenticated ? { username: session.username } : null;
        } catch (error) {
            return null;
        }
    }

    // Logout user
    static logout() {
        localStorage.removeItem('flordemaria_session');
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Add forgot password functionality
    showForgotPassword() {
        Notifications.info('Entre em contato com o administrador para redefinir sua senha.', {
            title: 'Esqueceu a senha?',
            duration: 8000
        });
    }

    // Add remember me functionality
    toggleRememberMe() {
        // Implementation for remember me functionality
        const checkbox = document.getElementById('remember-me');
        if (checkbox) {
            const shouldRemember = checkbox.checked;
            localStorage.setItem('flordemaria_remember', shouldRemember);
        }
    }

    // Auto-fill saved credentials
    autoFillCredentials() {
        const shouldRemember = localStorage.getItem('flordemaria_remember') === 'true';
        if (shouldRemember) {
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.value = this.credentials.username;
            }
        }
    }
}

// Add CSS for animations
const authStyles = document.createElement('style');
authStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes particle-explosion {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(
                calc(-50% + ${Math.random() * 200 - 100}px), 
                calc(-50% + ${Math.random() * 200 - 100}px)
            ) scale(0);
            opacity: 0;
        }
    }
    
    .input-group.error input {
        border-color: var(--color-danger) !important;
        background: rgba(255, 107, 107, 0.1) !important;
    }
    
    .input-group.error i {
        color: var(--color-danger) !important;
    }
`;
document.head.appendChild(authStyles);

// Initialize authentication
window.Auth = new Auth();
