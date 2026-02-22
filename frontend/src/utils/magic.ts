import { Connection, PublicKey, Transaction, SystemProgram, Keypair, VersionedTransaction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN, Idl } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
    delegationRecordPdaFromDelegatedAccount,
    delegationMetadataPdaFromDelegatedAccount,
    DELEGATION_PROGRAM_ID as SDK_DELEGATION_PROGRAM_ID,
  } from "@magicblock-labs/ephemeral-rollups-sdk";

// Hardcoded fallbacks to ensure zero-config stability while allowing env overrides
const FALLBACK_PROGRAM_ID = "8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z";
const FALLBACK_DELEGATION_ID = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";
const FALLBACK_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const PAYSTREAM_PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || FALLBACK_PROGRAM_ID
);

export const DELEGATION_PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_DELEGATION_PROGRAM_ID || FALLBACK_DELEGATION_ID
);

export const USDC_DEVNET = new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT || FALLBACK_USDC_MINT
);

// ZeroRouter IDL Definition (Matches Deployed Program Exactly)
const IDL: any = {
  "address": PAYSTREAM_PROGRAM_ID.toBase58(),
  "metadata": { "name": "zerorouter", "version": "0.1.0" },
  "instructions": [
    {
      "name": "initializeStream",
      "discriminator": [118, 75, 0, 207, 137, 93, 113, 74],
      "accounts": [
        { "name": "session", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "provider" },
        { "name": "mint" },
        { "name": "payerToken", "writable": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" },
        { "name": "tokenProgram", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { "name": "rent", "address": "SysvarRent111111111111111111111111111111111" }
      ],
      "args": [
        { "name": "rate", "type": "u64" },
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "tick",
      "discriminator": [92, 79, 44, 8, 101, 80, 63, 15],
      "accounts": [
        { "name": "session", "writable": true }
      ],
      "args": []
    },
    {
      "name": "closeStream",
      "discriminator": [255, 241, 196, 212, 95, 93, 160, 89],
      "accounts": [
        { "name": "session", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "providerToken", "writable": true },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "payerToken", "writable": true },
        { "name": "tokenProgram", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
        "name": "delegate",
        "discriminator": [90, 147, 75, 178, 85, 88, 4, 137],
        "accounts": [
            { "name": "payer", "writable": true, "signer": true },
            { "name": "provider", "writable": false },
            { "name": "buffer", "writable": true },
            { "name": "pda", "writable": true },
            { "name": "delegationRecord", "writable": true },
            { "name": "delegationMetadata", "writable": true },
            { "name": "delegationProgram", "address": DELEGATION_PROGRAM_ID.toBase58() },
            { "name": "systemProgram", "address": "11111111111111111111111111111111" },
            { "name": "ownerProgram", "address": PAYSTREAM_PROGRAM_ID.toBase58() }
        ],
        "args": []
    }
  ],
  "accounts": [
    { "name": "StreamSession", "discriminator": [161, 40, 133, 194, 180, 179, 82, 190] }
  ],
  "types": [
    {
      "name": "StreamSession",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "payer", "type": "pubkey" },
          { "name": "provider", "type": "pubkey" },
          { "name": "rate", "type": "u64" },
          { "name": "isActive", "type": "bool" },
          { "name": "bump", "type": "u8" },
          { "name": "totalDeposited", "type": "u64" },
          { "name": "accumulatedAmount", "type": "u64" }
        ]
      }
    }
  ]
};

import { signTransactionServer } from "@/app/actions";

export class DemoWallet implements Wallet {
    publicKey: PublicKey;
    constructor(publicKeyStr: string) { this.publicKey = new PublicKey(publicKeyStr); }
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
        if (tx instanceof Transaction) {
            // Safety check: ensure all instructions have a programId
            tx.instructions.forEach((ix, i) => {
                if (!ix.programId) {
                    console.warn(`[DemoWallet] Instruction ${i} missing programId. Injecting PAYSTREAM_PROGRAM_ID.`);
                    ix.programId = PAYSTREAM_PROGRAM_ID;
                }
            });
            const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
            const signedBase64 = await signTransactionServer(serialized);
            return Transaction.from(Buffer.from(signedBase64, 'base64')) as T;
        }
        throw new Error("VersionedTransaction not supported");
    }
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
        return Promise.all(txs.map(tx => this.signTransaction(tx)));
    }
    get payer(): Keypair { throw new Error("Payer private key not available"); }
}

export class PayStreamClient {
  connection: Connection;
  provider: AnchorProvider;
  program: Program;
  payerPubkey: PublicKey | null = null;
  providerPubkey: PublicKey | null = null;
  sessionPda: PublicKey | null = null;

  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection;
    this.provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    this.program = new Program(IDL, this.provider);
  }

  async initializeSession(payer: PublicKey, provider: PublicKey, amount: number, rate: number) {
      this.payerPubkey = payer;
      this.providerPubkey = provider;
      const [sessionPda] = PublicKey.findProgramAddressSync([Buffer.from("session_v1"), payer.toBuffer(), provider.toBuffer()], PAYSTREAM_PROGRAM_ID);
      this.sessionPda = sessionPda;
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), sessionPda.toBuffer()], PAYSTREAM_PROGRAM_ID);
      const payerToken = getAssociatedTokenAddressSync(USDC_DEVNET, payer);
      
      const ix = await this.program.methods.initializeStream(new BN(rate), new BN(amount))
          .accounts({
              session: sessionPda,
              vault: vaultPda,
              payer: payer,
              provider: provider,
              mint: USDC_DEVNET,
              payerToken: payerToken,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
          } as any)
          .instruction();
      ix.programId = PAYSTREAM_PROGRAM_ID;
      return ix;
  }

  async isSessionInitialized(payer: PublicKey, provider: PublicKey): Promise<boolean> {
      const [sessionPda] = PublicKey.findProgramAddressSync([Buffer.from("session_v1"), payer.toBuffer(), provider.toBuffer()], PAYSTREAM_PROGRAM_ID);
      try {
          const info = await this.connection.getAccountInfo(sessionPda);
          return info !== null;
      } catch (e) { return false; }
  }

  async delegateSession() {
      if (!this.sessionPda || !this.payerPubkey || !this.providerPubkey) throw new Error("Session not initialized");
      const buffer = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(this.sessionPda, PAYSTREAM_PROGRAM_ID);
      const delegationRecord = delegationRecordPdaFromDelegatedAccount(this.sessionPda);
      const delegationMetadata = delegationMetadataPdaFromDelegatedAccount(this.sessionPda);

      const ix = await this.program.methods.delegate()
        .accounts({
            payer: this.payerPubkey,
            provider: this.providerPubkey,
            buffer: buffer,
            pda: this.sessionPda,
            delegationRecord: delegationRecord,
            delegationMetadata: delegationMetadata,
            delegationProgram: DELEGATION_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            ownerProgram: PAYSTREAM_PROGRAM_ID,
        } as any)
        .instruction();
      ix.programId = PAYSTREAM_PROGRAM_ID;
      return ix;
  }

  async recordUsage(tokenCount: number) {
      if (!this.sessionPda) throw new Error("Session not initialized");
      // Loop to send 'tick' for each token, matching the reference's per-tick logic
      const ixs = [];
      for(let i=0; i<tokenCount; i++) {
        const ix = await this.program.methods.tick()
          .accounts({ session: this.sessionPda } as any)
          .instruction();
        ix.programId = PAYSTREAM_PROGRAM_ID; // Explicitly ensure programId is set
        ixs.push(ix);
      }
      return ixs;
  }

  async closeSession(payer: PublicKey, provider: PublicKey) {
      const [sessionPda] = PublicKey.findProgramAddressSync([Buffer.from("session_v1"), payer.toBuffer(), provider.toBuffer()], PAYSTREAM_PROGRAM_ID);
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), sessionPda.toBuffer()], PAYSTREAM_PROGRAM_ID);
      const providerToken = getAssociatedTokenAddressSync(USDC_DEVNET, provider);
      const payerToken = getAssociatedTokenAddressSync(USDC_DEVNET, payer);
      return this.program.methods.closeStream()
          .accounts({
              session: sessionPda,
              vault: vaultPda,
              providerToken: providerToken,
              payer: payer,
              payerToken: payerToken,
              tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();
  }
}
