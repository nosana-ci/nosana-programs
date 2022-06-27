// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

const anchor = require('@project-serum/anchor');
const {TOKEN_PROGRAM_ID} = require('@solana/spl-token');

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  const program = anchor.workspace.NosanaJobs;

  let mint = new anchor.web3.PublicKey('testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp');
  // let mint = new anchor.web3.PublicKey("nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7");

  const [ata, bump] = await anchor.web3.PublicKey.findProgramAddress(
    [mint.toBuffer()],
    program.programId
  );

  await program.rpc.initialize(
    bump,
    {
      accounts: {
        mint: mint,
        ataVault: ata,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }
    }
  );
};
