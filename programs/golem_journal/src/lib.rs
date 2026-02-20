use anchor_lang::prelude::*;

declare_id!("Go1emJourna1Program1111111111111111111111111");

#[program]
pub mod golem_journal {
    use super::*;

    /// Initialize a journal for this agent
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let journal = &mut ctx.accounts.journal;
        journal.owner = ctx.accounts.authority.key();
        journal.entry_count = 0;
        journal.bump = ctx.bumps.journal;
        Ok(())
    }

    /// Write a new journal entry onchain
    pub fn write_entry(ctx: Context<WriteEntry>, text: String) -> Result<()> {
        require!(text.len() <= 512, JournalError::EntryTooLong);
        require!(!text.is_empty(), JournalError::EntryEmpty);

        let entry = &mut ctx.accounts.entry;
        entry.journal = ctx.accounts.journal.key();
        entry.index = ctx.accounts.journal.entry_count;
        entry.text = text.clone();
        entry.timestamp = Clock::get()?.unix_timestamp;
        entry.bump = ctx.bumps.entry;

        ctx.accounts.journal.entry_count += 1;

        emit!(EntryWritten {
            journal: ctx.accounts.journal.key(),
            index: entry.index,
            text,
            timestamp: entry.timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 1,
        seeds = [b"journal", authority.key().as_ref()],
        bump
    )]
    pub journal: Account<'info, JournalAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(text: String)]
pub struct WriteEntry<'info> {
    #[account(
        mut,
        seeds = [b"journal", authority.key().as_ref()],
        bump = journal.bump,
        has_one = owner @ JournalError::Unauthorized,
    )]
    pub journal: Account<'info, JournalAccount>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 4 + text.len() + 8 + 1,
        seeds = [b"entry", journal.key().as_ref(), &journal.entry_count.to_le_bytes()],
        bump
    )]
    pub entry: Account<'info, EntryAccount>,
    #[account(mut, address = journal.owner @ JournalError::Unauthorized)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct JournalAccount {
    pub owner: Pubkey,
    pub entry_count: u64,
    pub bump: u8,
}

#[account]
pub struct EntryAccount {
    pub journal: Pubkey,
    pub index: u64,
    pub text: String,
    pub timestamp: i64,
    pub bump: u8,
}

#[event]
pub struct EntryWritten {
    pub journal: Pubkey,
    pub index: u64,
    pub text: String,
    pub timestamp: i64,
}

#[error_code]
pub enum JournalError {
    #[msg("Entry must be 512 characters or fewer")]
    EntryTooLong,
    #[msg("Entry cannot be empty")]
    EntryEmpty,
    #[msg("Only the journal owner can write entries")]
    Unauthorized,
}
