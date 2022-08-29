import { createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import * as _ from 'lodash';
import { expect } from 'chai';
import {
  utf8_encode,
  mintFromFile,
  mintToAccount,
  setupSolanaUser,
  getOrCreateAssociatedSPL,
  getTokenBalance,
} from '../utils';

export default function suite() {
  describe('mints and PDAs', function () {
    it('can create NOS mint and derive PDAs', async function () {
      // create main mint
      global.accounts.mint = global.mint = await mintFromFile(global.nosID.toString(), global.wallet.publicKey);
      expect(global.nosID.toString()).to.equal(global.mint.toString());

      // stats
      [global.stats.staking] = await PublicKey.findProgramAddress(
        [utf8_encode('settings')],
        global.stakingProgram.programId
      );
      [global.stats.rewards] = await PublicKey.findProgramAddress(
        [utf8_encode('stats')],
        global.rewardsProgram.programId
      );

      // token vault
      [global.ata.vaultJob] = await PublicKey.findProgramAddress(
        [global.mint.toBuffer()],
        global.jobsProgram.programId
      );
      [global.ata.vaultRewards] = await PublicKey.findProgramAddress(
        [global.mint.toBuffer()],
        global.rewardsProgram.programId
      );
      [global.ata.userVaultStaking] = await PublicKey.findProgramAddress(
        [utf8_encode('vault'), global.mint.toBuffer(), global.publicKey.toBuffer()],
        global.stakingProgram.programId
      );

      // main accounts
      [global.accounts.project] = await PublicKey.findProgramAddress(
        [utf8_encode('project'), global.publicKey.toBuffer()],
        global.jobsProgram.programId
      );
      [global.accounts.stake] = await PublicKey.findProgramAddress(
        [utf8_encode('stake'), global.mint.toBuffer(), global.publicKey.toBuffer()],
        global.stakingProgram.programId
      );
      [global.accounts.reward] = await PublicKey.findProgramAddress(
        [utf8_encode('reward'), global.publicKey.toBuffer()],
        global.rewardsProgram.programId
      );
    });

    it('can create more users, token accounts and mint additional NOS tokens', async function () {
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
      await mintToAccount(global.provider, global.mint, global.ata.user, global.constants.mintSupply);
      global.balances.user += global.constants.mintSupply;

      // setup users and nodes
      let users = await Promise.all(
        _.map(new Array(10), async () => {
          return await setupSolanaUser(global.mint, global.constants.userSupply, global.provider);
        })
      );
      global.users.users = users;
      [global.users.user1, global.users.user2, global.users.user3, global.users.user4, ...global.users.otherUsers] =
        users;

      let nodes = await Promise.all(
        _.map(new Array(10), async () => {
          return await setupSolanaUser(global.mint, global.constants.userSupply, global.provider);
        })
      );
      global.users.nodes = nodes;
      [global.users.node1, global.users.node2, ...global.users.otherNodes] = nodes;
    });

    it('can mint NFTs', async function () {
      const { nft, mintAddress } = await global.metaplex.nfts().create(global.nftConfig).run();
      global.accounts.nft = await getAssociatedTokenAddress(mintAddress, global.wallet.publicKey);
      expect(await getTokenBalance(global.provider, global.accounts.nft)).to.equal(1);

      global.accounts.metadata = nft.metadataAddress;

      await Promise.all(
        global.users.nodes.map(async (n) => {
          const { nft, mintAddress } = await global.metaplex.nfts().create(global.nftConfig).run();
          n.metadata = nft.metadataAddress;
          n.ataNft = await getOrCreateAssociatedSPL(n.provider, n.publicKey, mintAddress);
          await transfer(
            global.connection,
            global.payer,
            await getAssociatedTokenAddress(mintAddress, global.wallet.publicKey),
            n.ataNft,
            global.payer,
            1
          );

          expect(await getTokenBalance(global.provider, n.ataNft)).to.equal(1);
          expect(nft.name).to.equal(global.nftConfig.name, 'NFT name');
          expect(nft.collection.address.toString()).to.equal(global.nftConfig.collection.toString(), 'Collection pk');
        })
      );
    });
  });
}
