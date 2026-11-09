# Security review

## Role access summary

| API group | Anonymous | Admin | Teacher | Student | Parent |
|---|---:|---:|---:|---:|---:|
| Health / login / signup | Health + login/signup | Yes | Yes | Yes | Yes |
| User management / approvals | No | Yes | Limited pupil management | No | No |
| Story Library read | Published stories | All | Assigned levels | Own level | Published stories |
| Story create/edit/publish/archive | No | Yes | Assigned levels | No | No |
| Test authoring / duplicate / archive / analytics | No | Yes | Assigned levels | No | No |
| Test start / save / submit | No | No | No | Own test/attempt | No |
| Results / comments | No | All | Assigned levels | Own results | Linked children only |
| Parent-child linking | No | Yes | No | No | No |
| Parent dashboard / corrections | No | No | No | No | Linked children; completed attempts only |
| Classes / memberships | No | Create/manage | Assigned class list | No | No |
| AI generation / question-bank moderation | No | Yes | Assigned story levels | No | No |
| Upload signing / resource completion | No | Yes | Yes | No | No |
| Announcements | No | Create | Read | Read | Read |
| Settings / backup / audit | No | Yes | No | No | No |
| Sign out everywhere / change password | No | Own account | Own account | Own account | Own account |

This is a route-group summary, not a substitute for reviewing every route in `server.js` during future changes.

## Controls retained or added

- Passwords are stored as scrypt hashes; plaintext passwords are not stored in the database.
- Session cookies are HttpOnly; HTTPS deployments must set `HTTPS=1`.
- The original approval/lockout model remains. IP+username login throttling is also stored in `login_rate_limits` so it survives process restarts.
- Server-side route role checks remain authoritative; frontend visibility is not treated as authorization.
- Mutating requests require the existing request header/origin protection.
- Security headers and a Content Security Policy are sent by the API server.
- Database calls use parameterized values. Dynamic SQL fragments are built only from fixed column/table names or validated class-level lists.
- User-facing text is escaped before HTML insertion.
- AI and Supabase service keys are read only by `server.js`; no key is referenced from `public/`.
- AI calls are rate-limited per teacher/day and logged in `ai_usage`.
- Upload signing validates the allowed MIME set and a 15 MB size limit before signing. The private bucket must independently enforce the same limits.
- Student test endpoints return stripped question objects; answer keys and written-answer rubric keywords are used only by server-side marking and completed-result views. Ordering keys are removed from the pupil payload.
- Parent result detail is guarded by a `parent_links` join and `status='done'`.
- Retakes preserve the prior attempt in `attempt_history` and record an audit event.

## Important deployment checks

1. Change the bootstrap administrator password immediately; the default bootstrap credential is known and must not remain active.
2. Make the source repository private and rotate any credentials that may have been exposed in a public repository.
3. Set `HTTPS=1` on Render and set exact `CORS_ORIGINS` values.
4. Never put `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` in frontend variables or files under `public/`.
5. Keep the Supabase Storage bucket private; do not use public bucket URLs for pupil resources.
6. Configure the bucket's 15 MB limit and MIME allowlist.
7. Run PostgreSQL migrations against a staging database first. The local SQLite test suite does not validate provider-specific PostgreSQL policies, extensions, connection pooler behavior or existing production table differences.
8. Re-run role-crossing tests whenever a new endpoint is added.

## Known limitations

- Core teacher scoping currently uses assigned level labels and the legacy level fallback. `test_classes` exists but multi-class test assignment is not fully wired end-to-end.
- Storage metadata is validated before signing, but the server does not perform antivirus scanning or a complete post-upload content inspection. Enforce restrictions in Supabase Storage.
- Active-session listing and email password recovery are not included; users can revoke all sessions.
- Parent self-registration is not enabled; an admin creates and links parent accounts.
- A Playwright browser-level four-role journey and a live PostgreSQL test run remain release gates.
