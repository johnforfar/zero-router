import { Connection, PublicKey, Transaction, SystemProgram, Keypair, VersionedTransaction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
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

// ZeroRouter IDL Definition (Matches Deployed Program Exactly)
const IDL: any = {
  "address": "8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z",
  "metadata": {
    "name": "zerorouter",
    "version": "0.1.0"
  },
  "instructions": [
    {
      "name": "initialize_stream",
      "discriminator": [69, 130, 92, 236, 107, 231, 159, 129],
      "accounts": [
        { "name": "session", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "provider" },
        { "name": "mint" },
        { "name": "payer_token", "writable": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { "name": "rent", "address": "SysvarRent111111111111111111111111111111111" }
      ],
      "args": [
        { "name": "rate", "type": "u64" },
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "tick",
      "discriminator": [185, 5, 42, 72, 185, 187, 202, 147],
      "accounts": [
        { "name": "session", "writable": true }
      ],
      "args": [
        { "name": "token_count", "type": "u64" }
      ]
    },
    {
      "name": "close_stream",
      "discriminator": [68, 114, 178, 140, 222, 38, 248, 211],
      "accounts": [
        { "name": "session", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "provider_token", "writable": true },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "payer_token", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
        "name": "delegate",
        "discriminator": [90, 147, 75, 178, 85, 88, 4, 137],
        "accounts": [
            { "name": "payer", "writable": true, "signer": true },
            { "name": "pda", "writable": true },
            { "name": "provider" },
            { "name": "owner_program", "address": "8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z" },
            { "name": "buffer", "writable": true },
            { "name": "delegation_record", "writable": true },
            { "name": "delegation_metadata", "writable": true },
            { "name": "delegation_program", "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh" },
            { "name": "system_program", "address": "11111111111111111111111111111111" }
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
  "types": [
    {
      "name": "SessionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "payer", "type": "pubkey" },
          { "name": "provider", "type": "pubkey" },
          { "name": "rate", "type": "u64" },
          { "name": "is_active", "type": "bool" },
          { "name": "bump", "type": "u8" },
          { "name": "total_deposited", "type": "u64" },
          { "name": "accumulated_amount", "type": "u64" }
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

      return this.program.methods.initialize_stream(new BN(rate), new BN(amount))
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

      const bufferPda = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(
        this.sessionPda,
        PAYSTREAM_PROGRAM_ID
      );
      const delegationRecordPda = delegationRecordPdaFromDelegatedAccount(
        this.sessionPda
      );
      const delegationMetadataPda = delegationMetadataPdaFromDelegatedAccount(
        this.sessionPda
      );

      return this.program.methods.delegate()
        .accounts({
            payer: this.payerPubkey,
            pda: this.sessionPda,
            provider: this.providerPubkey,
            ownerProgram: PAYSTREAM_PROGRAM_ID,
            buffer: bufferPda,
            delegationRecord: delegationRecordPda,
            delegationMetadata: delegationMetadataPda,
            delegationProgram: DELEGATION_PROGRAM_ID,
            systemProgram: SystemProgram.programId
        } as any)
        .instruction();
  }

  async recordUsage(tokenCount: number) {
      if (!this.sessionPda) throw new Error("Session not initialized");
      
      return this.program.methods.tick(new BN(tokenCount))
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

      return this.program.methods.close_stream()
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
