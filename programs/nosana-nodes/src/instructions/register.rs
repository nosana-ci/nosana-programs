use crate::*;

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(
        init,
        payer = payer,
        space = NodeAccount::SIZE,
        seeds = [ constants::PREFIX_NODE.as_ref(), authority.key().as_ref() ],
        bump,
    )]
    pub node: Account<'info, NodeAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Register<'info> {
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
        self.node.register(self.authority.key())?;
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
