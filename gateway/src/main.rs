use axum::{
    body::Body,
    extract::{State, Json},
    http::{Request, Response, StatusCode},
    response::IntoResponse,
    routing::post,
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use serde::{Deserialize, Serialize};
use futures_util::StreamExt;
use serde_json::Value;
use std::process::Command;

#[derive(Clone)]
struct AppState {
    ollama_url: String,
    vllm_url: String,
    default_model: String,
}

#[derive(Deserialize)]
struct ChatRequest {
    messages: Vec<Message>,
    provider: Option<String>,
}

#[derive(Deserialize)]
struct CmdRequest {
    command: String,
}

#[derive(Deserialize, Serialize, Clone)]
struct Message {
    role: String,
    content: String,
}

#[tokio::main]
async fn main() {
    let ollama_url = std::env::var("OLLAMA_URL").unwrap_or_else(|_| "http://localhost:11434".to_string());
    let vllm_url = std::env::var("VLLM_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let default_model = std::env::var("MODEL_NAME").unwrap_or_else(|_| "llama3.2:1b".to_string());

    let state = AppState {
        ollama_url,
        vllm_url,
        default_model,
    };

    let app = Router::new()
        .route("/v1/chat/completions", post(chat_handler))
        .route("/v1/cmd", post(cmd_handler))
        .with_state(state.clone())
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("🌊 ZeroRouter Gateway (Rust) active on {}", addr);
    println!("🛡️ [ZEROCLAW] Runtime Ready.");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn cmd_handler(
    Json(payload): Json<CmdRequest>,
) -> impl IntoResponse {
    println!("🐚 Executing command: {}", payload.command);
    
    // Security: Only allow zeroclaw commands
    if !payload.command.starts_with("zeroclaw") {
        return (StatusCode::FORBIDDEN, "Only zeroclaw commands allowed").into_response();
    }

    let output = Command::new("sh")
        .arg("-c")
        .arg(&payload.command)
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            if out.status.success() {
                (StatusCode::OK, stdout).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, stderr).into_response()
            }
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn chat_handler(
    State(state): State<AppState>,
    Json(payload): Json<ChatRequest>,
) -> impl IntoResponse {
    let provider = payload.provider.unwrap_or_else(|| "ollama".to_string());
    let target_url = if provider == "vllm" { &state.vllm_url } else { &state.ollama_url };

    let client = reqwest::Client::new();
    let res = if provider == "vllm" {
        client.post(format!("{}/v1/chat/completions", target_url))
            .json(&serde_json::json!({ "model": state.default_model, "messages": payload.messages, "stream": true }))
            .send().await
    } else {
        client.post(format!("{}/api/chat", target_url))
            .json(&serde_json::json!({ "model": state.default_model, "messages": payload.messages, "stream": true }))
            .send().await
    };

    let response = match res {
        Ok(res) => res,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Inference node unreachable").into_response(),
    };

    let stream = response.bytes_stream();
    let output_stream = futures_util::stream::unfold((stream, provider), |(mut s, p)| async move {
        match s.next().await {
            Some(Ok(bytes)) => {
                let content = if p == "vllm" {
                    let line = String::from_utf8_lossy(&bytes);
                    if line.starts_with("data: ") {
                        let json = line.replace("data: ", "").trim().to_string();
                        if json == "[DONE]" { return None; }
                        serde_json::from_str::<Value>(&json).ok()
                            .and_then(|v| v.get("choices")?.get(0)?.get("delta")?.get("content")?.as_str().map(|s| s.to_string()))
                    } else { None }
                } else {
                    serde_json::from_slice::<Value>(&bytes).ok()
                        .and_then(|v| v.get("message")?.get("content")?.as_str().map(|s| s.to_string()))
                };

                if let Some(c) = content {
                    let chunk = serde_json::json!({ "choices": [{"delta": {"content": c}}] });
                    let data = format!("data: {}\n\n", chunk.to_string());
                    return Some((Ok::<_, std::convert::Infallible>(data), (s, p)));
                }
                Some((Ok::<_, std::convert::Infallible>("".to_string()), (s, p)))
            }
            _ => None,
        }
    });

    Response::builder().status(StatusCode::OK).header("Content-Type", "text/event-stream").body(Body::from_stream(output_stream)).unwrap()
}
