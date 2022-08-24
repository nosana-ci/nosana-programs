import { TOKEN_PROGRAM_ID, createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import * as _ from 'lodash';
import { expect } from 'chai';
import * as utils from './utils';
import { utf8_encode } from './utils';
import c from './constants';

export default function suite() {
  describe('mints and ATAs', function () {
    it('can create NOS mint', async function () {
      this.accounts.mint = this.mint = await utils.mintFromFile(
        this.nosID.toString(), this.provider, this.provider.wallet.publicKey
      );

      // get ATA and bumps of the vaults
      [this.ata.vaultJob] = await anchor.web3.PublicKey.findProgramAddress(
        [this.mint.toBuffer()], this.jobsProgram.programId
      );
      [this.ata.userVaultStaking] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('vault'), this.mint.toBuffer(), this.provider.wallet.publicKey.toBuffer()],
        this.stakingProgram.programId
      );
      [this.ata.vaultRewards] = await anchor.web3.PublicKey.findProgramAddress(
        [this.mint.toBuffer()], this.rewardsProgram.programId
      );
      [this.stats.staking] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('settings')], this.stakingProgram.programId
      );
      [this.stats.rewards] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('stats')], this.rewardsProgram.programId
      );
      [this.accounts.stake] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('stake'), this.mint.toBuffer(), this.provider.wallet.publicKey.toBuffer()],
        this.stakingProgram.programId
      );
      [this.accounts.reward] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('reward'), this.provider.wallet.publicKey.toBuffer()],
        this.rewardsProgram.programId
      );
      expect(this.nosID.toString()).to.equal(this.mint.toString());
    });

    it('can create ATAs and mint NOS tokens', async function () {
      // create associated token accounts
      this.ata.user =
        this.accounts.user =
        this.accounts.tokenAccount =
        await createAssociatedTokenAccount(
          this.provider.connection, this.payer, this.mint, this.provider.wallet.publicKey
        );

      // fund users
      await utils.mintToAccount(this.provider, this.mint, this.ata.user, c.mintSupply);
      this.balances.user += c.mintSupply;

      // setup users and nodes
      let users = await Promise.all(_.map(new Array(10), async () => {
        return await utils.setupSolanaUser(
          this.connection, this.mint, this.stakingProgram.programId, this.rewardsProgram.programId,
          c.userSupply, this.provider
        );
      }));
      this.users.users = users;
      [this.users.user1, this.users.user2, this.users.user3, this.users.user4, ...this.users.otherUsers] = users;

      let nodes = await Promise.all(_.map(new Array(10), async () => {
        return await utils.setupSolanaUser(
          this.connection, this.mint, this.stakingProgram.programId, this.rewardsProgram.programId,
          c.userSupply, this.provider
        );
      }));
      this.users.nodes = nodes;
      [this.users.node1, this.users.node2, ...this.users.otherNodes] = nodes;
    });

    it('can mint NFTs', async function () {
      const { nft } = await this.metaplex.nfts().create(this.nftConfig);
      this.accounts.nft = await getAssociatedTokenAddress(nft.mint, this.wallet.publicKey);
      expect(await utils.getTokenBalance(this.provider, this.accounts.nft)).to.equal(1);

      await Promise.all(
        this.users.nodes.map(async (n) => {
          const { nft } = await this.metaplex.nfts().create(this.nftConfig);
          n.ataNft = await utils.getOrCreateAssociatedSPL(n.provider, n.publicKey, nft.mint);
          await transfer(
            this.connection,
            this.payer,
            await getAssociatedTokenAddress(nft.mint, this.wallet.publicKey),
            n.ataNft,
            this.payer,
            1
          );

          expect(await utils.getTokenBalance(this.provider, n.ataNft)).to.equal(1);
          expect(nft.name).to.equal(this.nftConfig.name);
          expect(nft.collection.key.toString()).to.equal(this.collection.toString());
        })
      );
    });
  });
}
