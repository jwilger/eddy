# Forgejo

This repo uses Forgejo at `git.johnwilger.com`, not GitHub. Use the `opencode-forgejo` plugin's high-level tools for supported pull request workflows before falling back to lower-level clients. Do not use `tea` for workflows covered by the plugin, and do not introduce `gh` workflows.

Before reaching for another Forgejo client, check whether the plugin has the needed operation. Prefer `forgejo_pr_overview`, `forgejo_list_prs`, `forgejo_create_pr`, `forgejo_update_pr_metadata`, `forgejo_reply_inline_review`, `forgejo_comment_pr`, `forgejo_supersede_pr`, `forgejo_merge_pr`, `forgejo_delete_branch`, and `forgejo_workflow_runs` when they match the task. Use `forgejo_api_request` for narrow authenticated REST gaps. If the plugin is unavailable or lacks a required operation, state the gap and use the Forgejo MCP or another narrow Forgejo-compatible fallback for that operation only.

Inline review feedback must be answered on the inline thread first. Use `forgejo_reply_inline_review` when available, not a top-level PR comment. Start each reply by @-tagging the user whose comment is being answered, using the comment author's Forgejo login. For direct Forgejo API replies, copy the original comment `position` into the reply payload as `new_position` and set `old_position` to `0`.
