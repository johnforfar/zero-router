"use server";

import { Keypair, Transaction, Connection, clusterApiUrl } from "@solana/web3.js";
import bs58 from "bs58";

export async function signTransactionServer(serializedTx: string): Promise<string> {
    const secretStr = process.env.DEMO_WALLET_SECRET;
    if (!secretStr) throw new Error("Server signer key missing");
    
    let secretKey: Uint8Array;
    if (secretStr.startsWith("[")) {
        secretKey = new Uint8Array(JSON.parse(secretStr));
    } else {
        secretKey = bs58.decode(secretStr);
    }

    const signer = Keypair.fromSecretKey(secretKey);
    const tx = Transaction.from(Buffer.from(serializedTx, 'base64'));
    tx.partialSign(signer);
    return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
}
