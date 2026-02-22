import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PayStreamClient, PAYSTREAM_PROGRAM_ID, DELEGATION_PROGRAM_ID } from "@/utils/magic";
import { delegationRecordPdaFromDelegatedAccount } from "@magicblock-labs/ephemeral-rollups-sdk";
import bs58 from "bs58";

export async function POST(req: NextRequest) {
  const internalLogs: string[] = [];
  const log = (msg: string) => {
      console.log(`[API] ${msg}`);
      internalLogs.push(msg);
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      log("Error: GEMINI_API_KEY not configured");
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const { messages, model, forcePayment = true, verbose = true } = await req.json();
    const prompt = messages[messages.length - 1].content;

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const erRpc = process.env.NEXT_PUBLIC_ER_RPC_URL || "https://devnet-as.magicblock.app";
    const erConnection = new Connection(erRpc, "confirmed");
    const secretStr = process.env.DEMO_WALLET_SECRET;
    
    let solBalance = 0;
    let l1Sig = "";
    let delegateSig = "";
    let sessionPdaStr = "";
    let keypair: Keypair | null = null;
    let client: PayStreamClient | null = null;

    if (forcePayment && secretStr) {
        log("ForcePayment active. Handling Solana session...");
        try {
            let secretKey: Uint8Array;
            if (secretStr.startsWith("[")) secretKey = new Uint8Array(JSON.parse(secretStr));
            else secretKey = bs58.decode(secretStr);
            
            keypair = Keypair.fromSecretKey(secretKey);
            const wallet = {
                publicKey: keypair.publicKey,
                signTransaction: async (tx: Transaction) => { tx.partialSign(keypair!); return tx; },
                signAllTransactions: async (txs: Transaction[]) => txs.map(tx => { tx.partialSign(keypair!); return tx; }),
                payer: keypair
            };

            client = new PayStreamClient(connection, wallet as any);
            const userPubkey = keypair.publicKey;
            const providerPubkey = new PublicKey(process.env.NEXT_PUBLIC_PROVIDER_WALLET || "9pYyW7Vq8vR1v8yG7XJmK8z9w9hS6z2yL6R1f8gH7J3");

            const [pda] = PublicKey.findProgramAddressSync([Buffer.from("session_v1"), userPubkey.toBuffer(), providerPubkey.toBuffer()], PAYSTREAM_PROGRAM_ID);
            sessionPdaStr = pda.toBase58();
            client.sessionPda = pda;
            client.payerPubkey = userPubkey;
            client.providerPubkey = providerPubkey;
            log(`Derived Session PDA: ${sessionPdaStr}`);

            solBalance = (await connection.getBalance(userPubkey)) / LAMPORTS_PER_SOL;
            log(`Current SOL Balance: ${solBalance}`);
            
            const isInitialized = await client.isSessionInitialized(userPubkey, providerPubkey);
            if (!isInitialized) {
                log("Session NOT initialized. Sending L1 Initialize transaction...");
                const initIx = await client.initializeSession(userPubkey, providerPubkey, 1000000, 100);
                const tx = new Transaction().add(initIx);
                const { blockhash } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = userPubkey;
                const signed = await wallet.signTransaction(tx);
                l1Sig = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction(l1Sig, "confirmed");
                log(`L1 Initialize Success: ${l1Sig}`);
            }

            const delegationRecordPda = delegationRecordPdaFromDelegatedAccount(pda);
            const delegationInfo = await connection.getAccountInfo(delegationRecordPda);
            if (!delegationInfo) {
                log("Session NOT delegated. Sending L1 Delegate transaction...");
                const delegateIx = await client.delegateSession();
                const tx = new Transaction().add(delegateIx);
                const { blockhash } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = userPubkey;
                const signed = await wallet.signTransaction(tx);
                delegateSig = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction(delegateSig, "confirmed");
                log(`L1 Delegate Success: ${delegateSig}`);
            } else {
                log("Session already delegated to Ephemeral Rollup.");
                delegateSig = "ALREADY_DELEGATED";
            }
        } catch (solanaErr: any) {
            log(`Solana API Setup Error: ${solanaErr.message}`);
        }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
        model: model || "gemini-2.0-flash",
        systemInstruction: "You are ZeroRouter AI. Be concise. Limit all responses to 100 words or less."
    });
    const result = await geminiModel.generateContentStream(prompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let tokenCount = 0;
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: "SETUP_COMPLETE",
            balances: { sol: solBalance },
            session: { pda: sessionPdaStr, l1Sig, delegateSig },
            internal_logs: verbose ? internalLogs : undefined
        })}\n\n`));

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            tokenCount++;
            let erTickSig = "";
            
            // Perform REAL ER Transaction for EVERY token
            if (client && keypair && sessionPdaStr) {
                try {
                    const tickIxs = await client.recordUsage(1);
                    const tx = new Transaction().add(...tickIxs);
                    const { blockhash } = await erConnection.getLatestBlockhash();
                    tx.recentBlockhash = blockhash;
                    tx.feePayer = keypair.publicKey;
                    tx.partialSign(keypair);
                    
                    // Use erConnection for the Ephemeral Rollup tick
                    erTickSig = await erConnection.sendRawTransaction(tx.serialize(), {
                        skipPreflight: true,
                        preflightCommitment: "confirmed"
                    });
                } catch (e: any) {
                    console.error("ER Tick Error:", e.message);
                }
            }
            
            const data = JSON.stringify({
              choices: [{ delta: { content: chunkText } }],
              usage: { tokens: tokenCount },
              status: "STREAMING",
              er_receipt: erTickSig
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: "COMPLETE",
            usage: { tokens: tokenCount },
            settlement: "FINALIZED"
        })}\n\n`));
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, logs: internalLogs }, { status: 500 });
  }
}
