// Tuk Tuk Integration for golem_registry
// 
// This module adds support for Tuk Tuk cron-based wake-ups.
// The key change: heartbeat can be called by either:
// 1. The wallet that owns the agent account
// 2. A designated "wake_up_authority" PDA
//
// This allows Tuk Tuk to call heartbeat on a schedule
// without needing the wallet's private key.

use anchor_lang::prelude::*;

/// Modified Heartbeat instruction that accepts PDA signer
/// 
/// # Accounts
/// - agent: The agent account to update
/// - authority: Either the wallet owner OR the wake_up_authority PDA
/// - wake_up_authority: Optional PDA that can sign on behalf of the agent
#[derive(Accounts)]
pub struct HeartbeatWithPda<'info> {
    #[account(
        mut,
        seeds = [b"agent", wallet.key().as_ref()],
        bump = agent.bump,
    )]
    pub agent: Account<'info, AgentAccount>,
    
    /// The wallet that owns this agent account
    /// CHECK: Used only for PDA derivation
    pub wallet: AccountInfo<'info>,
    
    /// Either the wallet owner or the wake_up_authority PDA
    pub authority: Signer<'info>,
    
    /// The wake_up_authority PDA (optional)
    /// If present, allows this PDA to sign instead of wallet
    /// CHECK: Verified in instruction logic
    pub wake_up_authority: Option<AccountInfo<'info>>,
}

/// Register a wake_up_authority PDA for an agent
/// This allows Tuk Tuk to call heartbeat on the agent's behalf
#[derive(Accounts)]
pub struct SetWakeUpAuthority<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = wallet @ GolemError::Unauthorized,
    )]
    pub agent: Account<'info, AgentAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: The new wake_up_authority to set
    pub wake_up_authority: AccountInfo<'info>,
}

// Add to AgentAccount:
// pub wake_up_authority: Option<Pubkey>,

/// Implementation of heartbeat with PDA support
pub fn heartbeat_with_pda(ctx: Context<HeartbeatWithPda>) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    
    // Verify authority is either:
    // 1. The wallet owner
    // 2. The wake_up_authority PDA (if set)
    let is_wallet = ctx.accounts.authority.key() == ctx.accounts.wallet.key();
    let is_wake_up_authority = ctx.accounts.wake_up_authority
        .as_ref()
        .map(|pda| ctx.accounts.authority.key() == pda.key())
        .unwrap_or(false);
    
    require!(is_wallet || is_wake_up_authority, GolemError::Unauthorized);
    
    agent.last_seen = Clock::get()?.unix_timestamp;
    
    emit!(HeartbeatEvent {
        wallet: agent.wallet,
        timestamp: agent.last_seen,
    });
    
    Ok(())
}

/// Set the wake_up_authority for an agent
pub fn set_wake_up_authority(
    ctx: Context<SetWakeUpAuthority>,
    wake_up_authority: Pubkey,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    agent.wake_up_authority = Some(wake_up_authority);
    
    emit!(WakeUpAuthoritySet {
        wallet: agent.wallet,
        wake_up_authority,
    });
    
    Ok(())
}

#[event]
pub struct WakeUpAuthoritySet {
    pub wallet: Pubkey,
    pub wake_up_authority: Pubkey,
}
