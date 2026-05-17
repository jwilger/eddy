set shell := ["sh", "-eu", "-c"]
set quiet := true

fmt:
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo fmt --all --check; else printf '%s\n' 'No Cargo.toml; skipping Rust fmt'; fi

clippy:
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo clippy --all-targets --all-features -- -D warnings; else printf '%s\n' 'No Cargo.toml; skipping Rust clippy'; fi

sync-clippy-lints:
	node scripts/sync-clippy-lints.mjs --write

test:
	NODE_OPTIONS="--import=$PWD/scripts/fail-on-warning.mjs" node --test tests/*.test.mjs
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo nextest run --no-tests pass; else printf '%s\n' 'No Cargo.toml; skipping Rust nextest'; fi

# cucumber-rs uses a custom harness (`harness = false`) so nextest cannot
# enumerate and filter this acceptance executable reliably; run the Cucumber
# binary directly for both routine and focused acceptance coverage.
accept:
	if [ -f Cargo.toml ]; then RUSTFLAGS='-Dwarnings' cargo build --bin eddy && features="${ACCEPT_FEATURES:-}" && name="${ACCEPT_NAME:-}" && set --; for feature in $features; do set -- "$@" --input "$feature"; done; if [ -n "$name" ]; then set -- "$@" --name "$name"; fi; RUSTFLAGS='-Dwarnings' EDDY_ACCEPTANCE_BIN="$(cargo metadata --no-deps --format-version 1 | jq -r '.target_directory + "/debug/eddy"')" cargo run --example first_launch_setup_acceptance -- "$@"; else printf '%s\n' 'No Cargo.toml; skipping Cucumber acceptance tests'; fi

test-first-launch-setup name='No setup exists yet':
	RUSTFLAGS='-Dwarnings' cargo build --bin eddy
	RUSTFLAGS='-Dwarnings' EDDY_ACCEPTANCE_BIN="$(cargo metadata --no-deps --format-version 1 | jq -r '.target_directory + "/debug/eddy"')" cargo run --example first_launch_setup_acceptance -- --name "{{name}}"

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

ci: fmt clippy test accept deny build
