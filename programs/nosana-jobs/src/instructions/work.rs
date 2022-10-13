use crate::writer::BpfWriter;
use crate::*;
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::pda::find_metadata_account;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Work<'info> {
    ///CHECK: the run account is created optionally
    #[account(
        mut,
        signer @ NosanaError::MissingSignature,
        owner = id::SYSTEM_PROGRAM @ NosanaError::InvalidOwner,
        constraint = run.lamports() == 0 @ NosanaError::LamportsNonNull
    )]
    pub run: AccountInfo<'info>,
    #[account(
        mut,
        constraint = MarketAccount::node_constraint(authority.key, &market.queue, market.queue_type)
            @ NosanaError::NodeAlreadyQueued
    )]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        address = utils::get_staking_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.xnos >= market.node_xnos_minimum as u128 @ NosanaError::NodeNotEnoughStake,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(constraint = nft.owner == authority.key() @ NosanaError::NodeNftWrongOwner)]
    pub nft: Account<'info, TokenAccount>,
    /// CHECK: Metaplex metadata is verfied against NFT and Collection node access key
    #[account(
        address = find_metadata_account(&nft.mint).0 @ NosanaError::NodeNftWrongMetadata,
        constraint = MarketAccount::metadata_constraint(&metadata, market.node_access_key)
            @ NosanaError::NodeKeyInvalidCollection,
    )]
    pub metadata: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Work>) -> Result<()> {
    match QueueType::from(ctx.accounts.market.queue_type) {
        QueueType::Node | QueueType::Empty => ctx
            .accounts
            .market
            .add_to_queue(ctx.accounts.authority.key(), false),

        QueueType::Job => {
            // run account info
            let run_info: AccountInfo = ctx.accounts.run.to_account_info();

            // init run account
            create_account(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    CreateAccount {
                        from: ctx.accounts.payer.to_account_info(),
                        to: run_info.to_account_info(),
                    },
                )
                .with_signer(&[]),
                Rent::get()?.minimum_balance(RunAccount::SIZE),
                RunAccount::SIZE as u64,
                &id::JOBS_PROGRAM,
            )?;

            // modify run account
            let mut run: Account<RunAccount> = Account::try_from_unchecked(&run_info).unwrap();
            run.create(
                ctx.accounts.market.pop_from_queue(),
                ctx.accounts.authority.key(),
                ctx.accounts.payer.key(),
                Clock::get()?.unix_timestamp,
            );

            // serialize run account
            let dst: &mut [u8] = &mut run_info.try_borrow_mut_data().unwrap();
            let mut writer: BpfWriter<&mut [u8]> = BpfWriter::new(dst);
            RunAccount::try_serialize(&run, &mut writer)?;
        }
    }
    Ok(())
}
