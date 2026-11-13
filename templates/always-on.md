## e2e-qa-pilot

When asked to work on a manual test case:

1. Read `.e2e-qa-pilot/settings.md`.
2. Read `.e2e-qa-pilot/project.md`.
3. Follow the matching command in `.e2e-qa-pilot/processes/create-e2e/commands/`:
   - `review-case`: check that a case is specific enough to assert.
   - `add-from-steps` and `add-from-design`: write the spec and open the pull request.
   - `setup-project`: fill in `project.md`.

Rules that always apply:

- Do not ask what those two files answer.
- Feature flags and other repositories are read-only.
- Never put a token in a file, a commit, or the chat.
- Never edit an expected result to make a test pass. A person reviews every pull request.
