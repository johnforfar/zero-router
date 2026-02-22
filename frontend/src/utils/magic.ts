import { Connection, PublicKey, Transaction, SystemProgram, Keypair, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN, Idl } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
    delegationRecordPdaFromDelegatedAccount,
    delegationMetadataPdaFromDelegatedAccount,
    DELEGATION_PROGRAM_ID,
  } from "@magicblock-labs/ephemeral-rollups-sdk";

export const PAYSTREAM_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z");
export const USDC_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// ZeroRouter IDL Definition (Matches Anchor 0.30+)
const IDL: any = {
  "address": process.env.NEXT_PUBLIC_PROGRAM_ID || "8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z",
  "metadata": {
      "address": process.env.NEXT_PUBLIC_PROGRAM_ID || "8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z",
      "name": "zerorouter",
      "version": "0.1.0",
      "spec": "0.1.0"
  },
  "version": "0.1.0",
  "name": "zerorouter",
  "instructions": [
    {
      "name": "initialize_session",
      "discriminator": [69, 130, 92, 236, 107, 231, 159, 129],
      "accounts": [
        { "name": "session", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "provider", "writable": false },
        { "name": "payer_token", "writable": true },
        { "name": "mint", "writable": false },
        { "name": "token_program", "writable": false },
        { "name": "system_program", "writable": false }
      ],
      "args": [
        { "name": "rate", "type": "u64" },
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "record_usage",
      "discriminator": [185, 5, 42, 72, 185, 187, 202, 147],
      "accounts": [
        { "name": "session", "writable": true }
      ],
      "args": [
        { "name": "token_count", "type": "u64" }
      ]
    },
    {
      "name": "close_session",
      "discriminator": [68, 114, 178, 140, 222, 38, 248, 211],
      "accounts": [
        { "name": "session", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "provider_token", "writable": true },
        { "name": "payer_token", "writable": true },
        { "name": "token_program", "writable": false }
      ],
      "args": []
    },
    {
        "name": "delegate",
        "discriminator": [90, 147, 75, 178, 85, 88, 4, 137],
        "accounts": [
            { "name": "payer", "writable": true, "signer": true },
            { "name": "pda", "writable": true },
            { "name": "provider", "writable": false },
            { "name": "owner_program", "writable": false },
            { "name": "buffer", "writable": true },
            { "name": "delegation_record", "writable": true },
            { "name": "delegation_metadata", "writable": true },
            { "name": "delegation_program", "writable": false },
            { "name": "system_program", "writable": false }
        ],
        "args": []
    }
  ],
  "accounts": [
    {
      "name": "SessionAccount",
      "discriminator": [74, 34, 65, 133, 96, 163, 80, 69]
    }
  ],
  "errors": [
      { "code": 6000, "name": "SessionInactive", "msg": "Session is inactive" },
      { "code": 6001, "name": "InsufficientFunds", "msg": "Insufficient funds in session" }
  ],
  "types": [
    {
      "name": "SessionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "payer", "type": "pubkey" },
          { "name": "provider", "type": "pubkey" },
          { "name": "rate_per_token", "type": "u64" },
          { "name": "accumulated_amount", "type": "u64" },
          { "name": "total_deposited", "type": "u64" },
          { "name": "bump", "type": "u8" },
          { "name": "is_active", "type": "bool" }
        ]
      }
    }
  ]
};

import { signTransactionServer } from "@/app/actions";

export class DemoWallet implements Wallet {
    publicKey: PublicKey;

    constructor(publicKeyStr: string) {
        this.publicKey = new PublicKey(publicKeyStr);
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
        if (tx instanceof Transaction) {
            const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
            const signedBase64 = await signTransactionServer(serialized);
            return Transaction.from(Buffer.from(signedBase64, 'base64')) as T;
        }
        throw new Error("VersionedTransaction not supported in DemoWallet yet");
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
        return Promise.all(txs.map(tx => this.signTransaction(tx)));
    }
    
    get payer(): Keypair {
        throw new Error("Payer private key not available in DemoWallet (Server Signing)");
    }
}

export class PayStreamClient {
  connection: Connection;
  provider: AnchorProvider;
  program: Program;
  
  // Session State
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

      const [sessionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("session_v1"), payer.toBuffer(), provider.toBuffer()],
          PAYSTREAM_PROGRAM_ID
      );
      this.sessionPda = sessionPda;

      const [vaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault"), sessionPda.toBuffer()],
          PAYSTREAM_PROGRAM_ID
      );

      const payerToken = getAssociatedTokenAddressSync(USDC_DEVNET, payer);
      
      console.log("Initializing session...", { sessionPda: sessionPda.toString(), vaultPda: vaultPda.toString() });

      return this.program.methods.initialize_session(new BN(rate), new BN(amount))
          .accounts({
              session: sessionPda,
              vault: vaultPda,
              payer: payer,
              provider: provider,
              payerToken: payerToken,
              mint: USDC_DEVNET,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
          } as any)
          .instruction();
  }

  async isSessionInitialized(payer: PublicKey, provider: PublicKey): Promise<boolean> {
      const [sessionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("session_v1"), payer.toBuffer(), provider.toBuffer()],
          PAYSTREAM_PROGRAM_ID
      );
      try {
          const account = await (this.program.account as any).SessionAccount.fetchNullable(sessionPda);
          return account !== null;
      } catch (e) {
          return false;
      }
  }

  async delegateSession() {
      if (!this.sessionPda || !this.payerPubkey || !this.providerPubkey) throw new Error("Session not initialized");

      const buffer_pda = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(
        this.sessionPda,
        PAYSTREAM_PROGRAM_ID
      );
      const delegation_record_pda = delegationRecordPdaFromDelegatedAccount(
        this.sessionPda
      );
      const delegation_metadata_pda = delegationMetadataPdaFromDelegatedAccount(
        this.sessionPda
      );

      return this.program.methods.delegate()
        .accounts({
            payer: this.payerPubkey,
            pda: this.sessionPda,
            provider: this.providerPubkey,
            ownerProgram: PAYSTREAM_PROGRAM_ID,
            buffer: buffer_pda,
            delegationRecord: delegation_record_pda,
            delegationMetadata: delegation_metadata_pda,
            delegationProgram: DELEGATION_PROGRAM_ID,
            systemProgram: SystemProgram.programId
        } as any)
        .instruction();
  }

  async recordUsage(tokenCount: number) {
      if (!this.sessionPda) throw new Error("Session not initialized");
      
      return this.program.methods.record_usage(new BN(tokenCount))
          .accounts({
              session: this.sessionPda,
          } as any)
          .instruction();
  }

  async closeSession(payer: PublicKey, provider: PublicKey) {
      const [sessionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("session_v1"), payer.toBuffer(), provider.toBuffer()],
          PAYSTREAM_PROGRAM_ID
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), sessionPda.toBuffer()],
        PAYSTREAM_PROGRAM_ID
    );

    const providerToken = getAssociatedTokenAddressSync(USDC_DEVNET, provider);
    const payerToken = getAssociatedTokenAddressSync(USDC_DEVNET, payer);

      return this.program.methods.close_session()
          .accounts({
              session: sessionPda,
              vault: vaultPda,
              payer: payer,
              providerToken: providerToken,
              payerToken: payerToken,
              tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();
  }
}
