use crate::*;

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(init, payer = authority, space = NodeAccount::SIZE)]
    pub node: Account<'info, NodeAccount>,
    /// CHECK: nft address for external icon usage
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
        version: String,
    ) -> Result<()> {
        require_neq!(
            ArchitectureType::from(architecture_type) as u8,
            ArchitectureType::Unknown as u8,
            NosanaNodesError::ArchitectureUnknown
        );
        require_neq!(
            CountryCode::from(country_code) as u8,
            CountryCode::Unknown as u8,
            NosanaNodesError::CountryCodeUnknown
        );
        require_gt!(cpu, 0, NosanaNodesError::CpuInvalid);
        require_gt!(gpu, 0, NosanaNodesError::GpuInvalid);
        require_gt!(memory, 0, NosanaNodesError::MemoryInvalid);
        require_gt!(iops, 0, NosanaNodesError::IopsInvalid);
        require_gt!(storage, 0, NosanaNodesError::StorageInvalid);

        self.node.register(self.authority.key())?;
        self.node.update(
            architecture_type,
            country_code,
            cpu,
            gpu,
            memory,
            iops,
            storage,
            self.icon.key(),
            endpoint,
            version,
        )
    }
}
