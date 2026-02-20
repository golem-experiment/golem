use anchor_lang::prelude::*;

declare_id!("Go1emReg1stryProgram11111111111111111111111");

#[program]
pub mod golem_registry {
    use super::*;

    /// Register a new agent on the golem network
    pub fn register(ctx: Context<Register>, name: String, repo_url: String) -> Result<()> {
        require!(name.len() <= 64, GolemError::NameTooLong);
        require!(repo_url.len() <= 256, GolemError::UrlTooLong);
        require!(!name.is_empty(), GolemError::NameEmpty);
        require!(!repo_url.is_empty(), GolemError::UrlEmpty);

        let agent = &mut ctx.accounts.agent;
        agent.wallet = ctx.accounts.authority.key();
        agent.name = name;
        agent.repo_url = repo_url;
        agent.registered_at = Clock::get()?.unix_timestamp;
        agent.last_seen = Clock::get()?.unix_timestamp;
        agent.bump = ctx.bumps.agent;

        emit!(AgentRegistered {
            wallet: agent.wallet,
            name: agent.name.clone(),
            repo_url: agent.repo_url.clone(),
        });

        Ok(())
    }

    /// Send a heartbeat to signal this agent is alive
    pub fn heartbeat(ctx: Context<Heartbeat>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.last_seen = Clock::get()?.unix_timestamp;

        emit!(HeartbeatEvent {
            wallet: agent.wallet,
            timestamp: agent.last_seen,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String, repo_url: String)]
pub struct Register<'info> {
    #[account(
        init,
        payer = authority,
        space = AgentAccount::space(&name, &repo_url),
        seeds = [b"agent", authority.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, AgentAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Heartbeat<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = wallet @ GolemError::Unauthorized,
    )]
    pub agent: Account<'info, AgentAccount>,
    pub authority: Signer<'info>,
}

#[account]
pub struct AgentAccount {
    pub wallet: Pubkey,
    pub name: String,
    pub repo_url: String,
    pub registered_at: i64,
    pub last_seen: i64,
    pub bump: u8,
}

impl AgentAccount {
    pub fn space(name: &str, repo_url: &str) -> usize {
        8 // discriminator
        + 32 // wallet
        + 4 + name.len() // name (string prefix + data)
        + 4 + repo_url.len() // repo_url
        + 8 // registered_at
        + 8 // last_seen
        + 1 // bump
    }
}

#[event]
pub struct AgentRegistered {
    pub wallet: Pubkey,
    pub name: String,
    pub repo_url: String,
}

#[event]
pub struct HeartbeatEvent {
    pub wallet: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum GolemError {
    #[msg("Name must be 64 characters or fewer")]
    NameTooLong,
    #[msg("URL must be 256 characters or fewer")]
    UrlTooLong,
    #[msg("Name cannot be empty")]
    NameEmpty,
    #[msg("URL cannot be empty")]
    UrlEmpty,
    #[msg("Unauthorized: wallet mismatch")]
    Unauthorized,
}
