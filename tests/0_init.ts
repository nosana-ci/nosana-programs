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
      this.global.accounts.mint = this.global.mint = await utils.mintFromFile(
        this.global.nosID.toString(),
        this.global.provider,
        this.global.provider.wallet.publicKey
      );

      // get ATA and bumps of the vaults
      [this.global.ata.vaultJob] = await anchor.web3.PublicKey.findProgramAddress(
        [this.global.mint.toBuffer()],
        this.global.jobsProgram.programId
      );
      [this.global.ata.userVaultStaking] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('vault'), this.global.mint.toBuffer(), this.global.provider.wallet.publicKey.toBuffer()],
        this.global.stakingProgram.programId
      );
      [this.global.ata.vaultRewards] = await anchor.web3.PublicKey.findProgramAddress(
        [this.global.mint.toBuffer()],
        this.global.rewardsProgram.programId
      );
      [this.global.stats.staking] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('settings')],
        this.global.stakingProgram.programId
      );
      [this.global.stats.rewards] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('stats')],
        this.global.rewardsProgram.programId
      );
      [this.global.accounts.stake] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('stake'), this.global.mint.toBuffer(), this.global.provider.wallet.publicKey.toBuffer()],
        this.global.stakingProgram.programId
      );
      [this.global.accounts.reward] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8_encode('reward'), this.global.provider.wallet.publicKey.toBuffer()],
        this.global.rewardsProgram.programId
      );
      expect(this.global.nosID.toString()).to.equal(this.global.mint.toString());
    });

    it('can create ATAs and mint NOS tokens', async function () {
      // create associated token accounts
      this.global.ata.user =
        this.global.accounts.user =
        this.global.accounts.tokenAccount =
          await createAssociatedTokenAccount(
            this.global.provider.connection,
            this.global.payer,
            this.global.mint,
            this.global.provider.wallet.publicKey
          );

      // fund users
      await utils.mintToAccount(this.global.provider, this.global.mint, this.global.ata.user, c.mintSupply);
      this.global.balances.user += c.mintSupply;

      // setup users and nodes
      let users = await Promise.all(
        _.map(new Array(10), async () => {
          return await utils.setupSolanaUser(
            this.global.connection,
            this.global.mint,
            this.global.stakingProgram.programId,
            this.global.rewardsProgram.programId,
            c.userSupply,
            this.global.provider
          );
        })
      );
      this.global.users.users = users;
      [
        this.global.users.user1,
        this.global.users.user2,
        this.global.users.user3,
        this.global.users.user4,
        ...this.global.users.otherUsers
      ] = users;

      let nodes = await Promise.all(
        _.map(new Array(10), async () => {
          return await utils.setupSolanaUser(
            this.global.connection,
            this.global.mint,
            this.global.stakingProgram.programId,
            this.global.rewardsProgram.programId,
            c.userSupply,
            this.global.provider
          );
        })
      );
      this.global.users.nodes = nodes;
      [this.global.users.node1, this.global.users.node2, ...this.global.users.otherNodes] = nodes;
    });

    it('can mint NFTs', async function () {
      const { nft } = await this.global.metaplex.nfts().create(this.global.nftConfig);
      this.global.accounts.nft = await getAssociatedTokenAddress(nft.mint, this.global.wallet.publicKey);
      expect(await utils.getTokenBalance(this.global.provider, this.global.accounts.nft)).to.equal(1);

      await Promise.all(
        this.global.users.nodes.map(async (n) => {
          const { nft } = await this.global.metaplex.nfts().create(this.global.nftConfig);
          n.ataNft = await utils.getOrCreateAssociatedSPL(n.provider, n.publicKey, nft.mint);
          await transfer(
            this.global.connection,
            this.global.payer,
            await getAssociatedTokenAddress(nft.mint, this.global.wallet.publicKey),
            n.ataNft,
            this.global.payer,
            1
          );

          expect(await utils.getTokenBalance(this.global.provider, n.ataNft)).to.equal(1);
          expect(nft.name).to.equal(this.global.nftConfig.name);
          expect(nft.collection.key.toString()).to.equal(this.global.collection.toString());
        })
      );
    });
  });
}
