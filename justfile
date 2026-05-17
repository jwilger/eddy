set shell := ["sh", "-eu", "-c"]
set quiet := true

fmt:
	if [ -f Cargo.toml ]; then cargo fmt --all --check; else printf '%s\n' 'No Cargo.toml; skipping Rust fmt'; fi

clippy:
	if [ -f Cargo.toml ]; then cargo clippy --all-targets --all-features -- -D warnings; else printf '%s\n' 'No Cargo.toml; skipping Rust clippy'; fi

test:
	node --test tests/*.test.mjs
	if [ -f Cargo.toml ]; then cargo nextest run --no-tests pass; else printf '%s\n' 'No Cargo.toml; skipping Rust nextest'; fi

deny:
	if [ -f Cargo.toml ]; then cargo deny check; else printf '%s\n' 'No Cargo.toml; skipping cargo deny'; fi

build:
	if [ -f Cargo.toml ]; then cargo build; else printf '%s\n' 'No Cargo.toml; skipping Rust build'; fi
	npm --prefix docs/event-model/browser run build

browser-install:
	npm --prefix docs/event-model/browser install

event-model-validate:
	npm --prefix docs/event-model/browser run validate

event-model-generate:
	npm --prefix docs/event-model/browser run generate

ci: fmt clippy test deny build
