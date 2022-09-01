import { expect } from 'chai';
import { createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import { mintFromFile, mintToAccount, setupSolanaUser, getOrCreateAssociatedSPL, getTokenBalance } from '../utils';

export default function suite() {
  describe('mints and users', function () {
    it('can create mint', async function () {
      expect((await mintFromFile(this.connection, this.payer, this.publicKey)).toString()).to.equal(
        this.mint.toString()
      );
    });

    it('can create main user and fund mint', async function () {
      // ata
      expect(
        (await createAssociatedTokenAccount(this.connection, this.payer, this.mint, this.publicKey)).toString()
      ).to.equal(this.accounts.user.toString());

      // fund user
      await mintToAccount(this.provider, this.mint, this.accounts.user, this.constants.mintSupply);
      this.balances.user += this.constants.mintSupply;
      expect(getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
    });

    it('can create more funded users and nodes', async function () {
      // users
      this.users.nodes = [];
      this.users.users = [];
      for (const i in Array(10)) {
        this.users.nodes[i](await setupSolanaUser(this));
        this.users.users[i](await setupSolanaUser(this));
      }
      [this.users.node1, this.users.node2, ...this.users.otherNodes] = this.users.nodes;
      [this.users.user1, this.users.user2, this.users.user3, this.users.user4, ...this.users.otherUsers] =
        this.users.users;
    });

    it('can mint NFTs', async function () {
      const { nft, mintAddress } = await this.metaplex.nfts().create(this.nftConfig).run();
      this.accounts.nft = await getAssociatedTokenAddress(mintAddress, this.publicKey);
      expect(await getTokenBalance(this.provider, this.accounts.nft)).to.equal(1);

      this.accounts.metadata = nft.metadataAddress;

      for (const node of this.users.nodes) {
        const { nft, mintAddress } = await this.metaplex.nfts().create(this.nftConfig).run();
        node.metadata = nft.metadataAddress;
        node.ataNft = await getOrCreateAssociatedSPL(node.provider, node.publicKey, mintAddress);
        await transfer(
          this.connection,
          this.payer,
          await getAssociatedTokenAddress(mintAddress, this.publicKey),
          node.ataNft,
          this.payer,
          1
        );

        expect(await getTokenBalance(this.provider, node.ataNft)).to.equal(1);
        expect(nft.name).to.equal(this.nftConfig.name, 'NFT name');
        expect(nft.collection.address.toString()).to.equal(this.nftConfig.collection.toString(), 'Collection pk');
      }
    });
  });
}
