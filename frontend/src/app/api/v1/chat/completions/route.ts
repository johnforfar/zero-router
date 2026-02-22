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
            const hostPubkey = new PublicKey(process.env.NEXT_PUBLIC_PROVIDER_WALLET || "9pYyW7Vq8vR1v8yG7XJmK8z9w9hS6z2yL6R1f8gH7J3");

            const [pda] = PublicKey.findProgramAddressSync([Buffer.from("session_final_v1"), userPubkey.toBuffer(), hostPubkey.toBuffer()], PAYSTREAM_PROGRAM_ID);
            sessionPdaStr = pda.toBase58();
            client.sessionPda = pda;
            client.payerPubkey = userPubkey;
            client.hostPubkey = hostPubkey;
            log(`Derived Session PDA: ${sessionPdaStr}`);

            solBalance = (await connection.getBalance(userPubkey)) / LAMPORTS_PER_SOL;
            log(`Current SOL Balance: ${solBalance}`);
            
            // Use 'processed' to detect the absolute latest state
            const sessionInfo = await connection.getAccountInfo(pda, "processed");
            const isInitialized = sessionInfo !== null;
            
            const delegationRecordPda = delegationRecordPdaFromDelegatedAccount(pda);
            const delegationInfo = await connection.getAccountInfo(delegationRecordPda, "processed");
            const isDelegated = delegationInfo !== null;

            if (!isInitialized || !isDelegated) {
                log("Session needs setup. Building atomic transaction...");
                const setupTx = new Transaction();
                
                // Always add InitializeStream if not delegated to ensure PDA exists for delegation
                // Program uses init_if_needed so this is safe and idempotent
                log("  + Adding InitializeStream instruction");
                const initIx = await client.initializeSession(userPubkey, hostPubkey, 1000000, 100);
                setupTx.add(initIx);

                if (!isDelegated) {
                    log("  + Adding Delegate instruction");
                    const delegateIx = await client.delegateSession();
                    setupTx.add(delegateIx);
                }

                const { blockhash } = await connection.getLatestBlockhash();
                setupTx.recentBlockhash = blockhash;
                setupTx.feePayer = userPubkey;
                
                const signedSetupTx = await wallet.signTransaction(setupTx);
                // Use skipPreflight: true to bypass simulation race conditions during atomic setup
                const setupSig = await connection.sendRawTransaction(signedSetupTx.serialize(), {
                    skipPreflight: true
                });
                await connection.confirmTransaction(setupSig, "confirmed");
                log(`L1 Setup Transaction Success: ${setupSig}`);
                
                l1Sig = !isInitialized ? setupSig : "ALREADY_DELEGATED";
                delegateSig = !isDelegated ? setupSig : "ALREADY_DELEGATED";
            } else {
                log("Session already initialized and delegated.");
                l1Sig = "ALREADY_DELEGATED";
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
