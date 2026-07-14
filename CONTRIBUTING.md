# Contributing to Science Bowl Practice App

Thank you for taking the time to help improve the Science Bowl Practice App. This project uses React and Vite to deliver a responsive, realistic simulation of National Science Bowl gameplay. Community contributions, whether they involve expanding the question bank, fixing user interface bugs, or refining application state, are highly appreciated.

By participating in this repository, you agree to respect the codebase and fellow contributors.

## Technical Considerations

Before making modifications to the code, please keep the application's core structural requirements in mind:

* **Speech and Text Synchronization**
    The application relies heavily on the Web Speech API running in tandem with a custom typewriter effect. State management surrounding buzzing, skipping, or switching questions must clear active speech queues reliably. Be mindful of this synchronization when altering audio or rendering cycles.

* **Tossup and Bonus Relationships**
    The question filtering and randomization logic depends on preserving the strict link between specific tossup questions and their corresponding bonus questions. Ensure updates to data parsing or shuffling routines do not break these paired structures.

* **Data Storage**
    Questions are maintained entirely within local JSON files to eliminate external database overhead. Any modifications or additions to the question bank must strictly follow the existing schema keys such as category, question_type, question, options, and answer.

## How to Contribute

### Reporting Issues
If you encounter a bug or have an idea for a feature enhancement, please check the existing issues log first to verify it has not been documented yet. If it is a new issue, open a report detailing the steps required to reproduce the bug or an explanation of how the proposed feature benefits players.

### Pull Requests
To submit code or question updates, please use the following workflow:

1. Fork the repository on GitHub and create a local clone.
2. Create a new branch dedicated to your changes using a clear naming convention:
    ```bash
    git checkout -b feature/your_feature_name
    # or
    git checkout -b fix/bug_description
    ```
3. Make your modifications, verifying that your code is clean and properly formatted.
4. Commit and push the branch to your fork with a descriptive message:
    ```bash
    git add .
    git commit -m "Fix layout overlap on mobile results screen"
    git push origin feature/your_feature_name
    ```
5. Open a Pull Request against our main branch, detailing the changes made and referencing any relevant issue numbers.

## Local Development Setup

To get the project running on your local machine, please follow the step by step setup guide in the Installation section of the main project README.

Always run the production build script (`npm run build`) locally before pushing changes to make sure there are no syntax, import, or bundler compilation errors that could break the environment.

## Automated Deployment Checks

This repository is integrated with Vercel to automatically run compilation tests and provide deployment previews for incoming pull requests.

When you submit a Pull Request, Vercel will process your changes. All status checks must pass successfully before a contribution can be merged into the main branch. If a check fails, look at the details link within the GitHub interface to inspect the build logs, resolve the compilation error in your local environment, and push the correction back to your branch. The checks will then run again automatically.
