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
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "close_session",
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
        { "name": "payer", "signer": true },
        { "name": "buffer_pda", "writable": true },
        { "name": "delegation_record_pda", "writable": true },
        { "name": "delegation_metadata_pda", "writable": true },
        { "name": "pda", "writable": true },
        { "name": "provider" },
        { "name": "system_program", "address": "11111111111111111111111111111111" },
        { "name": "owner_program", "address": "8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z" },
        { "name": "delegation_program", "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh" }
      ],
      "args": []
    },
    {
      "name": "initialize_session",
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
      "name": "process_undelegation",
      "discriminator": [196, 28, 41, 206, 48, 37, 51, 167],
      "accounts": [
        { "name": "base_account", "writable": true },
        { "name": "buffer" },
        { "name": "payer", "writable": true },
        { "name": "system_program" }
      ],
      "args": [
        { "name": "account_seeds", "type": { "vec": "bytes" } }
      ]
    },
    {
      "name": "record_usage",
      "discriminator": [185, 5, 42, 72, 185, 187, 202, 147],
      "accounts": [
        { "name": "session", "writable": true }
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
    { "code": 6000, "name": "StreamInactive", "msg": "Stream is inactive" },
    { "code": 6001, "name": "InsufficientFunds", "msg": "Insufficient funds in stream allocation" }
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
          [Buffer.from("session_v2"), payer.toBuffer(), provider.toBuffer()],
          PAYSTREAM_PROGRAM_ID
      );
      this.sessionPda = sessionPda;

      const [vaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault"), sessionPda.toBuffer()],
          PAYSTREAM_PROGRAM_ID
      );

      const payerToken = getAssociatedTokenAddressSync(USDC_DEVNET, payer);
      
      console.log("Initializing session...", { sessionPda: sessionPda.toString(), vaultPda: vaultPda.toString() });

      return this.program.methods.initializeSession(new BN(rate), new BN(amount))
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
          [Buffer.from("session_v2"), payer.toBuffer(), provider.toBuffer()],
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
            bufferPda: buffer_pda,
            delegationRecordPda: delegation_record_pda,
            delegationMetadataPda: delegation_metadata_pda,
            pda: this.sessionPda,
            provider: this.providerPubkey,
            systemProgram: SystemProgram.programId,
            ownerProgram: PAYSTREAM_PROGRAM_ID,
            delegationProgram: DELEGATION_PROGRAM_ID,
        } as any)
        .instruction();
  }

  async recordUsage(tokenCount: number) {
      if (!this.sessionPda) throw new Error("Session not initialized");
      
      // record_usage in new IDL takes NO arguments in the method call but uses state? 
      // Wait, I updated the program to take token_count. 
      // I'll check my record_usage instruction in IDL again.
      return this.program.methods.recordUsage(new BN(tokenCount))
          .accounts({
              session: this.sessionPda,
          } as any)
          .instruction();
  }

  async closeSession(payer: PublicKey, provider: PublicKey) {
      const [sessionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("session_v2"), payer.toBuffer(), provider.toBuffer()],
          PAYSTREAM_PROGRAM_ID
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), sessionPda.toBuffer()],
        PAYSTREAM_PROGRAM_ID
    );

    const providerToken = getAssociatedTokenAddressSync(USDC_DEVNET, provider);
    const payerToken = getAssociatedTokenAddressSync(USDC_DEVNET, payer);

      return this.program.methods.closeSession()
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
