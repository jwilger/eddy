# eddy

Learn about LLM agents and how to build agentic systems by building your own coding harness!

## Development Environment

The recommended development environment is the project Nix flake:

```sh
nix develop
```

This gives you the Rust toolchain, native libraries, Forgejo MCP server, and helper tools used by the project. If you are not on a Nix-enabled system, install the prerequisites for your platform below.

## Non-Nix Prerequisites

Minimum versions are based on the current flake-backed development environment unless noted otherwise.

Required everywhere:

| Dependency | Minimum | Install/info |
| --- | --- | --- |
| Rust nightly toolchain with `rustc`, `cargo`, `rustfmt`, `clippy`, and `rust-src` | `1.97.0-nightly` | [rustup](https://rustup.rs/) and [Rust installation](https://www.rust-lang.org/tools/install) |
| `pkg-config` | `0.29.2` | [pkg-config guide](https://www.freedesktop.org/wiki/Software/pkg-config/) |
| OpenSSL development libraries | `3.x` | [OpenSSL source/build info](https://www.openssl.org/source/) |
| SQLite development libraries | `3.x` | [SQLite download/install info](https://www.sqlite.org/download.html) |
| `just` | `1.51.0` | [`just` installation](https://github.com/casey/just#installation) |
| `jq` | `1.6` | [`jq` download/install info](https://jqlang.github.io/jq/download/) |
| Node.js with `npm` | `22.x` | [Node.js downloads](https://nodejs.org/en/download) |

Recommended development tools:

| Dependency | Minimum | Install/info |
| --- | --- | --- |
| `cargo-deny` | `0.19.5` | [`cargo-deny` installation](https://embarkstudios.github.io/cargo-deny/) |
| `cargo-mutants` | `27.0.0` | [`cargo-mutants` installation](https://mutants.rs/install.html) |
| `cargo-nextest` | `0.9.133` | [`cargo-nextest` installation](https://nexte.st/docs/installation/) |
| `cargo-watch` | `8.5.3` | [`cargo-watch` installation](https://github.com/watchexec/cargo-watch#install) |

Install the Rust toolchain and cargo helpers with:

```sh
rustup toolchain install nightly --component rust-src,rustfmt,clippy && cargo install cargo-deny cargo-mutants cargo-nextest cargo-watch
```

<details>
<summary>Linux x86_64 / aarch64</summary>

Install system packages first, then install Rust with `rustup`.

Debian/Ubuntu:

```sh
sudo apt-get update && sudo apt-get install -y build-essential pkg-config libssl-dev libsqlite3-dev just jq nodejs npm libasound2-dev libfontconfig-dev libx11-dev libxcb1-dev libxcursor-dev libxi-dev libxkbcommon-dev libxrandr-dev libudev-dev libwayland-dev
```

Fedora:

```sh
sudo dnf install -y gcc gcc-c++ make pkgconf-pkg-config openssl-devel sqlite-devel just jq nodejs npm alsa-lib-devel fontconfig-devel libX11-devel libxcb-devel libXcursor-devel libXi-devel libxkbcommon-devel libXrandr-devel systemd-devel wayland-devel
```

Arch Linux:

```sh
sudo pacman -S --needed base-devel pkgconf openssl sqlite just jq nodejs npm alsa-lib fontconfig libx11 libxcb libxcursor libxi libxkbcommon libxrandr systemd-libs wayland
```

Provider documentation:

| Dependency group | Install/info |
| --- | --- |
| Debian/Ubuntu packages | [Ubuntu packages](https://packages.ubuntu.com/) and [Debian packages](https://packages.debian.org/) |
| Fedora packages | [Fedora package search](https://packages.fedoraproject.org/) |
| Arch packages | [Arch package search](https://archlinux.org/packages/) |
| Node.js | [Node.js downloads](https://nodejs.org/en/download) |
| ALSA | [ALSA project](https://www.alsa-project.org/wiki/Main_Page) |
| Fontconfig | [Fontconfig project](https://www.freedesktop.org/wiki/Software/fontconfig/) |
| X11/XCB libraries | [X.Org](https://www.x.org/wiki/) and [XCB](https://xcb.freedesktop.org/) |
| libxkbcommon | [libxkbcommon](https://xkbcommon.org/) |
| udev/systemd libraries | [systemd](https://systemd.io/) |
| Wayland | [Wayland](https://wayland.freedesktop.org/) |

</details>

<details>
<summary>macOS x86_64 / aarch64</summary>

Install Xcode Command Line Tools first, then install Homebrew packages and Rust with `rustup`.

Xcode Command Line Tools:

```sh
xcode-select --install
```

Homebrew packages:

```sh
brew install pkg-config openssl@3 sqlite just jq node
```

Provider documentation:

| Dependency group | Install/info |
| --- | --- |
| Xcode Command Line Tools and Apple SDK frameworks | [Apple developer tools](https://developer.apple.com/xcode/resources/) |
| Homebrew packages | [Homebrew installation](https://brew.sh/) and [Homebrew formulae](https://formulae.brew.sh/) |
| OpenSSL on Homebrew | [`openssl@3`](https://formulae.brew.sh/formula/openssl@3) |
| SQLite on Homebrew | [`sqlite`](https://formulae.brew.sh/formula/sqlite) |
| Node.js on Homebrew | [`node`](https://formulae.brew.sh/formula/node) |

</details>

## Event Model Browser

Event-model workflow JSON files can be browsed with the React-based event model browser. Install its JavaScript dependencies once:

```sh
just browser-install
```

Validate workflow models from the command line with the same TypeScript validation logic used by the browser:

```sh
just event-model-validate
```

Generate the static browser under `docs/event-model/generated/browser/` with:

```sh
just event-model-generate
```
