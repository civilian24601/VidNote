_Last updated: 2025-04-01 15:10 EST — v1.0_

# Git Workflow

## Branching Strategy

### Main Branches

#### `main` Branch
- Represents the official release history
- Always in a deployable state
- Direct commits are prohibited
- Protected branch requiring pull request approvals
- Tagged for releases

#### `develop` Branch
- Integration branch for features
- Base branch for feature development
- Represents the latest delivered development changes
- Merged into `main` at release points
- Should pass all tests

### Supporting Branches

#### Feature Branches
- **Naming Convention**: `feature/short-description`
- **Purpose**: Develop new features for upcoming releases
- **Branch From**: `develop`
- **Merge To**: `develop`
- **Lifecycle**:
  1. Branch off from `develop`
  2. Develop the feature
  3. Create a pull request to `develop`
  4. After review and approval, merge into `develop`
  5. Delete the feature branch after merge

#### Bug Fix Branches
- **Naming Convention**: `bugfix/issue-id-short-description`
- **Purpose**: Address bugs in the current development cycle
- **Branch From**: `develop`
- **Merge To**: `develop`
- **Lifecycle**:
  1. Branch off from `develop`
  2. Fix the bug
  3. Create a pull request to `develop`
  4. After review and approval, merge into `develop`
  5. Delete the bugfix branch after merge

#### Hotfix Branches
- **Naming Convention**: `hotfix/version-issue-id`
- **Purpose**: Address critical bugs in production
- **Branch From**: `main` at the appropriate release tag
- **Merge To**: Both `main` and `develop`
- **Lifecycle**:
  1. Branch off from `main` at the problematic release tag
  2. Fix the issue
  3. Create pull requests to both `main` and `develop`
  4. After review and approval, merge into both branches
  5. Tag the new `main` version
  6. Delete the hotfix branch after merge

#### Release Branches
- **Naming Convention**: `release/version`
- **Purpose**: Prepare for a new production release
- **Branch From**: `develop`
- **Merge To**: `main` and back to `develop`
- **Lifecycle**:
  1. Branch off from `develop` when it's ready for release
  2. Make only bug fixes, documentation, and release-oriented changes
  3. Create pull requests to both `main` and `develop`
  4. After review and approval, merge into both branches
  5. Tag the new `main` version
  6. Delete the release branch after merge

## Commit Guidelines

### Commit Message Format
All commit messages should follow the format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or correcting tests
- **chore**: Changes to the build process or auxiliary tools

#### Scope
The scope should indicate the module or component affected:
- **auth**: Authentication system
- **video**: Video functionality
- **comment**: Comment system
- **user**: User management
- **ui**: UI components
- **api**: API endpoints
- **db**: Database changes
- **config**: Configuration changes

#### Subject
- Short description of the change (less than 50 characters)
- Use imperative, present tense: "change" not "changed" or "changes"
- No period at the end
- Lowercase first letter

#### Body
- Optional detailed description
- Use imperative, present tense
- Include motivation for change and contrast with previous behavior
- Wrap lines at 72 characters

#### Footer
- Reference issues, pull requests, or breaking changes
- Example: `Fixes #123, Closes #456`
- Breaking changes should start with `BREAKING CHANGE:`

### Commit Examples
```
feat(video): add timeline markers for comments

Implement visual markers on the video timeline that indicate comment positions.
The markers are interactive and clicking them navigates to the timestamp.

Closes #78
```

```
fix(auth): resolve token expiration issue

Update JWT verification to handle token expiration gracefully and
redirect users to the login page when their session expires.

Fixes #42
```

## Pull Request Process

### PR Naming Convention
```
[TYPE] Short description of changes
```
Where `TYPE` is one of:
- `FEATURE`: New functionality
- `BUGFIX`: Bug fixes
- `HOTFIX`: Critical production fixes
- `REFACTOR`: Code improvements without changing functionality
- `DOCS`: Documentation updates
- `TEST`: Adding or updating tests
- `STYLE`: Code style changes
- `CHORE`: Build process or auxiliary tool changes

### PR Description Template
```markdown
## Description
[Provide a brief description of the changes made]

## Related Issue
[Reference the issue this PR addresses, if applicable]

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Refactor (code improvement without changing functionality)
- [ ] Documentation update
- [ ] Test update

## Testing Done
[Describe the testing done to verify the changes]

## Screenshots (if applicable)
[Add screenshots to help explain your changes]

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated documentation as necessary
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### PR Review Requirements
1. **Code Quality**: No lint errors, follows coding standards
2. **Test Coverage**: Adequate test coverage for new code
3. **Documentation**: Updated as needed
4. **Functionality**: Implements requirements correctly
5. **Performance**: No significant performance regressions
6. **Compatibility**: Works across supported browsers/devices
7. **Accessibility**: Follows accessibility standards

### PR Approval Process
1. Author creates PR and assigns reviewers
2. Reviewers provide feedback or approve
3. Author addresses feedback if needed
4. When approved by at least one reviewer, PR is eligible for merge
5. PR is merged by author or reviewer
6. Branch is deleted after merge

## Code Review Guidelines

### Reviewing Standards
1. **Be Respectful**: Use constructive language
2. **Be Specific**: Point to exact lines and provide clear explanations
3. **Be Thorough**: Check for edge cases and potential issues
4. **Be Timely**: Respond to review requests promptly

### What to Look For
1. **Functionality**: Does the code work as intended?
2. **Readability**: Is the code easy to understand?
3. **Maintainability**: Will the code be easy to modify in the future?
4. **Performance**: Are there any obvious performance issues?
5. **Security**: Are there potential security vulnerabilities?
6. **Testability**: Is the code properly tested?
7. **Error Handling**: Does the code handle errors gracefully?
8. **Edge Cases**: Are edge cases considered and handled?

### Review Etiquette
- Use suggestions for minor changes
- Use comments for discussion points
- Praise good solutions
- Ask questions rather than making accusations
- Distinguish between personal preference and actual issues

## Versioning Strategy

### Semantic Versioning
All versions follow the format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality
- **PATCH**: Backward-compatible bug fixes

### Version Tagging
- All releases are tagged in git
- Format: `v1.2.3`
- Tags should be annotated with release notes

### Release Notes Format
```markdown
# Release v1.2.3

## New Features
- Feature 1 description
- Feature 2 description

## Bug Fixes
- Bug fix 1 description
- Bug fix 2 description

## Performance Improvements
- Performance improvement 1 description

## Breaking Changes
- Breaking change description and migration guide

## Known Issues
- Known issue description
```

## Git Best Practices

### Daily Workflow
1. Pull latest changes from `develop`
2. Create or switch to your feature branch
3. Make small, focused commits
4. Push regularly to remote
5. Create a PR when feature is complete

### Keeping Branches Updated
- Regularly pull changes from the base branch
- Resolve conflicts promptly
- Use `git rebase` to maintain clean history

### Handling Merge Conflicts
1. Pull/rebase the target branch
2. Resolve conflicts locally
3. Verify that the application still works
4. Push the resolved changes

### Amending Commits
- Only amend commits that haven't been pushed
- Use `git commit --amend` for minor corrections
- Use interactive rebase for more complex changes

### Cleaning Up Branches
- Delete branches after they are merged
- Regularly review and clean up stale branches
- Keep the remote repository clean

## Git Hooks

### Pre-commit Hooks
- Run linters and formatters
- Run unit tests
- Check for debugging code
- Verify commit message format

### Pre-push Hooks
- Run more comprehensive tests
- Check for security vulnerabilities
- Verify version numbers

## CI/CD Integration

### Continuous Integration Workflow
1. Push to feature branch triggers CI build
2. CI runs tests, linting, and formatting checks
3. CI generates build artifacts
4. CI reports results on PR

### Continuous Deployment Workflow
1. Merge to `develop` triggers deployment to staging
2. Merge to `main` triggers deployment to production
3. Tagged releases trigger versioned deployments

### Branch Protection Rules
- `main`: Require PR, passing CI, and approvals
- `develop`: Require PR and passing CI
- Release branches: Require PR and passing CI

## Special Scenarios

### Reverting Changes
- Use `git revert` for public branches
- Document the reason for the revert
- Link to any related issues

### Cherry-picking
- Use for applying specific commits across branches
- Document the source of cherry-picked commits
- Be careful with dependent changes

### Large Binary Files
- Use Git LFS for large binary files
- Avoid committing large binaries directly
- Consider external storage for frequently changing binaries

### Sensitive Information
- Never commit secrets, credentials, or API keys
- Use environment variables for configuration
- Use `.gitignore` to prevent accidental commits
- Consider git-secrets for automated scanning