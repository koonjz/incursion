## Description
<!-- Provide a clear description of what this PR introduces or fixes -->

## Type of Change
- [ ] 🚀 New Feature (non-breaking change which adds functionality)
- [ ] 🐛 Bug Fix (non-breaking change which fixes an issue)
- [ ] 🛡️ Security / RBAC enhancement
- [ ] 🧪 Testing (unit, integration, or E2E tests)
- [ ] 📚 Documentation update
- [ ] ⚙️ CI/CD or Infrastructure update

## Related Milestone & Issue
- Milestone: M1 (Foundation, DevOps, Auth, RBAC)
- Issue / Task: #

## Quality & Pre-flight Checklist
- [ ] Code follows existing conventions and TypeScript strict rules (no `any`).
- [ ] Server-side authorization (`requireRole` or `withRole`) enforced on new routes.
- [ ] Zod schema validation applied to API request payloads.
- [ ] Unit tests added / updated and passing (`npm run test`).
- [ ] Typecheck passing cleanly (`npx tsc --noEmit`).
- [ ] Linter passing without errors (`npm run lint`).
- [ ] No hardcoded secrets or environment variables committed.
- [ ] Any required schema additions or manual diffs documented in `INTEGRATION_NOTES.md`.

## Screenshots / Verification Output (if applicable)
<!-- Attach screenshots, console output, or test logs -->
