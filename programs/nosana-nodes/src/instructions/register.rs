use crate::*;

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(init, payer = authority, space = NodeAccount::SIZE)]
    pub node: Account<'info, NodeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Register<'info> {
    pub fn handler(&mut self, architecture_type: u8) -> Result<()> {
        let architecture: ArchitectureType = ArchitectureType::from(architecture_type);
        require!(
            architecture as u8 != ArchitectureType::Unknown as u8,
            NosanaNodesError::ArchitectureError
        );

        Ok(())
    }
}
