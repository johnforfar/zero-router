# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ gcc libusb-dev eudev-dev linux-headers
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Pass Build Args to Environment
ARG NEXT_PUBLIC_ZEROROUTER_API_URL
ARG NEXT_PUBLIC_DEMO_WALLET
ARG NEXT_PUBLIC_PROGRAM_ID

ENV NEXT_PUBLIC_ZEROROUTER_API_URL=$NEXT_PUBLIC_ZEROROUTER_API_URL
ENV NEXT_PUBLIC_DEMO_WALLET=$NEXT_PUBLIC_DEMO_WALLET
ENV NEXT_PUBLIC_PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID

RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
CMD ["npm", "start"]
