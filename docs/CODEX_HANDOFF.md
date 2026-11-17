- updated: 2026-11-17
- last_writer: codex
- status: active
- next_owner: codex
- project_path: /Users/matthewklanfer/Developer/Ohel
- goal: Add unified discovery, recovery-key rotation and private invitation rooms on the same readiness branch.

## Done
- Initial checkout clean; changes isolated on codex/ohel-readiness-20261117.
- Session identity/expiry and revocation, truthful errors, saved study API/UI and highlighted verse links implemented.
- Added public-text edge/device cache fallback, map text directory, guided first study and a CI template.
- 82 tests pass; production build passes; isolated browser checks cover saved study, outages, failed revocation and Hebrew mobile layout.
- Screenshots inspected in review/readiness-20261117 (ignored); no production data modified.

## Open
- Changes are ready for review on codex/ohel-readiness-20261117; see Git for push state.
- Cloud restore drill, recovery-key rotation, global discovery and invite-only hosted sessions remain follow-up work.
- No production deployment or cloud backup configuration was changed.
- GitHub OAuth lacks workflow scope; CI is prepared in docs/ci.yml.template, not enabled.

## Next action
- Review and merge the branch; validate the production deployment separately after approval.
- Run a staging backup/restore drill before a wider public launch.

## Files
- worker/hub.ts, worker/text.ts, shared/study.ts, src/views, src/components/StudyCard.tsx, tests

## Verify
- npm test
- npm run build
- node scripts/readiness-ui-e2e.mjs (CHROME override supported)

## Do not
- Do not deploy, modify production accounts, or stop the existing user-owned Vite process on port 5199.
- Do not touch the other game project or either game project.
