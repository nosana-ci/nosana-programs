use crate::*;

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub node: Account<'info, NodeAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Update<'info> {
    pub fn handler(
        &mut self,
        architecture_type: u8,
        country_code: u16,
        cpu: u16,
        gpu: u16,
        memory: u16,
        iops: u16,
        storage: u16,
        endpoint: String,
        icon: String,
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
            endpoint,
            icon,
            version,
        )
    }
}
