# Git Branching Strategy & Contribution Guidelines (M1)

**Project:** ACM Resolve  
**Applies to:** All engineering members & contributors  

---

## 1. Branch Hierarchy

```
main (Production / Stable Releases)
  └── develop (Integration & Active Milestone Staging)
        ├── feature/<member>-<task-name>
        ├── fix/<member>-<bug-description>
        └── test/<member>-<test-suite>
```

### Branch Rules:
1. **`main`**:
   - Production branch. Strictly protected.
   - Direct pushes and force pushes are blocked.
   - Deploys automatically to production environment on merge.
   - Merges only from `develop` or approved milestone branches via Pull Requests with required status checks.
2. **`develop`**:
   - Active collaboration branch for current sprint / milestone.
   - PR target for all individual feature branches.
3. **Feature Branches (`feature/<member>-<task-name>`)**:
   - Short-lived branch branched off `develop` (or `main` when designated).
   - Format: `feature/<github-username>-<short-description>`, e.g., `feature/koonjz-m1-auth`.

---

## 2. Commit Conventions (Conventional Commits)

All commit messages must adhere to the Conventional Commits specification:

```
<type>(<scope>): <short description in present tense>

[optional body describing why the change was made]

[optional footer(s), e.g., Closes #12]
```

### Allowed Types:
- `feat`: A new feature or capability.
- `fix`: A bug fix.
- `docs`: Documentation only changes.
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding or correcting tests.
- `chore`: Tooling, configs, or CI adjustments.

### Examples:
- `feat(auth): enforce college domain verification in OAuth callback`
- `fix(semester): prevent date overlap in semester date-fns validation`
- `test(rbac): add test suite for withRole wrapper 401 and 403 handling`

---

## 3. Pull Request & Review Protocol

### PR Requirements:
1. **Title & Template**: Follow conventional commits and fill out every section of [.github/pull_request_template.md](file:///.github/pull_request_template.md).
2. **Reviewers**: At least 1 code review approval is required prior to merge.
3. **Automated Status Checks (Mandatory Pass)**:
   - Lint check (`npm run lint`)
   - TypeScript compiler check (`npx tsc --noEmit`)
   - Prisma schema validation (`npx prisma validate`)
   - Unit tests (`npx vitest run`)
   - Next.js production build (`npm run build`)
   - Playwright E2E suite (`npx playwright test`)
4. **Merge Method**: Use **Squash and Merge** or **Rebase and Merge** to maintain a clean linear commit history. Avoid creating merge commits on `main`.
