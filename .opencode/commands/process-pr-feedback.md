---
description: Process Forgejo PR feedback with reflection, classification, remediation, and inline replies.
agent: forgejo-feedback-processor
---

Process Forgejo PR feedback: $ARGUMENTS

Use `forgejo-feedback-protocol` and `review-taxonomy`. Fetch comments with `forgejo_pr_overview`, reflect on each actionable item, classify as `guardrail-gap` or `one-off`, remediate, and reply on each inline thread with `forgejo_reply_inline_review` before any top-level summary.
