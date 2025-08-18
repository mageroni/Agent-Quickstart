/**
 * Application configuration constants
 */
const APP_CONFIG = {
    API: {
        GITHUB_BASE_URL: 'https://api.github.com',
        GITHUB_GRAPHQL_URL: 'https://api.github.com/graphql',
        RATE_LIMIT_DELAY: 1000,
        REQUEST_TIMEOUT: 30000
    },
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 50,
        MAX_ITEMS: 5000
    },
    UI: {
        AUTO_ADVANCE_DELAY: 500,
        NOTIFICATION_DURATION: 3000
    },
    PROMPTS: {
        BASE_URL: 'https://raw.githubusercontent.com/github/awesome-copilot/refs/heads/main',
        TESTS: '/prompts/breakdown-test.prompt.md',
        DOCUMENTATION: '/prompts/project-workflow-analysis-blueprint-generator.prompt.md',
        TECHNICAL_DEBT: '/chatmodes/tdd-refactor.chatmode.md'
    }
};

/**
 * Input validation and sanitization utilities
 */
const ValidationUtils = {
    /**
     * Sanitize string input to prevent XSS
     * @param {string} input - Input string to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeString(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/[<>'"&]/g, '');
    },

    /**
     * Validate GitHub organization name
     * @param {string} orgName - Organization name to validate
     * @returns {boolean} True if valid
     */
    isValidOrgName(orgName) {
        if (!orgName || typeof orgName !== 'string') return false;
        const sanitized = this.sanitizeString(orgName.trim());
        return /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(sanitized);
    },

    /**
     * Validate GitHub token format (basic check)
     * @param {string} token - Token to validate
     * @returns {boolean} True if valid format
     */
    isValidToken(token) {
        if (!token || typeof token !== 'string') return false;
        const sanitized = token.trim();
        // GitHub tokens should be alphanumeric with underscores, minimum length
        return /^[a-zA-Z0-9_]{20,}$/.test(sanitized);
    }
};

/**
 * Centralized API utilities with enhanced error handling and security
 */
const APIUtils = {
    /**
     * Enhanced fetch with timeout, error handling, and security headers
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @param {number} timeout - Request timeout in milliseconds
     * @returns {Promise<Response>} Enhanced fetch response
     */
    async secureFetch(url, options = {}, timeout = APP_CONFIG.API.REQUEST_TIMEOUT) {
        // Add security headers and timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const secureOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                'User-Agent': 'GitHub-Copilot-Agent-Quickstart/1.0',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, secureOptions);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status, url);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new APIError('Request timeout', 408, url);
            }
            throw error instanceof APIError ? error : new APIError(error.message, 0, url);
        }
    },

    /**
     * GitHub API request with authentication and rate limiting
     * @param {string} endpoint - API endpoint (relative to GitHub API base)
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} JSON response
     */
    async githubAPI(endpoint, options = {}) {
        if (!appState.authToken) {
            throw new APIError('Authentication token required', 401);
        }
        
        const url = `${APP_CONFIG.API.GITHUB_BASE_URL}${endpoint}`;
        const headers = SecurityUtils.createAuthHeaders(appState.authToken);
        
        const response = await this.secureFetch(url, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
        
        return await response.json();
    },

    /**
     * GitHub GraphQL API request
     * @param {string} query - GraphQL query
     * @param {Object} variables - Query variables
     * @returns {Promise<Object>} GraphQL response
     */
    async githubGraphQL(query, variables = {}) {
        if (!appState.authToken) {
            throw new APIError('Authentication token required', 401);
        }
        
        const response = await this.secureFetch(APP_CONFIG.API.GITHUB_GRAPHQL_URL, {
            method: 'POST',
            headers: SecurityUtils.createAuthHeaders(appState.authToken),
            body: JSON.stringify({ query, variables })
        });
        
        const data = await response.json();
        
        if (data.errors) {
            throw new APIError(`GraphQL Error: ${data.errors.map(e => e.message).join(', ')}`, 400);
        }
        
        return data;
    }
};

/**
 * Custom API Error class for better error handling
 */
class APIError extends Error {
    constructor(message, status = 0, url = '') {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.url = url;
    }
}

/**
 * Enhanced logging utilities
 */
const Logger = {
    /**
     * Log error with context
     * @param {string} message - Error message
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    error(message, error = null, context = {}) {
        const logData = {
            level: 'ERROR',
            message,
            timestamp: new Date().toISOString(),
            context
        };
        
        if (error) {
            logData.error = {
                name: error.name,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 5) // Limit stack trace
            };
        }
        
        console.error('[AGENT-QUICKSTART]', logData);
    },

    /**
     * Log warning with context
     * @param {string} message - Warning message
     * @param {Object} context - Additional context
     */
    warn(message, context = {}) {
        console.warn('[AGENT-QUICKSTART]', {
            level: 'WARN',
            message,
            timestamp: new Date().toISOString(),
            context
        });
    },

    /**
     * Log info with context
     * @param {string} message - Info message
     * @param {Object} context - Additional context
     */
    info(message, context = {}) {
        console.info('[AGENT-QUICKSTART]', {
            level: 'INFO',
            message,
            timestamp: new Date().toISOString(),
            context
        });
    }
};

/**
 * User notification system
 */
const NotificationSystem = {
    /**
     * Show user notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Display duration in milliseconds
     */
    show(message, type = 'info', duration = APP_CONFIG.UI.NOTIFICATION_DURATION) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getIcon(type)}</span>
                <span class="notification-message">${ValidationUtils.sanitizeString(message)}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    },

    /**
     * Get icon for notification type
     * @param {string} type - Notification type
     * @returns {string} Icon character
     */
    getIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }
};

/**
 * Performance utilities for optimization
 */
const PerformanceUtils = {
    /**
     * Debounce function calls to prevent excessive API requests
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle function calls for performance
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Cache API responses to reduce redundant calls
     */
    cache: new Map(),

    /**
     * Get cached response or fetch new one
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Function to fetch data if not cached
     * @param {number} ttl - Time to live in milliseconds
     * @returns {Promise} Cached or fresh data
     */
    async getCached(key, fetchFn, ttl = 300000) { // 5 minutes default
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < ttl) {
            Logger.info('Using cached data', { key });
            return cached.data;
        }
        
        const data = await fetchFn();
        this.cache.set(key, { data, timestamp: Date.now() });
        Logger.info('Cached new data', { key });
        return data;
    }
};

/**
 * Global notification function for compatibility
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
function showNotification(message, type = 'info') {
    NotificationSystem.show(message, type);
}

/**
 * Secure token handling utilities
 */
const SecurityUtils = {
    /**
     * Mask token for display purposes
     * @param {string} token - Token to mask
     * @returns {string} Masked token
     */
    maskToken(token) {
        if (!token || token.length < 8) return '***';
        return token.substring(0, 4) + '***' + token.substring(token.length - 4);
    },

    /**
     * Create authorization header
     * @param {string} token - GitHub token
     * @returns {Object} Headers object
     */
    createAuthHeaders(token) {
        return {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }
};

/**
 * Global state management
 */
class AppState {
    /**
     * Initialize application state with secure defaults
     */
    constructor() {
        this.currentStep = 1;
        this.selectedUseCase = null;
        this.orgName = '';
        this.authToken = '';
        this.selectionMethod = 'all';
        this.selectedRepos = [];
        this.selectedProperties = []; // Array of {propertyName, value} objects
        this.allRepos = [];
        this.allProperties = [];
        this.promptContent = '';
        
        // Pagination state using configuration
        this.reposPagination = {
            currentPage: 1,
            itemsPerPage: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
            totalPages: 1,
            filteredRepos: [],
            searchTerm: ''
        };
        
        this.propertiesPagination = {
            currentPage: 1,
            itemsPerPage: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
            totalPages: 1,
            filteredProperties: [],
            searchTerm: ''
        };
        
        // Use case prompts URLs from configuration
        this.promptUrls = {
            'tests': APP_CONFIG.PROMPTS.BASE_URL + APP_CONFIG.PROMPTS.TESTS,
            'documentation': APP_CONFIG.PROMPTS.BASE_URL + APP_CONFIG.PROMPTS.DOCUMENTATION,
            'technical-debt': APP_CONFIG.PROMPTS.BASE_URL + APP_CONFIG.PROMPTS.TECHNICAL_DEBT
        };
    }
    
    reset() {
        this.currentStep = 1;
        this.selectedUseCase = null;
        this.orgName = '';
        this.authToken = '';
        this.selectionMethod = 'all';
        this.selectedRepos = [];
        this.selectedProperties = [];
        this.allRepos = [];
        this.allProperties = [];
        this.promptContent = '';
        
        // Reset pagination state
        this.reposPagination = {
            currentPage: 1,
            itemsPerPage: 50,
            totalPages: 1,
            filteredRepos: [],
            searchTerm: ''
        };
        
        this.propertiesPagination = {
            currentPage: 1,
            itemsPerPage: 50,
            totalPages: 1,
            filteredProperties: [],
            searchTerm: ''
        };
        
        // Clear UI state
        this.clearUIState();
    }
    
    clearUIState() {
        // Clear use case selection
        useCaseButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Clear form inputs
        if (orgNameInput) orgNameInput.value = '';
        if (authTokenInput) authTokenInput.value = '';
        if (orgDisplay) orgDisplay.textContent = '';
        if (promptContentTextarea) promptContentTextarea.value = '';
        if (selectedUseCaseDisplay) selectedUseCaseDisplay.textContent = '';
        
        // Clear checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Reset dropdown
        if (selectionDropdown) selectionDropdown.value = 'all';
    }
}

// Initialize app state
const appState = new AppState();

// DOM elements
const progressSteps = document.querySelectorAll('.progress-step');
const stepContents = document.querySelectorAll('.step-content');
const useCaseButtons = document.querySelectorAll('.use-case-btn');
const authNextBtn = document.getElementById('auth-next');
const authBackBtn = document.getElementById('auth-back');
const reposNextBtn = document.getElementById('repos-next');
const reposBackBtn = document.getElementById('repos-back');
const promptBackBtn = document.getElementById('prompt-back');
const executeBtn = document.getElementById('execute-workflow');
const selectionDropdown = document.getElementById('selection-dropdown');
const orgNameInput = document.getElementById('org-name');
const authTokenInput = document.getElementById('auth-token');
const orgDisplay = document.getElementById('org-display');
const promptContentTextarea = document.getElementById('prompt-content');
const selectedUseCaseDisplay = document.getElementById('selected-use-case-display');
const targetReposList = document.getElementById('target-repos-list');
const loadingModal = document.getElementById('loading-modal');
const successModal = document.getElementById('success-modal');
const loadingMessage = document.getElementById('loading-message');

// Browser history management
let isNavigatingFromHistory = false;

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Use case selection
    useCaseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => selectUseCase(e.target.closest('.use-case-btn')));
    });
    
    // Authentication next button
    authNextBtn.addEventListener('click', handleAuthNext);
    
    // Back button handlers
    if (authBackBtn) authBackBtn.addEventListener('click', () => goToStep(1));
    if (reposBackBtn) reposBackBtn.addEventListener('click', () => goToStep(2));
    if (promptBackBtn) promptBackBtn.addEventListener('click', () => goToStep(3));
    
    // Repository selection next button
    reposNextBtn.addEventListener('click', handleReposNext);
    
    // Execute workflow button
    executeBtn.addEventListener('click', executeWorkflow);
    
    // Selection method dropdown
    selectionDropdown.addEventListener('change', handleSelectionMethodChange);
    
    // Search functionality with debouncing for better performance
    document.getElementById('repo-search').addEventListener('input', debouncedFilterRepos);
    document.getElementById('properties-search').addEventListener('input', debouncedFilterProperties);
    
    // Pagination functionality
    document.getElementById('repos-prev-page').addEventListener('click', () => changeReposPage(-1));
    document.getElementById('repos-next-page').addEventListener('click', () => changeReposPage(1));
    document.getElementById('properties-prev-page').addEventListener('click', () => changePropertiesPage(-1));
    document.getElementById('properties-next-page').addEventListener('click', () => changePropertiesPage(1));
    
    // Input validation
    orgNameInput.addEventListener('input', validateInputs);
    authTokenInput.addEventListener('input', validateInputs);
    
    // Progress step navigation
    progressSteps.forEach(step => {
        step.addEventListener('click', (e) => handleStepClick(e.target.closest('.progress-step')));
    });
    
    // Browser back/forward button support
    window.addEventListener('popstate', handlePopState);
    
    // Handle hash changes (for direct URL navigation)
    window.addEventListener('hashchange', handleHashChange);
    
    // Keyboard navigation support
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Check for initial step from URL hash
    const initialStep = getStepFromHash();
    if (initialStep > 1) {
        goToStep(initialStep);
    } else {
        // Set initial history state
        updateHistoryState(1);
    }
}

function handleKeyboardNavigation(event) {
    // Only handle keyboard navigation when not in form inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    if (event.altKey) {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                navigateToPreviousStep();
                break;
            case 'ArrowRight':
                event.preventDefault();
                navigateToNextStep();
                break;
        }
    }
}

function navigateToPreviousStep() {
    if (appState.currentStep > 1) {
        const previousStep = appState.currentStep - 1;
        if (validateStepAccess(previousStep)) {
            goToStep(previousStep);
        }
    }
}

function navigateToNextStep() {
    if (appState.currentStep < 4) {
        const nextStep = appState.currentStep + 1;
        if (validateStepAccess(nextStep)) {
            goToStep(nextStep);
        } else {
            showNotification('Please complete the current step before proceeding.', 'warning');
        }
    }
}

function getStepFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/#step-(\d+)/);
    if (match) {
        const step = parseInt(match[1]);
        return (step >= 1 && step <= 4) ? step : 1;
    }
    return 1;
}

function updateHistoryState(step) {
    if (!isNavigatingFromHistory) {
        const state = {
            step: step,
            appState: { ...appState }
        };
        const title = `Step ${step} - GitHub Copilot Agent Quickstart`;
        const url = `${window.location.pathname}#step-${step}`;
        
        if (step === 1) {
            history.replaceState(state, title, url);
        } else {
            history.pushState(state, title, url);
        }
    }
}

function handlePopState(event) {
    if (event.state && event.state.step) {
        isNavigatingFromHistory = true;
        
        // Restore app state
        Object.assign(appState, event.state.appState);
        
        // Navigate to the step
        goToStep(event.state.step);
        
        isNavigatingFromHistory = false;
    }
}

function handleHashChange() {
    if (!isNavigatingFromHistory) {
        const step = getStepFromHash();
        if (validateStepAccess(step)) {
            isNavigatingFromHistory = true;
            goToStep(step);
            isNavigatingFromHistory = false;
        } else {
            // Reset hash to current valid step
            window.location.hash = `step-${appState.currentStep}`;
        }
    }
}

// Step navigation
function goToStep(step) {
    // Update progress bar
    progressSteps.forEach((el, index) => {
        el.classList.remove('active', 'completed', 'clickable');
        const stepNumber = index + 1;
        
        if (stepNumber === step) {
            el.classList.add('active');
        } else if (stepNumber < step) {
            el.classList.add('completed');
            // Make completed steps clickable
            if (canNavigateToStep(stepNumber)) {
                el.classList.add('clickable');
            }
        }
        
        // Make any accessible previous steps clickable
        if (stepNumber < step && canNavigateToStep(stepNumber)) {
            el.classList.add('clickable');
        }
    });
    
    // Show step content
    stepContents.forEach((el, index) => {
        el.classList.toggle('hidden', index + 1 !== step);
    });
    
    appState.currentStep = step;
    
    // Update browser history
    updateHistoryState(step);
    
    // Restore UI state when navigating back
    restoreStepState(step);
}

function restoreStepState(step) {
    switch (step) {
        case 1:
            // Restore use case selection
            if (appState.selectedUseCase) {
                useCaseButtons.forEach(btn => {
                    btn.classList.toggle('selected', btn.dataset.useCase === appState.selectedUseCase);
                });
            }
            break;
            
        case 2:
            // Restore authentication form
            orgNameInput.value = appState.orgName || '';
            authTokenInput.value = appState.authToken || '';
            validateInputs();
            break;
            
        case 3:
            // Restore repository selection
            if (appState.orgName) {
                orgDisplay.textContent = appState.orgName;
            }
            selectionDropdown.value = appState.selectionMethod || 'all';
            handleSelectionMethodChange();
            // Restore selected repos/properties if they exist
            restoreSelections();
            break;
            
        case 4:
            // Restore prompt content
            if (appState.selectedUseCase) {
                if (appState.promptContent) {
                    promptContentTextarea.value = appState.promptContent;
                } else {
                    // Load prompt if not already loaded
                    loadPromptForUseCase();
                }
                selectedUseCaseDisplay.textContent = getUseCaseDisplayName(appState.selectedUseCase);
                updateTargetReposList();
            }
            break;
    }
}

function restoreSelections() {
    // Restore selected repositories
    if (appState.selectionMethod === 'selected' && appState.selectedRepos.length > 0) {
        setTimeout(() => {
            updateSelectedReposSummary();
            // Update checkboxes for visible repos
            appState.selectedRepos.forEach(repoName => {
                const checkbox = document.querySelector(`input[data-repo-name="${repoName}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }, 100);
    }
    
    // Restore selected properties
    if (appState.selectionMethod === 'properties' && appState.selectedProperties.length > 0) {
        setTimeout(() => {
            updateSelectedPropertiesSummary();
            // Update checkboxes for visible properties
            appState.selectedProperties.forEach(property => {
                const checkbox = document.querySelector(`input[data-property-name="${property.propertyName}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }, 100);
    }
}

function handleStepClick(stepElement) {
    const targetStep = parseInt(stepElement.dataset.step);
    
    // Only allow navigation to valid steps
    if (validateStepAccess(targetStep)) {
        goToStep(targetStep);
    }
}

function canNavigateToStep(targetStep) {
    // Always allow going to step 1
    if (targetStep === 1) return true;
    
    // For step 2, need use case selected
    if (targetStep === 2) {
        return appState.selectedUseCase !== null;
    }
    
    // For step 3, need use case selected and auth filled
    if (targetStep === 3) {
        return appState.selectedUseCase && appState.orgName && appState.authToken;
    }
    
    // For step 4, need repos selection completed
    if (targetStep === 4) {
        const hasValidSelection = 
            appState.selectionMethod === 'all' ||
            (appState.selectionMethod === 'selected' && appState.selectedRepos.length > 0) ||
            (appState.selectionMethod === 'properties' && appState.selectedProperties.length > 0);
        
        return appState.selectedUseCase && appState.orgName && appState.authToken && hasValidSelection;
    }
    
    return false;
}

function validateStepAccess(targetStep) {
    if (!canNavigateToStep(targetStep)) {
        // Show a user-friendly message about what's missing
        let message = '';
        switch (targetStep) {
            case 2:
                message = 'Please select a use case first.';
                break;
            case 3:
                message = 'Please complete authentication setup first.';
                break;
            case 4:
                message = 'Please complete repository selection first.';
                break;
        }
        
        // Show a brief notification instead of an alert
        showNotification(message, 'warning');
        return false;
    }
    return true;
}

// Use case selection
function selectUseCase(button) {
    useCaseButtons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    appState.selectedUseCase = button.dataset.useCase;
    
    // Only auto-advance if we're on step 1 and this is a fresh selection (not navigating back)
    if (appState.currentStep === 1 && (!appState.orgName && !appState.authToken) && !isNavigatingFromHistory) {
        setTimeout(() => {
            goToStep(2);
        }, 500);
    }
}

/**
 * Enhanced authentication validation with security checks
 */
function validateInputs() {
    const orgNameRaw = orgNameInput.value.trim();
    const authTokenRaw = authTokenInput.value.trim();
    
    // Sanitize inputs to prevent XSS
    const orgName = ValidationUtils.sanitizeString(orgNameRaw);
    const authToken = authTokenRaw; // Don't sanitize token, just validate format
    
    // Validate inputs
    const isValidOrg = ValidationUtils.isValidOrgName(orgName);
    const isValidToken = ValidationUtils.isValidToken(authToken);
    
    // Update app state only with valid inputs
    appState.orgName = isValidOrg ? orgName : '';
    appState.authToken = isValidToken ? authToken : '';
    
    // Show validation feedback
    showInputValidationFeedback('org-name', isValidOrg, 'Invalid organization name format');
    showInputValidationFeedback('auth-token', isValidToken, 'Invalid token format');
    
    // Enable/disable the next button
    if (authNextBtn) {
        authNextBtn.disabled = !isValidOrg || !isValidToken;
    }
    
    // Update progress step accessibility
    updateStepAccessibility();
}

/**
 * Show validation feedback for input fields
 * @param {string} fieldId - Input field ID
 * @param {boolean} isValid - Whether the input is valid
 * @param {string} errorMessage - Error message to display
 */
function showInputValidationFeedback(fieldId, isValid, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing validation classes
    field.classList.remove('input-valid', 'input-invalid');
    
    // Add appropriate validation class
    if (field.value.trim()) {
        field.classList.add(isValid ? 'input-valid' : 'input-invalid');
        
        // Show/hide error message
        let errorDiv = field.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('validation-error')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        }
        
        if (!isValid) {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        } else {
            errorDiv.style.display = 'none';
        }
    }
}

function updateStepAccessibility() {
    // Update which steps are clickable based on current state
    progressSteps.forEach((el, index) => {
        const stepNumber = index + 1;
        el.classList.remove('clickable');
        
        if (stepNumber < appState.currentStep && canNavigateToStep(stepNumber)) {
            el.classList.add('clickable');
        }
    });
}

/**
 * Enhanced authentication validation with user feedback
 */
function handleAuthNext() {
    if (!ValidationUtils.isValidOrgName(appState.orgName) || !ValidationUtils.isValidToken(appState.authToken)) {
        showNotification('Please provide valid organization name and authentication token.', 'error');
        return;
    }
    
    // Update org display with sanitized value
    orgDisplay.textContent = SecurityUtils.maskToken(appState.orgName);
    
    Logger.info('Authentication completed', { org: appState.orgName });
    goToStep(3);
}

// Repository selection
function handleSelectionMethodChange() {
    appState.selectionMethod = selectionDropdown.value;
    
    // Hide all selection content
    document.querySelectorAll('.selection-content').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show appropriate content
    switch (appState.selectionMethod) {
        case 'all':
            document.getElementById('all-repos-message').classList.remove('hidden');
            break;
        case 'selected':
            document.getElementById('selected-repos-content').classList.remove('hidden');
            loadRepositories();
            break;
        case 'properties':
            document.getElementById('custom-properties-content').classList.remove('hidden');
            loadCustomProperties();
            break;
    }
}

/**
 * Enhanced repository loading with pagination and error handling
 */
async function loadRepositories() {
    try {
        showLoading('Loading repositories...');
        Logger.info('Starting repository loading', { org: appState.orgName });
        
        const allRepos = await loadAllRepositories();
        
        appState.allRepos = allRepos.slice(0, APP_CONFIG.PAGINATION.MAX_ITEMS);
        appState.reposPagination.filteredRepos = appState.allRepos;
        appState.reposPagination.currentPage = 1;
        appState.reposPagination.totalPages = Math.ceil(
            appState.allRepos.length / appState.reposPagination.itemsPerPage
        );
        
        renderRepositories();
        updateSelectedReposSummary();
        
        Logger.info('Repository loading completed', { 
            count: appState.allRepos.length,
            org: appState.orgName
        });
        
    } catch (error) {
        Logger.error('Error loading repositories', error, { org: appState.orgName });
        alert(`Error loading repositories: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Load all repositories with pagination support
 * @returns {Promise<Array>} Array of repository objects
 */
async function loadAllRepositories() {
    const allRepos = [];
    const perPage = 100; // GitHub's max per page
    let page = 1;
    
    while (allRepos.length < APP_CONFIG.PAGINATION.MAX_ITEMS) {
        try {
            const repos = await APIUtils.githubAPI(
                `/orgs/${appState.orgName}/repos?per_page=${perPage}&page=${page}&sort=updated`
            );
            
            if (repos.length === 0) {
                break; // No more repos
            }
            
            allRepos.push(...repos);
            page++;
            
            // Update loading message
            updateLoadingMessage(`Loading repositories... (${allRepos.length} loaded)`);
            
            // Break if we got less than a full page
            if (repos.length < perPage) {
                break;
            }
            
            // Small delay to prevent rate limiting
            if (allRepos.length < APP_CONFIG.PAGINATION.MAX_ITEMS) {
                await new Promise(resolve => 
                    setTimeout(resolve, APP_CONFIG.API.RATE_LIMIT_DELAY / 2)
                );
            }
            
        } catch (error) {
            Logger.warn('Failed to load repository page', { page, error: error.message });
            break; // Stop loading on error
        }
    }
    
    return allRepos;
}

function renderRepositories() {
    const tbody = document.getElementById('repos-tbody');
    tbody.innerHTML = '';
    
    const { currentPage, itemsPerPage, filteredRepos } = appState.reposPagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const reposToShow = filteredRepos.slice(startIndex, endIndex);
    
    reposToShow.forEach(repo => {
        const row = document.createElement('tr');
        const isSelected = appState.selectedRepos.includes(repo.name);
        row.innerHTML = `
            <td>
                <input type="checkbox" data-repo-name="${repo.name}" onchange="toggleRepoSelection('${repo.name}')" ${isSelected ? 'checked' : ''}>
            </td>
            <td>
                <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.name}</a>
            </td>
            <td>${repo.description || 'No description'}</td>
            <td>
                ${repo.language ? `<span class="language-badge">${repo.language}</span>` : 'N/A'}
            </td>
            <td>${new Date(repo.updated_at).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
    
    updateReposPaginationControls();
}

function updateReposPaginationControls() {
    const { currentPage, totalPages } = appState.reposPagination;
    const prevBtn = document.getElementById('repos-prev-page');
    const nextBtn = document.getElementById('repos-next-page');
    const pageInfo = document.getElementById('repos-page-info');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${appState.reposPagination.filteredRepos.length} repositories)`;
}

function changeReposPage(direction) {
    const newPage = appState.reposPagination.currentPage + direction;
    if (newPage >= 1 && newPage <= appState.reposPagination.totalPages) {
        appState.reposPagination.currentPage = newPage;
        renderRepositories();
    }
}

function toggleRepoSelection(repoName) {
    const index = appState.selectedRepos.indexOf(repoName);
    if (index === -1) {
        appState.selectedRepos.push(repoName);
    } else {
        appState.selectedRepos.splice(index, 1);
    }
    updateStepAccessibility();
    updateSelectedReposSummary();
}

function updateSelectedReposSummary() {
    const countSpan = document.getElementById('selected-repos-count');
    const listDiv = document.getElementById('selected-repos-list');
    
    countSpan.textContent = appState.selectedRepos.length;
    
    listDiv.innerHTML = '';
    appState.selectedRepos.forEach(repoName => {
        const tag = document.createElement('span');
        tag.className = 'selected-item-tag';
        tag.innerHTML = `
            ${repoName}
            <button class="remove-btn" onclick="removeRepoSelection('${repoName}')" title="Remove">×</button>
        `;
        listDiv.appendChild(tag);
    });
}

function removeRepoSelection(repoName) {
    const index = appState.selectedRepos.indexOf(repoName);
    if (index !== -1) {
        appState.selectedRepos.splice(index, 1);
        updateSelectedReposSummary();
        updateStepAccessibility();
        
        // Update the checkbox in the table if visible
        const checkbox = document.querySelector(`input[data-repo-name="${repoName}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
}

/**
 * Enhanced custom properties loading with fallback support
 */
async function loadCustomProperties() {
    try {
        showLoading('Loading custom properties...');
        Logger.info('Loading custom properties', { org: appState.orgName });
        
        try {
            const properties = await APIUtils.githubAPI(`/orgs/${appState.orgName}/properties/schema`);
            appState.allProperties = properties.slice(0, APP_CONFIG.PAGINATION.MAX_ITEMS);
            
            Logger.info('Custom properties loaded successfully', { 
                count: appState.allProperties.length,
                org: appState.orgName
            });
            
        } catch (error) {
            Logger.warn('Failed to load custom properties, using mock data', { 
                error: error.message,
                org: appState.orgName
            });
            
            // Show mock data if API call fails
            appState.allProperties = getMockCustomProperties();
        }
        
        appState.propertiesPagination.filteredProperties = appState.allProperties;
        appState.propertiesPagination.currentPage = 1;
        appState.propertiesPagination.totalPages = Math.ceil(
            appState.allProperties.length / appState.propertiesPagination.itemsPerPage
        );
        
        renderCustomProperties();
        updateSelectedPropertiesSummary();
        
    } catch (error) {
        Logger.error('Error in loadCustomProperties', error, { org: appState.orgName });
        alert(`Error loading custom properties: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Get mock custom properties for demonstration
 * @returns {Array} Array of mock property objects
 */
function getMockCustomProperties() {
    return [
        { 
            property_name: 'environment', 
            value_type: 'single_select', 
            description: 'Deployment environment (dev, staging, prod)' 
        },
        { 
            property_name: 'team', 
            value_type: 'string', 
            description: 'Owning team or department' 
        },
        { 
            property_name: 'priority', 
            value_type: 'single_select', 
            description: 'Project priority level' 
        },
        { 
            property_name: 'framework', 
            value_type: 'string', 
            description: 'Primary technology framework used' 
        },
        { 
            property_name: 'status', 
            value_type: 'single_select', 
            description: 'Current project status' 
        }
    ];
}

function renderCustomProperties() {
    const tbody = document.getElementById('properties-tbody');
    tbody.innerHTML = '';
    
    const { currentPage, itemsPerPage, filteredProperties } = appState.propertiesPagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const propertiesToShow = filteredProperties.slice(startIndex, endIndex);
    
    propertiesToShow.forEach(property => {
        const row = document.createElement('tr');
        const selectedProperty = appState.selectedProperties.find(sp => sp.propertyName === property.property_name);
        const isSelected = !!selectedProperty;
        const currentValue = selectedProperty ? selectedProperty.value : '';
        
        // Create value input based on property type
        let valueInput = '';
        if (property.value_type === 'single_select') {
            // For single_select, provide a dropdown or text input for now
            // In a real implementation, you might fetch available options from GitHub API
            valueInput = `<input type="text" 
                placeholder="Enter value (e.g., dev, staging, prod)" 
                value="${currentValue}" 
                onchange="updatePropertyValue('${property.property_name}', this.value)"
                ${!isSelected ? 'disabled' : ''}>`;
        } else {
            // For string and other types, use text input
            valueInput = `<input type="text" 
                placeholder="Enter value" 
                value="${currentValue}" 
                onchange="updatePropertyValue('${property.property_name}', this.value)"
                ${!isSelected ? 'disabled' : ''}>`;
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" data-property-name="${property.property_name}" onchange="togglePropertySelection('${property.property_name}')" ${isSelected ? 'checked' : ''}>
            </td>
            <td>${property.property_name}</td>
            <td>${valueInput}</td>
            <td>${property.description || 'No description'}</td>
        `;
        tbody.appendChild(row);
    });
    
    updatePropertiesPaginationControls();
}

function updatePropertiesPaginationControls() {
    const { currentPage, totalPages } = appState.propertiesPagination;
    const prevBtn = document.getElementById('properties-prev-page');
    const nextBtn = document.getElementById('properties-next-page');
    const pageInfo = document.getElementById('properties-page-info');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${appState.propertiesPagination.filteredProperties.length} properties)`;
}

function changePropertiesPage(direction) {
    const newPage = appState.propertiesPagination.currentPage + direction;
    if (newPage >= 1 && newPage <= appState.propertiesPagination.totalPages) {
        appState.propertiesPagination.currentPage = newPage;
        renderCustomProperties();
    }
}

function togglePropertySelection(propertyName) {
    const existingIndex = appState.selectedProperties.findIndex(sp => sp.propertyName === propertyName);
    if (existingIndex === -1) {
        // Add new property with empty value
        appState.selectedProperties.push({ propertyName, value: '' });
    } else {
        // Remove existing property
        appState.selectedProperties.splice(existingIndex, 1);
    }
    updateStepAccessibility();
    updateSelectedPropertiesSummary();
    // Re-render to update input field state
    renderCustomProperties();
}

function updatePropertyValue(propertyName, value) {
    const existingProperty = appState.selectedProperties.find(sp => sp.propertyName === propertyName);
    if (existingProperty) {
        existingProperty.value = value;
        updateSelectedPropertiesSummary();
    }
}

function updateSelectedPropertiesSummary() {
    const countSpan = document.getElementById('selected-properties-count');
    const listDiv = document.getElementById('selected-properties-list');
    
    countSpan.textContent = appState.selectedProperties.length;
    
    listDiv.innerHTML = '';
    appState.selectedProperties.forEach(property => {
        const tag = document.createElement('span');
        tag.className = 'selected-item-tag';
        const displayText = property.value ? `${property.propertyName}: ${property.value}` : `${property.propertyName}: (no value)`;
        tag.innerHTML = `
            ${displayText}
            <button class="remove-btn" onclick="removePropertySelection('${property.propertyName}')" title="Remove">×</button>
        `;
        listDiv.appendChild(tag);
    });
}

function removePropertySelection(propertyName) {
    const index = appState.selectedProperties.findIndex(sp => sp.propertyName === propertyName);
    if (index !== -1) {
        appState.selectedProperties.splice(index, 1);
        updateSelectedPropertiesSummary();
        updateStepAccessibility();
        
        // Update the checkbox in the table if visible
        const checkbox = document.querySelector(`input[data-property-name="${propertyName}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        // Re-render to update input field state
        renderCustomProperties();
    }
}

/**
 * Enhanced search functionality with performance optimizations
 */
async function filterRepos() {
    const searchInput = document.getElementById('repo-search');
    const searchTerm = ValidationUtils.sanitizeString(searchInput.value.toLowerCase().trim());
    appState.reposPagination.searchTerm = searchTerm;
    
    if (!searchTerm) {
        // No search term, show all loaded repos
        appState.reposPagination.filteredRepos = appState.allRepos;
    } else {
        // First filter from loaded repos
        const localMatches = appState.allRepos.filter(repo => 
            repo.name.toLowerCase().includes(searchTerm) ||
            (repo.description && repo.description.toLowerCase().includes(searchTerm))
        );
        
        // If we have few local matches, try to search for more repos via API with caching
        if (localMatches.length < 10 && searchTerm.length >= 2) {
            try {
                const cacheKey = `search_${appState.orgName}_${searchTerm}`;
                const apiMatches = await PerformanceUtils.getCached(
                    cacheKey,
                    () => searchRepositoriesAPI(searchTerm),
                    60000 // 1 minute cache
                );
                
                // Combine and deduplicate
                const allMatches = [...localMatches];
                apiMatches.forEach(repo => {
                    if (!allMatches.find(existing => existing.name === repo.name)) {
                        allMatches.push(repo);
                    }
                });
                appState.reposPagination.filteredRepos = allMatches;
            } catch (error) {
                Logger.warn('API search failed, using local results only', { error: error.message });
                appState.reposPagination.filteredRepos = localMatches;
            }
        } else {
            appState.reposPagination.filteredRepos = localMatches;
        }
    }
    
    // Reset to first page and update pagination
    appState.reposPagination.currentPage = 1;
    appState.reposPagination.totalPages = Math.ceil(
        appState.reposPagination.filteredRepos.length / appState.reposPagination.itemsPerPage
    );
    
    renderRepositories();
}

/**
 * Enhanced API search with proper error handling
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Search results
 */
async function searchRepositoriesAPI(searchTerm) {
    try {
        const data = await APIUtils.githubAPI(
            `/search/repositories?q=${encodeURIComponent(searchTerm)}+org:${appState.orgName}&per_page=50`
        );
        return data.items || [];
    } catch (error) {
        Logger.error('Repository search API failed', error, { searchTerm });
        throw error;
    }
}

/**
 * Enhanced properties filtering with performance optimization
 */
function filterProperties() {
    const searchInput = document.getElementById('properties-search');
    const searchTerm = ValidationUtils.sanitizeString(searchInput.value.toLowerCase().trim());
    appState.propertiesPagination.searchTerm = searchTerm;
    
    if (!searchTerm) {
        appState.propertiesPagination.filteredProperties = appState.allProperties;
    } else {
        appState.propertiesPagination.filteredProperties = appState.allProperties.filter(property => 
            property.property_name.toLowerCase().includes(searchTerm) ||
            (property.description && property.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Reset to first page and update pagination
    appState.propertiesPagination.currentPage = 1;
    appState.propertiesPagination.totalPages = Math.ceil(
        appState.propertiesPagination.filteredProperties.length / appState.propertiesPagination.itemsPerPage
    );
    
    renderCustomProperties();
}

// Create debounced versions for better performance
const debouncedFilterRepos = PerformanceUtils.debounce(filterRepos, 300);
const debouncedFilterProperties = PerformanceUtils.debounce(filterProperties, 300);

function handleReposNext() {
    if (appState.selectionMethod === 'selected' && appState.selectedRepos.length === 0) {
        alert('Please select at least one repository.');
        return;
    }
    
    if (appState.selectionMethod === 'properties' && appState.selectedProperties.length === 0) {
        alert('Please select at least one custom property.');
        return;
    }
    
    loadPromptForUseCase();
    goToStep(4);
}

// Prompt loading and display
async function loadPromptForUseCase() {
    try {
        showLoading('Loading prompt...');
        
        const url = appState.promptUrls[appState.selectedUseCase];
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to load prompt: ${response.status} ${response.statusText}`);
        }
        
        const promptText = await response.text();
        appState.promptContent = promptText;
        
        // Update UI
        promptContentTextarea.value = promptText;
        selectedUseCaseDisplay.textContent = getUseCaseDisplayName(appState.selectedUseCase);
        
        updateTargetReposList();
        
    } catch (error) {
        console.error('Error loading prompt:', error);
        // Fallback to default prompt
        const fallbackPrompt = getFallbackPrompt(appState.selectedUseCase);
        appState.promptContent = fallbackPrompt;
        promptContentTextarea.value = fallbackPrompt;
        selectedUseCaseDisplay.textContent = getUseCaseDisplayName(appState.selectedUseCase);
        updateTargetReposList();
    } finally {
        hideLoading();
    }
}

function getUseCaseDisplayName(useCase) {
    const names = {
        'tests': 'Tests Creation',
        'documentation': 'Code Documentation',
        'technical-debt': 'Technical Debt'
    };
    return names[useCase] || useCase;
}

function getFallbackPrompt(useCase) {
    const prompts = {
        'tests': 'Please help create comprehensive test suites for this repository. Focus on unit tests, integration tests, and ensuring good code coverage.',
        'documentation': 'Please help improve the documentation for this repository. Include README updates, code comments, and API documentation.',
        'technical-debt': 'Please help identify and refactor technical debt in this repository. Focus on code quality, performance improvements, and maintainability.'
    };
    return prompts[useCase] || 'Please help improve this repository.';
}

function updateTargetReposList() {
    targetReposList.innerHTML = '';
    
    let targetRepos = [];
    
    switch (appState.selectionMethod) {
        case 'all':
            targetRepos = [`All repositories in ${appState.orgName}`];
            break;
        case 'selected':
            targetRepos = appState.selectedRepos;
            break;
        case 'properties':
            const propertyDescriptions = appState.selectedProperties.map(property => 
                property.value ? `${property.propertyName}: ${property.value}` : `${property.propertyName}: (no value)`
            );
            targetRepos = [`Repositories with custom properties: ${propertyDescriptions.join(', ')}`];
            break;
    }
    
    targetRepos.forEach(repo => {
        const li = document.createElement('li');
        li.textContent = repo;
        targetReposList.appendChild(li);
    });
}

/**
 * Enhanced workflow execution with proper error handling and rate limiting
 */
async function executeWorkflow() {
    try {
        showLoading('Starting workflow execution...');
        Logger.info('Starting workflow execution', { 
            useCase: appState.selectedUseCase,
            selectionMethod: appState.selectionMethod,
            org: appState.orgName
        });
        
        // Validate workflow preconditions
        if (!appState.selectedUseCase) {
            throw new Error('Please select a use case first.');
        }
        
        if (!ValidationUtils.isValidOrgName(appState.orgName)) {
            throw new Error('Please provide a valid organization name.');
        }
        
        if (!ValidationUtils.isValidToken(appState.authToken)) {
            throw new Error('Please provide a valid authentication token.');
        }
        
        // Get updated prompt content with validation
        const promptContent = promptContentTextarea.value.trim();
        if (!promptContent) {
            throw new Error('Please provide prompt content.');
        }
        appState.promptContent = ValidationUtils.sanitizeString(promptContent);
        
        // Determine which repositories to process
        let targetRepos = [];
        
        switch (appState.selectionMethod) {
            case 'all':
                targetRepos = await getAllOrgRepos();
                break;
            case 'selected':
                if (appState.selectedRepos.length === 0) {
                    throw new Error('Please select at least one repository.');
                }
                targetRepos = appState.selectedRepos.map(name => ({ name }));
                break;
            case 'properties':
                targetRepos = await getReposWithCustomProperties();
                break;
            default:
                throw new Error('Invalid repository selection method.');
        }
        
        if (targetRepos.length === 0) {
            throw new Error('No repositories found to process.');
        }
        
        Logger.info('Processing repositories', { count: targetRepos.length });
        updateLoadingMessage(`Processing ${targetRepos.length} repositories...`);
        
        // Process each repository with enhanced error handling
        const results = [];
        for (let i = 0; i < targetRepos.length; i++) {
            const repo = targetRepos[i];
            updateLoadingMessage(`Processing repository ${i + 1}/${targetRepos.length}: ${repo.name}`);
            
            try {
                const issueResult = await createIssueAndAssignCopilot(repo.name);
                results.push({ 
                    repo: repo.name, 
                    success: true, 
                    issue: issueResult,
                    issueUrl: issueResult.html_url
                });
            } catch (error) {
                Logger.error('Failed to process repository', error, { repo: repo.name });
                results.push({ 
                    repo: repo.name, 
                    success: false, 
                    error: error.message,
                    errorType: error.name
                });
            }
            
            // Rate limiting with configurable delay
            if (i < targetRepos.length - 1) {
                await new Promise(resolve => 
                    setTimeout(resolve, APP_CONFIG.API.RATE_LIMIT_DELAY)
                );
            }
        }
        
        hideLoading();
        
        // Enhanced results reporting
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        Logger.info('Workflow execution completed', { 
            total: results.length,
            successful: successCount,
            failed: failureCount
        });
        
        if (successCount > 0) {
            showSuccess();
            if (failureCount > 0) {
                Logger.warn('Some repositories failed to process', { 
                    failedRepos: results.filter(r => !r.success).map(r => r.repo)
                });
            }
        } else {
            const errorMessage = 'No issues were created successfully. Please check your permissions and try again.';
            Logger.error('Workflow execution failed completely', null, { results });
            alert(errorMessage);
        }
        
    } catch (error) {
        hideLoading();
        Logger.error('Workflow execution error', error);
        
        // User-friendly error messages
        let userMessage = error.message;
        if (error instanceof APIError) {
            switch (error.status) {
                case 401:
                    userMessage = 'Authentication failed. Please check your token permissions.';
                    break;
                case 403:
                    userMessage = 'Access denied. Please ensure your token has the required permissions.';
                    break;
                case 404:
                    userMessage = 'Organization or repository not found. Please check the organization name.';
                    break;
                case 408:
                    userMessage = 'Request timeout. Please try again.';
                    break;
                default:
                    userMessage = `API Error: ${error.message}`;
            }
        }
        
        alert(`Workflow execution failed: ${userMessage}`);
    }
}

/**
 * Get all repositories for the organization
 * @returns {Promise<Array>} Array of repository objects
 */
async function getAllOrgRepos() {
    try {
        Logger.info('Fetching organization repositories', { org: appState.orgName });
        
        const repos = await APIUtils.githubAPI(`/orgs/${appState.orgName}/repos?per_page=100`);
        
        Logger.info('Successfully fetched organization repositories', { 
            org: appState.orgName, 
            count: repos.length 
        });
        
        return repos;
    } catch (error) {
        Logger.error('Failed to fetch organization repositories', error, { 
            org: appState.orgName 
        });
        throw new Error(`Failed to fetch organization repositories: ${error.message}`);
    }
}

async function getReposWithCustomProperties() {
    // This would require additional API calls to find repos with specific custom properties
    // For now, return selected repos as a fallback
    return appState.selectedRepos.map(name => ({ name }));
}

/**
 * Enhanced issue creation with proper error handling and validation
 * @param {string} repoName - Repository name
 * @returns {Promise<Object>} Created issue object
 */
async function createIssueAndAssignCopilot(repoName) {
    try {
        // Validate inputs
        if (!repoName || !ValidationUtils.sanitizeString(repoName)) {
            throw new APIError('Invalid repository name', 400);
        }
        
        if (!appState.promptContent.trim()) {
            throw new APIError('Prompt content is required', 400);
        }
        
        Logger.info('Creating issue', { repo: repoName, useCase: appState.selectedUseCase });
        
        // Create the issue with sanitized content
        const issueData = {
            title: `${getUseCaseDisplayName(appState.selectedUseCase)} - Copilot Agent Task`,
            body: ValidationUtils.sanitizeString(appState.promptContent),
            labels: ['copilot-agent', appState.selectedUseCase]
        };
        
        const issue = await APIUtils.githubAPI(`/repos/${appState.orgName}/${repoName}/issues`, {
            method: 'POST',
            body: JSON.stringify(issueData)
        });
        
        Logger.info('Issue created successfully', { 
            repo: repoName, 
            issueNumber: issue.number,
            issueId: issue.id
        });
        
        // Try to assign Copilot (this might fail if the bot isn't available)
        try {
            await assignCopilotToIssue(repoName, issue.number);
            Logger.info('Copilot assigned successfully', { repo: repoName, issueNumber: issue.number });
        } catch (error) {
            Logger.warn('Failed to assign Copilot to issue', { 
                repo: repoName, 
                issueNumber: issue.number,
                error: error.message
            });
            // Continue even if assignment fails
        }
        
        return issue;
        
    } catch (error) {
        Logger.error('Failed to create issue and assign Copilot', error, { 
            repo: repoName,
            org: appState.orgName
        });
        throw error;
    }
}

async function assignCopilotToIssue(repoName, issueNumber) {
    try {
        // First, get the issue's node ID using REST API
        const issueResponse = await fetch(`https://api.github.com/repos/${appState.orgName}/${repoName}/issues/${issueNumber}`, {
            headers: {
                'Authorization': `token ${appState.authToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!issueResponse.ok) {
            throw new Error(`Failed to get issue details: ${issueResponse.status}`);
        }
        
        const issue = await issueResponse.json();
        const issueNodeId = issue.node_id;
        
        // Find Copilot bot using GraphQL suggestedActors query
        const copilotAssignee = await findCopilotBot(repoName);
        
        if (!copilotAssignee) {
            console.warn(`Copilot bot not found in suggested actors for ${repoName}`);
            return;
        }
        
        // Assign Copilot using GraphQL mutation
        await assignCopilotUsingGraphQL(issueNodeId, copilotAssignee.id);
        
    } catch (error) {
        console.error(`Error assigning Copilot to issue in ${repoName}:`, error);
        throw error;
    }
}

async function findCopilotBot(repoName) {
    let endCursor = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
        const query = `
            query FindCopilotBot($owner: String!, $name: String!, $endCursor: String) {
                repository(owner: $owner, name: $name) {
                    suggestedActors(first: 100, after: $endCursor, capabilities: CAN_BE_ASSIGNED) {
                        nodes {
                            ... on Bot {
                                id
                                login
                                __typename
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            }
        `;
        
        const variables = {
            owner: appState.orgName,
            name: repoName,
            endCursor: endCursor
        };
        
        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appState.authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, variables })
        });
        
        if (!response.ok) {
            throw new Error(`GraphQL query failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }
        
        const suggestedActors = data.data.repository.suggestedActors;
        
        // Look for copilot-swe-agent in the current page
        for (const node of suggestedActors.nodes) {
            if (node.login === 'copilot-swe-agent') {
                return node;
            }
        }
        
        // Check if there are more pages
        hasNextPage = suggestedActors.pageInfo.hasNextPage;
        endCursor = suggestedActors.pageInfo.endCursor;
    }
    
    return null; // Copilot bot not found
}

async function assignCopilotUsingGraphQL(issueNodeId, copilotId) {
    const mutation = `
        mutation AssignCopilot($input: ReplaceActorsForAssignableInput!) {
            replaceActorsForAssignable(input: $input) {
                __typename
            }
        }
    `;
    
    const variables = {
        input: {
            assignableId: issueNodeId,
            actorIds: [copilotId]
        }
    };
    console.log('Assigning Copilot with variables')
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${appState.authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "query":mutation, "variables":variables })
    });
    
    if (!response.ok) {
        throw new Error(`GraphQL mutation failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
        throw new Error(`GraphQL mutation errors: ${JSON.stringify(data.errors)}`);
    }
    
    return data.data.replaceActorsForAssignable;
}

// UI helper functions
function showLoading(message = 'Loading...') {
    loadingMessage.textContent = message;
    loadingModal.classList.remove('hidden');
}

function hideLoading() {
    loadingModal.classList.add('hidden');
}

function updateLoadingMessage(message) {
    loadingMessage.textContent = message;
}

function showSuccess() {
    successModal.classList.remove('hidden');
    // Attach handler to restart button (if not already attached)
    const restartBtn = document.querySelector('.restart-btn');
    if (restartBtn && !restartBtn.dataset.bound) {
        restartBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // Clear the hash and reload to start fresh at step 1
            window.location.hash = '';
            location.reload();
        });
        restartBtn.dataset.bound = 'true';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize selection method handler
document.addEventListener('DOMContentLoaded', function() {
    handleSelectionMethodChange();
});
