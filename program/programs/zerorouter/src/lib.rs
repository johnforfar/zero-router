use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use ephemeral_rollups_sdk::anchor::{delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;

declare_id!("8Wnd5SSnzjDrFY1Up1Lqwz4QZJvpQcMT3dimQAjZ561Z");

#[ephemeral]
#[program]
pub mod zerorouter {
    use super::*;

    pub fn initialize_stream(ctx: Context<InitializeStream>, rate: u64, amount: u64) -> Result<()> {
        let session = &mut ctx.accounts.session;
        session.payer = ctx.accounts.payer.key();
        session.provider = ctx.accounts.provider.key();
        session.rate = rate;
        session.is_active = true;
        session.bump = ctx.bumps.session;
        session.total_deposited = amount;
        session.accumulated_amount = 0;

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payer_token.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        Ok(())
    }

    pub fn tick(ctx: Context<Tick>, token_count: u64) -> Result<()> {
        let session = &mut ctx.accounts.session;
        require!(session.is_active, ZeroRouterError::StreamInactive);

        let cost = token_count * session.rate;
        require!(
            session.accumulated_amount + cost <= session.total_deposited,
            ZeroRouterError::InsufficientFunds
        );

        session.accumulated_amount += cost;
        Ok(())
    }

    pub fn close_stream(ctx: Context<CloseStream>) -> Result<()> {
        let session = &ctx.accounts.session;
        
        let seeds = &[
            b"session_v1",
            session.payer.as_ref(),
            session.provider.as_ref(),
            &[session.bump],
        ];
        let signer = &[&seeds[..]];

        if session.accumulated_amount > 0 {
            let transfer_host_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.provider_token.to_account_info(),
                    authority: session.to_account_info(),
                },
                signer,
            );
            token::transfer(transfer_host_ctx, session.accumulated_amount)?;
        }

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

    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        let payer_key = ctx.accounts.payer.key();
        let provider_key = ctx.accounts.provider.key();

        let seeds: &[&[u8]] = &[
            b"session_v1",
            payer_key.as_ref(),
            provider_key.as_ref(),
        ];

        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            seeds,
            DelegateConfig::default(),
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeStream<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 32 + 32 + 8 + 1 + 1 + 8 + 8,
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
    
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer_token: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Tick<'info> {
    #[account(
        mut,
        seeds = [b"session_v1", session.payer.as_ref(), session.provider.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, SessionAccount>,
}

#[derive(Accounts)]
pub struct CloseStream<'info> {
    #[account(
        mut,
        close = payer,
        seeds = [b"session_v1", session.payer.as_ref(), session.provider.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, SessionAccount>,

    #[account(
        mut,
        token::authority = session,
        seeds = [b"vault", session.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub provider_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub payer_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK: Provider used for seed verification
    pub provider: UncheckedAccount<'info>,
    /// CHECK: The account to be delegated
    #[account(
        mut,
        seeds = [b"session_v1", payer.key().as_ref(), provider.key().as_ref()],
        bump,
        del
    )]
    pub pda: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct SessionAccount {
    pub payer: Pubkey,
    pub provider: Pubkey,
    pub rate: u64,
    pub is_active: bool,
    pub bump: u8,
    pub total_deposited: u64,
    pub accumulated_amount: u64,
}

#[error_code]
pub enum ZeroRouterError {
    #[msg("Stream is inactive")]
    StreamInactive,
    #[msg("Insufficient funds in stream allocation")]
    InsufficientFunds,
}
