use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use ephemeral_rollups_sdk::anchor::ephemeral;

declare_id!("scr8KCMrUgArFL7bamxFccwbYhxRv4qpWb1auhomeSE");

#[ephemeral]
#[program]
pub mod zerorouter {
    use super::*;

    pub fn initialize_session(ctx: Context<InitializeSession>, rate: u64, amount: u64) -> Result<()> {
        let session = &mut ctx.accounts.session;
        session.payer = ctx.accounts.payer.key();
        session.provider = ctx.accounts.provider.key();
        session.rate_per_token = rate;
        session.accumulated_amount = 0;
        session.total_deposited = amount; // Track total deposited for bounds checking
        session.bump = ctx.bumps.session;
        session.is_active = true;

        // Lock funds on L1
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payer_token.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// This instruction runs on the Ephemeral Rollup (ER)
    /// It is called frequently (e.g. per second or per token)
    pub fn record_usage(ctx: Context<RecordUsage>, token_count: u64) -> Result<()> {
        let session = &mut ctx.accounts.session;
        require!(session.is_active, ZeroRouterError::SessionInactive);
        
        let cost = token_count * session.rate_per_token;
        
        // Virtual Accounting Check (ensure we don't overspend the deposit)
        require!(
            session.accumulated_amount + cost <= session.total_deposited,
            ZeroRouterError::InsufficientFunds
        );

        session.accumulated_amount += cost;
        
        // We can emit an event here if needed, but for high-throughput, just state update is enough.
        // msg!("Recorded usage: {} tokens. Cost: {}. New Total: {}", token_count, cost, session.accumulated_amount);
        Ok(())
    }

    /// This instruction runs on L1 to settle the session
    pub fn close_session(ctx: Context<CloseSession>) -> Result<()> {
        let session = &ctx.accounts.session;
        
        let seeds = &[
            b"session_v1",
            session.payer.as_ref(),
            session.provider.as_ref(),
            &[session.bump],
        ];
        let signer = &[&seeds[..]];

        // 1. Pay Provider (Accumulated Amount)
        if session.accumulated_amount > 0 {
            let transfer_provider_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.provider_token.to_account_info(),
                    authority: session.to_account_info(),
                },
                signer,
            );
            token::transfer(transfer_provider_ctx, session.accumulated_amount)?;
        }

        // 2. Refund Payer (Remaining)
        let remaining = ctx.accounts.vault.amount; 
        
        if remaining > 0 {
            let transfer_payer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.payer_token.to_account_info(),
                    authority: session.to_account_info(),
                },
                signer,
            );
            token::transfer(transfer_payer_ctx, remaining)?;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSession<'info> {
    #[account(
        init, 
        payer = payer, 
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1, // Added space for bool and total_deposited
        seeds = [b"session_v1", payer.key().as_ref(), provider.key().as_ref()],
        bump
    )]
    pub session: Account<'info, SessionAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        token::mint = mint,
        token::authority = session,
        seeds = [b"vault", session.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Provider address
    pub provider: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordUsage<'info> {
    #[account(
        mut,
        seeds = [b"session_v1", session.payer.as_ref(), session.provider.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, SessionAccount>,
}

#[derive(Accounts)]
pub struct CloseSession<'info> {
    #[account(
        mut,
        seeds = [b"session_v1", session.payer.as_ref(), session.provider.as_ref()],
        bump = session.bump,
        close = payer // Close the account and return rent to payer
    )]
    pub session: Account<'info, SessionAccount>,
    #[account(
        mut,
        seeds = [b"vault", session.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>, // The one closing needs to sign (or the provider could close?) 
                              // Ideally, the authority should be checked. 
                              // For now, let's say only payer can close to get refund, 
                              // or maybe provider can close too? 
                              // In PayStream, usually payer initiates close.
    #[account(mut)]
    pub provider_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct SessionAccount {
    pub payer: Pubkey,
    pub provider: Pubkey,
    pub rate_per_token: u64,
    pub accumulated_amount: u64,
    pub total_deposited: u64,
    pub bump: u8,
    pub is_active: bool,
}

#[error_code]
pub enum ZeroRouterError {
    #[msg("Session is inactive")]
    SessionInactive,
    #[msg("Insufficient funds in session")]
    InsufficientFunds,
}
