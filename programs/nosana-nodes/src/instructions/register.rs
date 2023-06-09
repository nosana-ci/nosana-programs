use crate::*;

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(init, payer = authority, space = NodeAccount::SIZE)]
    pub node: Account<'info, NodeAccount>,
    /// CHECK: used
    pub icon: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Register<'info> {
    pub fn handler(
        &mut self,
        architecture_type: u8,
        country_code: u8,
        cpu: u16,
        gpu: u16,
        memory: u16,
        iops: u16,
        storage: u16,
        endpoint: String,
        location: String,
        version: String,
    ) -> Result<()> {
        require!(
            ArchitectureType::from(architecture_type) as u8 != ArchitectureType::Unknown as u8,
            NosanaNodesError::ArchitectureUnknown
        );

        self.node.register(
            self.authority.key(),
            architecture_type,
            cpu,
            gpu,
            memory,
            iops,
            storage,
            self.icon.key(),
            endpoint,
            location,
            version,
        )
    }
}
