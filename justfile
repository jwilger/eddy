set shell := ["sh", "-eu", "-c"]
set quiet := true

fmt:
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo fmt --all --check; else printf '%s\n' 'No Cargo.toml; skipping Rust fmt'; fi

clippy:
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo clippy --all-targets --all-features -- -D warnings; else printf '%s\n' 'No Cargo.toml; skipping Rust clippy'; fi

test:
	NODE_OPTIONS="--import=$PWD/scripts/fail-on-warning.mjs" node --test tests/*.test.mjs
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo nextest run --no-tests pass; else printf '%s\n' 'No Cargo.toml; skipping Rust nextest'; fi

deny:
	if [ -f Cargo.toml ]; then cargo deny check; else printf '%s\n' 'No Cargo.toml; skipping cargo deny'; fi

build:
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo build; else printf '%s\n' 'No Cargo.toml; skipping Rust build'; fi
	NODE_OPTIONS="--import=$PWD/scripts/fail-on-warning.mjs" npm --prefix docs/event-model/browser run build

browser-install:
	npm --prefix docs/event-model/browser install

event-model-validate:
	NODE_OPTIONS="--import=$PWD/scripts/fail-on-warning.mjs" npm --prefix docs/event-model/browser run validate

event-model-generate:
	NODE_OPTIONS="--import=$PWD/scripts/fail-on-warning.mjs" npm --prefix docs/event-model/browser run generate

hooks-install:
	lefthook install

hooks-pre-commit:
	lefthook run pre-commit --all-files

hooks-pre-push:
	lefthook run pre-push

ci: fmt clippy test deny build
