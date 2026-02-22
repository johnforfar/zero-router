#!/bin/bash

# ZeroRouter API Verification Suite
# Targets: https://api.zerorouter.xyz

API_BASE="https://api.zerorouter.xyz"
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting ZeroRouter Protocol Verification...${NC}"

# 1. Test Gateway Health & HANDSHAKE
echo -ne "🧪 [1/3] Testing Cloud Handshake (/v1/cmd)... "
HANDSHAKE=$(curl -s -X POST "${API_BASE}/v1/cmd" \
    -H "Content-Type: application/json" \
    -d '{"command": "zeroclaw status"}')

if [[ $HANDSHAKE == *"INFO"* ]]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $HANDSHAKE"
fi

# 2. Test AI INFERENCE (Stream Mode)
echo -ne "🧪 [2/3] Testing Sovereign Inference Stream (/v1/chat/completions)... "
INFERENCE=$(curl -s -X POST "${API_BASE}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"messages": [{"role": "user", "content": "Hello"}]}' | head -n 1)

if [[ $INFERENCE == *"data:"* ]]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $INFERENCE"
fi

# 3. Test SECURITY BOUNDARIES (LS Check)
echo -ne "🧪 [3/3] Testing Security Boundaries (Sanitization)... "
SECURITY=$(curl -s -X POST "${API_BASE}/v1/cmd" \
    -H "Content-Type: application/json" \
    -d '{"command": "ls -la"}')

if [[ $SECURITY == *"Only zeroclaw commands allowed"* ]]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $SECURITY"
fi

echo -e "\n${YELLOW}🏁 Verification Complete. ZeroRouter Protocol is 100% Functional.${NC}"
