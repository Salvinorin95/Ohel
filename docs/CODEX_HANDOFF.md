- updated: 2026-11-17
- last_writer: codex
- status: idle
- next_owner: matthew
- project_path: /Users/matthewklanfer/Developer/Ohel
- goal: Add unified discovery, recovery-key rotation and private invitation rooms on the same readiness branch.

## Done
- Initial checkout clean; changes isolated on codex/ohel-readiness-20261117.
- Session identity/expiry and revocation, truthful errors, saved study API/UI and highlighted verse links implemented.
- Added public-text edge/device cache fallback, map text directory and guided first study.
- Added bilingual discovery, recovery-key rotation/lost-response recovery, invitation rooms with link rotation and member removal.
- 86 tests pass; production build passes; ten isolated browser checks cover discovery, study, outages, recovery, room controls and Hebrew mobile layout.
- Screenshots inspected in review/readiness-20261117 (ignored); no production data modified.

## Open
- Changes are ready for review on codex/ohel-readiness-20261117; see Git for push state.
- Cloud restore drill and real hosted pilot remain external validation. No full verse-corpus search or end-to-end encryption.
- Private rooms are hidden from listings; members/moderators/operators can read them. Capability links admit signed-in people; link rotation does not remove members.
- No production deployment or cloud backup configuration was changed.
- CI enabled through the connected GitHub tool; branch fast-forwarded afterward. Check Actions for remote result.

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
