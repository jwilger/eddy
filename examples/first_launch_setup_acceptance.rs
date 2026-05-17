use std::io::Read;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use std::{env, fs};

use anyhow::{Context, Result, bail};
use cucumber::{World, given, then, when};
use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use tempfile::TempDir;

const OPENAI_API_KEY_SENTINEL: &str = "sk-from-environment";
const BOOTSTRAP_SETUP_PROJECTION_PATH: &str = ".eddy/bootstrap/learner_setup_status.json";

#[derive(Debug, Default, World)]
struct SetupWorld {
    workspace: Option<TempDir>,
    screen: Option<String>,
}

#[given("no saved setup exists")]
async fn no_saved_setup_exists(world: &mut SetupWorld) -> Result<()> {
    world.workspace = Some(TempDir::new().context("create isolated workspace")?);
    Ok(())
}

#[given("saved OpenAI access no longer verifies")]
async fn saved_openai_access_no_longer_verifies(world: &mut SetupWorld) -> Result<()> {
    let workspace = TempDir::new().context("create isolated workspace")?;
    let projection_path = workspace.path().join(BOOTSTRAP_SETUP_PROJECTION_PATH);
    let projection_dir = projection_path
        .parent()
        .context("bootstrap projection path has parent directory")?;
    fs::create_dir_all(projection_dir).context("create bootstrap projection fixture directory")?;
    fs::write(
        projection_path,
        r#"{
  "kind": "bootstrap_learner_setup_status_projection",
  "openai_access_verification": {
    "status": "failed",
    "reason": "fixture_saved_access_no_longer_verifies"
  }
}
"#,
    )
    .context("write bootstrap setup projection fixture")?;
    world.workspace = Some(workspace);
    Ok(())
}

#[given("saved OpenAI access verifies successfully")]
async fn saved_openai_access_verifies_successfully(world: &mut SetupWorld) -> Result<()> {
    let workspace = TempDir::new().context("create isolated workspace")?;
    let projection_path = workspace.path().join(BOOTSTRAP_SETUP_PROJECTION_PATH);
    let projection_dir = projection_path
        .parent()
        .context("bootstrap projection path has parent directory")?;
    fs::create_dir_all(projection_dir).context("create bootstrap projection fixture directory")?;
    fs::write(
        projection_path,
        r#"{
  "kind": "bootstrap_learner_setup_status_projection",
  "openai_access_verification": {
    "status": "verified",
    "verified_at": "2026-05-16T00:01:00Z"
  }
}
"#,
    )
    .context("write bootstrap setup projection fixture")?;
    world.workspace = Some(workspace);
    Ok(())
}

#[when("Eddy starts in the terminal")]
async fn eddy_starts_in_the_terminal(world: &mut SetupWorld) -> Result<()> {
    let workspace = world
        .workspace
        .as_ref()
        .context("isolated workspace was not prepared")?;
    let pty = native_pty_system();
    let pair = pty
        .openpty(PtySize {
            rows: 30,
            cols: 100,
            pixel_width: 0,
            pixel_height: 0,
        })
        .context("open pseudo-terminal")?;

    let mut command = CommandBuilder::new(
        env::var("EDDY_ACCEPTANCE_BIN").context("EDDY_ACCEPTANCE_BIN points to compiled eddy")?,
    );
    command.cwd(workspace.path());
    command.env("OPENAI_API_KEY", OPENAI_API_KEY_SENTINEL);

    let mut reader = pair.master.try_clone_reader().context("clone pty reader")?;
    let (screen_sender, screen_receiver) = mpsc::channel();
    let reader_thread = thread::spawn(move || {
        let mut bytes = Vec::new();
        let _read_result = reader.read_to_end(&mut bytes);
        let screen = String::from_utf8_lossy(&bytes).into_owned();
        let _send_result = screen_sender.send(screen);
    });

    let mut child = pair
        .slave
        .spawn_command(command)
        .context("spawn eddy in pseudo-terminal")?;
    thread::sleep(Duration::from_millis(500));
    let _kill_result = child.kill();
    let _wait_result = child.wait();
    drop(pair.slave);
    drop(pair.master);

    let raw_screen = screen_receiver
        .recv_timeout(Duration::from_secs(2))
        .context("capture terminal output from eddy")?;
    reader_thread.join().map_err(|panic_payload| {
        anyhow::anyhow!("pty reader thread panicked: {panic_payload:?}")
    })?;

    let mut parser = vt100::Parser::new(30, 100, 0);
    parser.process(raw_screen.as_bytes());
    world.screen = Some(parser.screen().contents());
    Ok(())
}

#[then("Eddy shows the first-launch setup screen")]
async fn eddy_shows_the_first_launch_setup_screen(world: &mut SetupWorld) -> Result<()> {
    assert_first_launch_setup_screen(world)
}

#[then(
    "Eddy shows the first-launch setup screen because saved OpenAI access could not be verified"
)]
async fn eddy_shows_setup_because_saved_openai_access_could_not_be_verified(
    world: &mut SetupWorld,
) -> Result<()> {
    assert_first_launch_setup_screen(world)?;
    let screen = world
        .screen
        .as_ref()
        .context("no terminal screen captured")?;
    let visible_text = screen.to_lowercase();

    let required_text = ["saved openai access", "could not be verified", "override"];
    let missing_text = required_text
        .into_iter()
        .filter(|text| !visible_text.contains(text))
        .collect::<Vec<_>>();

    if !missing_text.is_empty() {
        bail!(
            "expected first-launch setup screen to explain saved OpenAI access could not be verified and offer a secret-safe correction path; missing {missing_text:?}"
        );
    }

    Ok(())
}

#[then("Eddy continues to the learner's current app location")]
async fn eddy_continues_to_the_learners_current_app_location(world: &mut SetupWorld) -> Result<()> {
    let screen = world
        .screen
        .as_ref()
        .context("no terminal screen captured")?;
    let visible_text = screen.to_lowercase();

    let unexpected_setup_text = ["welcome to eddy setup", "display name", "openai api key"];
    let visible_setup_text = unexpected_setup_text
        .into_iter()
        .filter(|text| visible_text.contains(text))
        .collect::<Vec<_>>();
    let continuation_text = "continuing to your current eddy workspace";
    let continuation_text_present = visible_text.contains(continuation_text);

    if !visible_setup_text.is_empty() || !continuation_text_present {
        bail!(
            "expected Eddy to skip first-launch setup after verified saved access and continue to the learner's current app location with visible message {continuation_text:?}; setup text visible: {visible_setup_text:?}; continuation message present: {continuation_text_present}"
        );
    }

    Ok(())
}

fn assert_first_launch_setup_screen(world: &SetupWorld) -> Result<()> {
    let screen = world
        .screen
        .as_ref()
        .context("no terminal screen captured")?;
    let visible_text = screen.to_lowercase();
    if screen.contains(OPENAI_API_KEY_SENTINEL) {
        bail!(
            "expected first-launch setup screen to hide the raw OPENAI_API_KEY value while indicating an environment default is available"
        );
    }

    let required_text = [
        "welcome",
        "display name",
        "required",
        "openai api key",
        "environment",
        "default",
        "override",
        "use",
        "continue",
        "press ctrl+c twice to quit",
    ];
    let missing_text = required_text
        .into_iter()
        .filter(|text| !visible_text.contains(text))
        .collect::<Vec<_>>();

    if !missing_text.is_empty() {
        bail!(
            "expected first-launch setup screen to mention {missing_text:?} without exposing secret values"
        );
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    SetupWorld::run("tests/features/first_launch_setup.feature").await;
}
