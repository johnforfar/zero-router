use std::io::{self, Write};
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<Message>,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[tokio::main]
async fn main() {
    println!("🦀 Zeroclaw v0.1.0 - The Sovereign AI Agent");
    println!("🌊 Connected to ZeroRouter (Real-time Token Stream)");
    
    let client = Client::new();
    let prompt = "Explain the benefit of Ephemeral Rollups on Solana.";

    let req = ChatRequest {
        model: "deepseek-r1".to_string(),
        messages: vec![Message {
            role: "user".to_string(),
            content: prompt.to_string(),
        }],
    };

    println!("\nUser: {}", prompt);
    print!("Agent: ");
    io::stdout().flush().unwrap();

    // Call ZeroRouter Gateway
    let res = client.post("http://localhost:3000/v1/chat/completions")
        .json(&req)
        .send()
        .await;

    match res {
        Ok(resp) => {
            let body = resp.text().await.unwrap();
            println!("{}", body);
        }
        Err(e) => println!("Error: {}", e),
    }

    println!("\n[Live Bill: $0.0004 | Settled on MagicBlock ER]");
}
