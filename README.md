# 🚀 GitHub Copilot Agent Quickstart

A sleek JavaScript web application for automating GitHub Copilot Agent workflows across your repositories. This tool provides a streamlined interface to create issues and assign GitHub Copilot for three key use cases: test creation, code documentation, and technical debt management.

## ✨ Features

- **Beautiful Purple/Black GitHub Features-inspired Design** - Modern, responsive interface
- **4-Step Guided Workflow** with visual progress tracking
- **Three Use Cases Supported**:
  - 🧪 **Tests Creation** - Generate comprehensive test suites
  - 📚 **Code Documentation** - Create detailed project documentation  
  - 🔧 **Technical Debt** - Identify and refactor technical debt
- **Flexible Repository Selection**:
  - All repositories in organization
  - Manually selected repositories
  - Repositories with specific custom properties
- **GitHub API Integration** - Seamless integration with GitHub REST and GraphQL APIs
- **Copilot Bot Assignment** - Automatically assigns GitHub Copilot to created issues
- **Session-only Storage** - No persistent data storage for security

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/MG-Octodemo/Agent-Quickstart.git
   cd Agent-Quickstart
   ```

2. **Serve the application**
   ```bash
   # Using npm
   npm install
   npm run start
   ```

3. **Open in browser**
   Navigate to `http://localhost:8080`

## 🔧 Usage

### Step 1: Choose Your Use Case
Select from three predefined workflows:
- **Tests Creation** - Uses TDD Red methodology prompts
- **Code Documentation** - Uses project workflow analysis blueprints
- **Technical Debt** - Uses TDD refactor methodology

### Step 2: Authentication Setup
Provide your GitHub credentials:
- **Organization Name** - Your GitHub organization
- **Personal Access Token** - Token with required permissions:
  - `repo` - Full control of private repositories
  - `metadata` - Read repository metadata
  - `issues` - Read and write issues
  - `custom properties` - Read organization custom properties

### Step 3: Repository Selection
Choose how to select repositories:
- **All Repos** - Apply to all organization repositories
- **Selected Repos** - Choose specific repositories from a searchable list
- **Custom Properties** - Select repositories based on custom properties

### Step 4: Prompt Review & Execution
- Review and customize the AI prompt
- See execution summary
- Execute workflow to create issues and assign Copilot

## 🔐 Security & Privacy

- **No Persistent Storage** - All data is session-only and cleared on page refresh
- **Client-side Only** - No backend server required
- **Token Security** - Tokens are only used for API calls and never stored

## 🛠 Technical Details

- **Pure JavaScript** - No frameworks required
- **GitHub REST API** - For repository and organization data
- **GitHub GraphQL API** - For Copilot bot assignment
- **External Prompt Sources** - Fetches prompts from awesome-copilot repository
- **Responsive Design** - Works on desktop and mobile devices

## 📝 Prompts

The application fetches use case-specific prompts from the [awesome-copilot](https://github.com/github/awesome-copilot) repository:

- **Tests Creation**: `prompts/breakdown-test.prompt.md`
- **Code Documentation**: `prompts/project-workflow-analysis-blueprint-generator.prompt.md`
- **Technical Debt**: `chatmodes/tdd-refactor.chatmode.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
