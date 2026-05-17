use serde_json::Value;
use std::fs;

const BOOTSTRAP_SETUP_PROJECTION_PATH: &str = ".eddy/bootstrap/learner_setup_status.json";

fn main() {
    // Temporary bootstrap projection consumed before the planned server-owned
    // EventCore read model exists. It is not the source of truth for durable
    // learner setup state.
    let saved_access_status = fs::read_to_string(BOOTSTRAP_SETUP_PROJECTION_PATH)
        .ok()
        .and_then(|setup_status| {
            serde_json::from_str::<Value>(&setup_status)
                .ok()?
                .get("openai_access_verification")?
                .get("status")?
                .as_str()
                .map(str::to_owned)
        });

    if saved_access_status.as_deref() == Some("verified") {
        println!("Continuing to your current Eddy workspace.");
        return;
    }

    let saved_access_notice = match saved_access_status.as_deref() {
        Some("failed") => "\nSaved OpenAI access could not be verified.",
        _ => "",
    };

    println!(
        "Welcome to Eddy setup{saved_access_notice}\n\nDisplay name: required\nOpenAI API key: environment default available\nOverride the API key or use this default.\nContinue when ready.\n\nPress Ctrl+C twice to quit."
    );
}
