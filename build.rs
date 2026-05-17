use std::{
    env,
    path::PathBuf,
    process::{Command, exit},
};

const SYNC_SCRIPT_PATH: &str = "scripts/sync-clippy-lints.mjs";

fn main() {
    println!("cargo:rerun-if-changed=Cargo.toml");
    println!("cargo:rerun-if-changed=scripts/sync-clippy-lints.mjs");
    println!("cargo:rerun-if-env-changed=RUSTUP_TOOLCHAIN");

    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|error| {
        eprintln!("failed to read CARGO_MANIFEST_DIR for lint sync check: {error}");
        exit(1);
    });
    let sync_script = PathBuf::from(manifest_dir).join(SYNC_SCRIPT_PATH);

    let status = Command::new("node")
        .arg(sync_script)
        .arg("--check")
        .status()
        .unwrap_or_else(|error| {
            eprintln!("failed to run scripts/sync-clippy-lints.mjs with node: {error}");
            exit(1);
        });

    if !status.success() {
        eprintln!("Cargo.toml [lints.clippy] is not synchronized; run `just sync-clippy-lints`");
        exit(1);
    }
}
