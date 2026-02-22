import { Connection, PublicKey, Transaction, SystemProgram, Keypair, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN, Idl } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
    delegationRecordPdaFromDelegatedAccount,
    delegationMetadataPdaFromDelegatedAccount,
    DELEGATION_PROGRAM_ID,
  } from "@magicblock-labs/ephemeral-rollups-sdk";

export const PAYSTREAM_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "scr8KCMrUgArFL7bamxFccwbYhxRv4qpWb1auhomeSE");
export const USDC_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// ZeroRouter IDL Definition (Matches Anchor 0.30+)
const IDL: any = {
  "address": process.env.NEXT_PUBLIC_PROGRAM_ID || "scr8KCMrUgArFL7bamxFccwbYhxRv4qpWb1auhomeSE",
  "metadata": {
      "address": process.env.NEXT_PUBLIC_PROGRAM_ID || "scr8KCMrUgArFL7bamxFccwbYhxRv4qpWb1auhomeSE",
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
        { "name": "session", "writable": true, "signer": false },
        { "name": "vault", "writable": true, "signer": false },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "provider", "writable": false, "signer": false },
        { "name": "payer_token", "writable": true, "signer": false },
        { "name": "mint", "writable": false, "signer": false },
        { "name": "token_program", "writable": false, "signer": false },
        { "name": "system_program", "writable": false, "signer": false }
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
        { "name": "session", "writable": true, "signer": false }
      ],
      "args": [
        { "name": "token_count", "type": "u64" }
      ]
    },
    {
      "name": "close_session",
      "discriminator": [68, 114, 178, 140, 222, 38, 248, 211],
      "accounts": [
        { "name": "session", "writable": true, "signer": false },
        { "name": "vault", "writable": true, "signer": false },
        { "name": "payer", "writable": true, "signer": true },
        { "name": "provider_token", "writable": true, "signer": false },
        { "name": "payer_token", "writable": true, "signer": false },
        { "name": "token_program", "writable": false, "signer": false }
      ],
      "args": []
    },
    {
        "name": "delegate",
        "discriminator": [90, 147, 75, 178, 85, 88, 4, 137],
        "accounts": [
            { "name": "payer", "writable": true, "signer": true },
            { "name": "pda", "writable": false, "signer": false },
            { "name": "owner", "writable": false, "signer": false },
            { "name": "buffer", "writable": true, "signer": false },
            { "name": "delegationRecord", "writable": true, "signer": false },
            { "name": "delegationMetadata", "writable": true, "signer": false },
            { "name": "delegationProgram", "writable": false, "signer": false },
            { "name": "systemProgram", "writable": false, "signer": false }
        ],
        "args": []
    },
    {
      "name": "process_undelegation",
      "discriminator": [196, 28, 41, 206, 48, 37, 51, 167],
      "accounts": [
        { "name": "base_account", "writable": true },
        { "name": "buffer", "writable": false },
        { "name": "payer", "writable": true },
        { "name": "system_program", "writable": false }
      ],
      "args": [
        { "name": "account_seeds", "type": { "vec": "bytes" } }
      ]
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
        // Serialize, send to server, get back signed base64, deserialize
        if (tx instanceof Transaction) {
            const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
            const signedBase64 = await signTransactionServer(serialized);
            return Transaction.from(Buffer.from(signedBase64, 'base64')) as T;
        }
        // VersionedTransaction support if needed
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

      return this.program.methods.initializeSession(new BN(rate), new BN(amount))
          .accounts({
              session: sessionPda,
              vault: vaultPda,
              payer: payer,
              provider: provider,
              payerToken: payerToken,
              mint: USDC_DEVNET,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
          })
          .instruction();
  }

  async delegateSession() {
      if (!this.sessionPda || !this.payerPubkey) throw new Error("Session not initialized");

      const bufferPda = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(
        this.sessionPda,
        PAYSTREAM_PROGRAM_ID
      );
      const delegationRecord = delegationRecordPdaFromDelegatedAccount(
        this.sessionPda
      );
      const delegationMetadata = delegationMetadataPdaFromDelegatedAccount(
        this.sessionPda
      );

      return this.program.methods.delegate()
        .accounts({
            payer: this.payerPubkey,
            pda: this.sessionPda,
            owner: PAYSTREAM_PROGRAM_ID,
            buffer: bufferPda,
            delegationRecord: delegationRecord,
            delegationMetadata: delegationMetadata,
            delegationProgram: DELEGATION_PROGRAM_ID,
            systemProgram: SystemProgram.programId
        })
        .instruction();
  }

  async recordUsage(tokenCount: number) {
      if (!this.sessionPda) throw new Error("Session not initialized");
      
      return this.program.methods.recordUsage(new BN(tokenCount))
          .accounts({
              session: this.sessionPda,
          })
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

      const payerToken = getAssociatedTokenAddressSync(USDC_DEVNET, payer);
      const providerToken = getAssociatedTokenAddressSync(USDC_DEVNET, provider);

      return this.program.methods.closeSession()
          .accounts({
              session: sessionPda,
              vault: vaultPda,
              payer: payer,
              providerToken: providerToken,
              payerToken: payerToken,
              tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
  }
}
