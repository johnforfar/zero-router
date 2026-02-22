# --- Stage 1: Build ZeroRouter Gateway ---
FROM rust:latest AS gateway-builder
RUN apt-get update && apt-get install -y pkg-config libssl-dev

WORKDIR /app
# Cache dependencies
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/zerorouter_gateway*

# Build real source
COPY src ./src
RUN touch src/main.rs && cargo build --release

# --- Stage 2: Build ZeroClaw Core ---
FROM rust:latest AS zeroclaw-builder
RUN apt-get update && apt-get install -y pkg-config libssl-dev
WORKDIR /app
# Just copy everything for now to avoid manifest errors with benches/examples
COPY zeroclaw_src .
RUN cargo build --release --bin zeroclaw

# --- Stage 3: Final Production Image ---
FROM debian:trixie-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binaries
COPY --from=gateway-builder /app/target/release/zerorouter-gateway /usr/local/bin/
COPY --from=zeroclaw-builder /app/target/release/zeroclaw /usr/local/bin/

EXPOSE 8080
ENTRYPOINT ["zerorouter-gateway"]
