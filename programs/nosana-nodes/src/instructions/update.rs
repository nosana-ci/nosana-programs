use crate::*;

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub node: Account<'info, NodeAccount>,
    /// CHECK: nft address for external icon usage
    pub icon: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Update<'info> {
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
