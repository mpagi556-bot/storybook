# Changelog

## 2.1.0 – Storybook School upgrade

- Added numbered SQLite/PostgreSQL migrations 001, 002 and 003, including the Story Library, classes, question bank, resources, parent links, reading/reward records, audit/announcement/settings support, attempt history and curriculum metadata.
- Added Story Library CRUD, publication/archive workflow, source/licence fields, learning-area/competence metadata and NCDC phase labels.
- Added paste/file import, browser text extraction/OCR, question CSV validation, signed private-storage upload/download routes, cover images and audio/document attachments.
- Added server-side Anthropic story/question generation and teacher question approval workflow.
- Added class management, membership assignment, bulk pupil import, parent accounts/links and parent reporting.
- Added test duplication/edit/archive, due dates, time limits and formative/summative assessment labels, answer autosave/resume, question analytics, results filters/export/print, teacher comments and retake history.
- Added pupil reading practice, speech read-aloud, accessibility controls, progress, points, streaks and badges.
- Added admin audit/settings/announcements/backup/session revocation and security/reliability hardening.
- Added implementation, deployment, curriculum, content licensing, testing and security documentation.

The original Node HTTP server, frontend structure, assessment engine and Vercel/Render hosting pattern were retained.
