use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use ephemeral_rollups_sdk::anchor::{delegate, ephemeral};

declare_id!("9rcfA9NmU5mJnvpcCnKNsmSTorCGDXmGnQFB63mdXDdK");

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
        session.host_fee_pool = 0;
        session.bump = ctx.bumps.session;

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

    pub fn record_usage(ctx: Context<RecordUsage>, token_count: u64) -> Result<()> {
        let session = &mut ctx.accounts.session;
        
        let cost = token_count * session.rate_per_token;
        let host_fee = cost / 10; // 10% Markup

        session.accumulated_amount += cost;
        session.host_fee_pool += host_fee;

        msg!("Recorded usage: {} tokens. Cost: {}. Host Fee: {}", token_count, cost, host_fee);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSession<'info> {
    #[account(
        init, 
        payer = payer, 
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"session_v1", payer.key().as_ref(), provider.key().as_ref()],
        bump
    )]
    pub session: Account<'info, SessionAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Provider address
    pub provider: UncheckedAccount<'info>,
    pub payer_token: Account<'info, TokenAccount>,
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

#[account]
pub struct SessionAccount {
    pub payer: Pubkey,
    pub provider: Pubkey,
    pub rate_per_token: u64,
    pub accumulated_amount: u64,
    pub host_fee_pool: u64,
    pub bump: u8,
}
