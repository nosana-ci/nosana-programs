import { expect } from 'chai';
import { createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import { createNosMint, getTokenBalance, getUsers, mapUsers, mintNosTo } from '../utils';

export default function suite() {
  describe('mints and users', function () {
    it('can create mint', async function () {
      expect((await createNosMint(this.connection, this.payer, this.publicKey)).toString()).to.equal(
        this.mint.toString(),
      );
    });

    it('can create main user and fund mint', async function () {
      // ata
      expect(
        (await createAssociatedTokenAccount(this.connection, this.payer, this.mint, this.publicKey)).toString(),
      ).to.equal(this.accounts.user.toString());

      // fund user
      await mintNosTo(this, this.accounts.user, this.constants.mintSupply);
      this.balances.user += this.constants.mintSupply;
      expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
    });

    it('can create more funded users and nodes', async function () {
      // users & nodes
      this.users.users = await getUsers(this, 10);
      this.users.nodes = await getUsers(this, 10);
      [this.users.node1, this.users.node2, ...this.users.otherNodes] = this.users.nodes;
      [this.users.user1, this.users.user2, this.users.user3, this.users.user4, ...this.users.otherUsers] =
        this.users.users;
    });

    it('can create the NFT collection', async function () {
      this.nftConfig.isCollection = true;
      const { mintAddress } = await this.metaplex.nfts().create(this.nftConfig);
      this.nftConfig.isCollection = false;

      // set collection
      this.nftConfig.collection = mintAddress;
      this.accounts.accessKey = this.nftConfig.collection;
      this.market.nodeAccessKey = this.nftConfig.collection;
    });
    it('can mint NFT', async function () {
      const { metadataAddress, mintAddress } = await this.metaplex.nfts().create(this.nftConfig);
      await this.metaplex.nfts().verifyCollection({
        mintAddress,
        collectionMintAddress: this.nftConfig.collection,
      });
      this.accounts.nft = await getAssociatedTokenAddress(mintAddress, this.publicKey);
      this.accounts.nftMint = mintAddress;
      expect(await getTokenBalance(this.provider, this.accounts.nft)).to.equal(1);

      // set metadata
      this.accounts.metadata = metadataAddress;
    });

    it('can mint more NFTs', async function () {
      const mochaContext = this;
      await mapUsers(this.users.nodes, async function (node) {
        const { mintAddress, nft } = await mochaContext.metaplex.nfts().create(mochaContext.nftConfig);
        await mochaContext.metaplex.nfts().verifyCollection({
          mintAddress,
          collectionMintAddress: mochaContext.nftConfig.collection,
        });
        node.metadata = nft.metadataAddress;
        node.ataNft = await createAssociatedTokenAccount(
          mochaContext.connection,
          mochaContext.payer,
          mintAddress,
          node.publicKey,
        );
        await transfer(
          mochaContext.connection,
          mochaContext.payer,
          await getAssociatedTokenAddress(mintAddress, mochaContext.publicKey),
          node.ataNft,
          mochaContext.payer,
          1,
        );

        expect(await getTokenBalance(mochaContext.provider, node.ataNft)).to.equal(1);
        expect(nft.name).to.equal(mochaContext.nftConfig.name, 'NFT name');
        expect(nft.collection.address.toString()).to.equal(
          mochaContext.nftConfig.collection.toString(),
          'Collection pk',
        );
      });
    });
  });
}
