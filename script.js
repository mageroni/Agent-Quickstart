// Global state management
class AppState {
    constructor() {
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
        
        // Use case prompts URLs
        this.promptUrls = {
            'tests': 'https://raw.githubusercontent.com/github/awesome-copilot/refs/heads/main/chatmodes/tdd-red.chatmode.md',
            'documentation': 'https://raw.githubusercontent.com/github/awesome-copilot/refs/heads/main/prompts/project-workflow-analysis-blueprint-generator.prompt.md',
            'technical-debt': 'https://raw.githubusercontent.com/github/awesome-copilot/refs/heads/main/chatmodes/tdd-refactor.chatmode.md'
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
const reposNextBtn = document.getElementById('repos-next');
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
    
    // Repository selection next button
    reposNextBtn.addEventListener('click', handleReposNext);
    
    // Execute workflow button
    executeBtn.addEventListener('click', executeWorkflow);
    
    // Selection method dropdown
    selectionDropdown.addEventListener('change', handleSelectionMethodChange);
    
    // Search functionality
    document.getElementById('repo-search').addEventListener('input', filterRepos);
    document.getElementById('properties-search').addEventListener('input', filterProperties);
    
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
            appState.selectedProperties.forEach(propertyName => {
                const checkbox = document.querySelector(`input[data-property-name="${propertyName}"]`);
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

// Authentication validation
function validateInputs() {
    const orgName = orgNameInput.value.trim();
    const authToken = authTokenInput.value.trim();
    
    appState.orgName = orgName;
    appState.authToken = authToken;
    
    // Enable/disable the next button
    if (authNextBtn) {
        authNextBtn.disabled = !orgName || !authToken;
    }
    
    // Update progress step accessibility
    updateStepAccessibility();
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

function handleAuthNext() {
    if (!appState.orgName || !appState.authToken) {
        alert('Please fill in both organization name and authentication token.');
        return;
    }
    
    // Update org display
    orgDisplay.textContent = appState.orgName;
    
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

async function loadRepositories() {
    try {
        showLoading('Loading repositories...');
        
        const response = await fetch(`https://api.github.com/orgs/${appState.orgName}/repos?per_page=100&sort=updated`, {
            headers: {
                'Authorization': `token ${appState.authToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load repositories: ${response.status} ${response.statusText}`);
        }
        
        const repos = await response.json();
        appState.allRepos = repos;
        renderRepositories(repos);
        
    } catch (error) {
        console.error('Error loading repositories:', error);
        alert(`Error loading repositories: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function renderRepositories(repos) {
    const tbody = document.getElementById('repos-tbody');
    tbody.innerHTML = '';
    
    repos.forEach(repo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" data-repo-name="${repo.name}" onchange="toggleRepoSelection('${repo.name}')">
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
}

function toggleRepoSelection(repoName) {
    const index = appState.selectedRepos.indexOf(repoName);
    if (index === -1) {
        appState.selectedRepos.push(repoName);
    } else {
        appState.selectedRepos.splice(index, 1);
    }
    updateStepAccessibility();
}

async function loadCustomProperties() {
    try {
        showLoading('Loading custom properties...');
        
        const response = await fetch(`https://api.github.com/orgs/${appState.orgName}/properties/schema`, {
            headers: {
                'Authorization': `token ${appState.authToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load custom properties: ${response.status} ${response.statusText}`);
        }
        
        const properties = await response.json();
        appState.allProperties = properties;
        renderCustomProperties(properties);
        
    } catch (error) {
        console.error('Error loading custom properties:', error);
        // Show mock data if API call fails
        const mockProperties = [
            { property_name: 'environment', value_type: 'single_select', description: 'Deployment environment' },
            { property_name: 'team', value_type: 'string', description: 'Owning team' },
            { property_name: 'priority', value_type: 'single_select', description: 'Project priority' }
        ];
        appState.allProperties = mockProperties;
        renderCustomProperties(mockProperties);
    } finally {
        hideLoading();
    }
}

function renderCustomProperties(properties) {
    const tbody = document.getElementById('properties-tbody');
    tbody.innerHTML = '';
    
    properties.forEach(property => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" data-property-name="${property.property_name}" onchange="togglePropertySelection('${property.property_name}')">
            </td>
            <td>${property.property_name}</td>
            <td>${property.value_type}</td>
            <td>${property.description || 'No description'}</td>
        `;
        tbody.appendChild(row);
    });
}

function togglePropertySelection(propertyName) {
    const index = appState.selectedProperties.indexOf(propertyName);
    if (index === -1) {
        appState.selectedProperties.push(propertyName);
    } else {
        appState.selectedProperties.splice(index, 1);
    }
    updateStepAccessibility();
}

// Search functionality
function filterRepos() {
    const searchTerm = document.getElementById('repo-search').value.toLowerCase();
    const filteredRepos = appState.allRepos.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm))
    );
    renderRepositories(filteredRepos);
}

function filterProperties() {
    const searchTerm = document.getElementById('properties-search').value.toLowerCase();
    const filteredProperties = appState.allProperties.filter(property => 
        property.property_name.toLowerCase().includes(searchTerm) ||
        (property.description && property.description.toLowerCase().includes(searchTerm))
    );
    renderCustomProperties(filteredProperties);
}

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
            targetRepos = [`Repositories with custom properties: ${appState.selectedProperties.join(', ')}`];
            break;
    }
    
    targetRepos.forEach(repo => {
        const li = document.createElement('li');
        li.textContent = repo;
        targetReposList.appendChild(li);
    });
}

// Workflow execution
async function executeWorkflow() {
    try {
        showLoading('Starting workflow execution...');
        
        // Get updated prompt content
        appState.promptContent = promptContentTextarea.value;
        
        // Determine which repositories to process
        let targetRepos = [];
        
        switch (appState.selectionMethod) {
            case 'all':
                targetRepos = await getAllOrgRepos();
                break;
            case 'selected':
                targetRepos = appState.selectedRepos.map(name => ({ name }));
                break;
            case 'properties':
                targetRepos = await getReposWithCustomProperties();
                break;
        }
        
        if (targetRepos.length === 0) {
            throw new Error('No repositories found to process.');
        }
        
        updateLoadingMessage(`Processing ${targetRepos.length} repositories...`);
        
        // Process each repository
        const results = [];
        for (let i = 0; i < targetRepos.length; i++) {
            const repo = targetRepos[i];
            updateLoadingMessage(`Processing repository ${i + 1}/${targetRepos.length}: ${repo.name}`);
            
            try {
                const issueResult = await createIssueAndAssignCopilot(repo.name);
                results.push({ repo: repo.name, success: true, issue: issueResult });
            } catch (error) {
                console.error(`Failed to process repo ${repo.name}:`, error);
                results.push({ repo: repo.name, success: false, error: error.message });
            }
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        hideLoading();
        
        // Show results
        const successCount = results.filter(r => r.success).length;
        if (successCount > 0) {
            showSuccess();
        } else {
            alert('No issues were created successfully. Please check your permissions and try again.');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Workflow execution error:', error);
        alert(`Workflow execution failed: ${error.message}`);
    }
}

async function getAllOrgRepos() {
    const response = await fetch(`https://api.github.com/orgs/${appState.orgName}/repos?per_page=100`, {
        headers: {
            'Authorization': `token ${appState.authToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch organization repositories: ${response.status}`);
    }
    
    return await response.json();
}

async function getReposWithCustomProperties() {
    // This would require additional API calls to find repos with specific custom properties
    // For now, return selected repos as a fallback
    return appState.selectedRepos.map(name => ({ name }));
}

async function createIssueAndAssignCopilot(repoName) {
    // Create the issue
    const issueResponse = await fetch(`https://api.github.com/repos/${appState.orgName}/${repoName}/issues`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${appState.authToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: `${getUseCaseDisplayName(appState.selectedUseCase)} - Copilot Agent Task`,
            body: appState.promptContent,
            labels: ['copilot-agent', appState.selectedUseCase]
        })
    });
    
    if (!issueResponse.ok) {
        throw new Error(`Failed to create issue in ${repoName}: ${issueResponse.status}`);
    }
    
    const issue = await issueResponse.json();
    
    // Try to assign Copilot (this might fail if the bot isn't available)
    try {
        await assignCopilotToIssue(repoName, issue.number);
    } catch (error) {
        console.warn(`Failed to assign Copilot to issue in ${repoName}:`, error);
        // Continue even if assignment fails
    }
    
    return issue;
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
    
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${appState.authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mutation, variables })
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