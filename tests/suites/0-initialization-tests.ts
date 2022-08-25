import { TOKEN_PROGRAM_ID, createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import * as _ from 'lodash';
import { expect } from 'chai';
import * as utils from '../utils';
import { utf8_encode } from '../utils';
import c from '../constants';

export default function suite() {
  describe('mints and ATAs', function () {
    it('can create NOS mint', async function () {
      global.accounts.mint = global.mint = await utils.mintFromFile(
        global.nosID.toString(),
        global.provider,
        global.wallet.publicKey
      );

      // get ATA and bumps of the vaults
      [global.ata.vaultJob] = await anchor.web3.PublicKey.findProgramAddress(
        [global.mint.toBuffer()],
        global.jobsProgram.programId
      );
      [global.ata.userVaultStaking] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('vault'), global.mint.toBuffer(), global.provider.wallet.publicKey.toBuffer()],
        global.stakingProgram.programId
      );
      [global.ata.vaultRewards] = await anchor.web3.PublicKey.findProgramAddress(
        [global.mint.toBuffer()],
        global.rewardsProgram.programId
      );
      [global.stats.staking] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('settings')],
        global.stakingProgram.programId
      );
      [global.stats.rewards] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('stats')],
        global.rewardsProgram.programId
      );
      [global.accounts.stake] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('stake'), global.mint.toBuffer(), global.provider.wallet.publicKey.toBuffer()],
        global.stakingProgram.programId
      );
      [global.accounts.reward] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('reward'), global.provider.wallet.publicKey.toBuffer()],
        global.rewardsProgram.programId
      );
      expect(global.nosID.toString()).to.equal(global.mint.toString());
    });

    it('can create ATAs and mint NOS tokens', async function () {
      // create associated token accounts
      global.ata.user =
        global.accounts.user =
        global.accounts.tokenAccount =
          await createAssociatedTokenAccount(
            global.provider.connection,
            global.payer,
            global.mint,
            global.provider.wallet.publicKey
          );

      // fund users
      await utils.mintToAccount(global.provider, global.mint, global.ata.user, c.mintSupply);
      global.balances.user += c.mintSupply;

      // setup users and nodes
      let users = await Promise.all(
        _.map(new Array(10), async () => {
          return await utils.setupSolanaUser(
            global.connection,
            global.mint,
            global.stakingProgram.programId,
            global.rewardsProgram.programId,
            c.userSupply,
            global.provider
          );
        })
      );
      global.users.users = users;
      [
        global.users.user1,
        global.users.user2,
        global.users.user3,
        global.users.user4,
        ...global.users.otherUsers
      ] = users;

      let nodes = await Promise.all(
        _.map(new Array(10), async () => {
          return await utils.setupSolanaUser(
            global.connection,
            global.mint,
            global.stakingProgram.programId,
            global.rewardsProgram.programId,
            c.userSupply,
            global.provider
          );
        })
      );
      global.users.nodes = nodes;
      [global.users.node1, global.users.node2, ...global.users.otherNodes] = nodes;
    });

    it('can mint NFTs', async function () {
      const { nft } = await global.metaplex.nfts().create(global.nftConfig);
      global.accounts.nft = await getAssociatedTokenAddress(nft.mint, global.wallet.publicKey);
      expect(await utils.getTokenBalance(global.provider, global.accounts.nft)).to.equal(1);

      await Promise.all(
        global.users.nodes.map(async (n) => {
          const { nft } = await global.metaplex.nfts().create(global.nftConfig);
          n.ataNft = await utils.getOrCreateAssociatedSPL(n.provider, n.publicKey, nft.mint);
          await transfer(
            global.connection,
            global.payer,
            await getAssociatedTokenAddress(nft.mint, global.wallet.publicKey),
            n.ataNft,
            global.payer,
            1
          );

          expect(await utils.getTokenBalance(global.provider, n.ataNft)).to.equal(1);
          expect(nft.name).to.equal(global.nftConfig.name);
          expect(nft.collection.key.toString()).to.equal(global.collection.toString());
        })
      );
    });
  });
}
