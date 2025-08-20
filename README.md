# 🚀 GitHub Copilot Agent Quickstart

A sleek JavaScript web application for automating GitHub Copilot Agent workflows across your repositories. This tool provides a streamlined interface to create issues and assign GitHub Copilot for three key use cases: test creation, code documentation, and technical debt management.

## 📚 Contents

- [✨ Features](#-features)
- [🚀 Quick Start - Option 1. Running in GitHub Codespaces](#-quick-start---option-1-running-in-github-codespaces)
- [🚀 Quick Start - Option 2. Running Locally](#-quick-start---option-2-running-locally)
- [🚀 Quick Start - Option 3. Running in Container](#-quick-start---option-3-running-in-container)
- [🔧 Usage](#-usage)
- [🔐 Security & Privacy](#-security--privacy)
- [🛠 Technical Details](#-technical-details)
- [📝 Prompts](#-prompts)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)



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

## 🚀 Quick Start - Option 1. Running in GitHub Codespaces

You can run this application directly in your browser using [GitHub Codespaces](https://github.com/features/codespaces), which provides a full development environment in the cloud. No local setup is required!

### What is Codespaces?
GitHub Codespaces lets you develop entirely in the cloud, using Visual Studio Code or your browser. It automatically sets up the environment, installs dependencies, and lets you run and preview your app—all from any device.

### How to Launch This App in Codespaces

1. **Open the Repository in GitHub**

2. **Create a Codespace**
  - Click the green **Code** button (top right), then select **Create codespace on main**.
  - Wait for the Codespace to start (it may take a minute).

3. **Install and Run the App**
  - In the Codespaces terminal (bottom panel), run:
    ```bash
    npm install
    npm run start
    ```

4. **Preview the App**
  - After running `npm run start`, you’ll see a message like `Local: http://localhost:8080`.
  - Click the **"Ports"** tab in the bottom panel, find port 8080, and click the **Open in Browser** button.
  - The app will open in a new browser tab.

**That’s it!** You’re now running the app in the cloud, with no local setup required.

## 🚀 Quick Start - Option 2. Running Locally

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

## 🚀 Quick Start - Option 3. Running in Container

Run the application in a Docker container for a consistent, isolated environment.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your system

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/MG-Octodemo/Agent-Quickstart.git
   cd Agent-Quickstart
   ```

2. **Build the Docker image**
   ```bash
   docker build -t agent-quickstart .
   ```

3. **Run the container**
   ```bash
   docker run -p 8000:8000 agent-quickstart
   ```

4. **Open in browser**
   Navigate to `http://localhost:8000`

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

The application inspires from use case-specific prompts from the [awesome-copilot](https://github.com/github/awesome-copilot) repository:

- **Tests Creation**: `prompts/unit-test.prompt.md`
- **Code Documentation**: `prompts/documentation.prompt.md`
- **Technical Debt**: `prompts/technical-debt-reduction.prompt.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---
