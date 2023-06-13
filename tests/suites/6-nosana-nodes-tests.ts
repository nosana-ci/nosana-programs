import { describe } from 'mocha';
import { expect } from 'chai';

export default function suite() {
  describe('register()', async function () {
    it('can register a node', async function () {
      await this.nodesProgram.methods
        .register(
          this.nodeSpec.architectureType,
          this.nodeSpec.countryCode,
          this.nodeSpec.cpu,
          this.nodeSpec.gpu,
          this.nodeSpec.memory,
          this.nodeSpec.iops,
          this.nodeSpec.storage,
          this.nodeSpec.endpoint,
          this.nodeSpec.version
        )
        .accounts(this.accounts)
        .rpc();
    });
    it('should match on-chain data', async function () {
      const node = await this.nodesProgram.account.nodeAccount.fetch(this.accounts.node);
      expect(node.authority.toString()).to.equal(this.publicKey.toString());
      expect(node.architecture).to.equal(this.nodeSpec.architectureType, 'arch');
      expect(node.country).to.equal(this.nodeSpec.countryCode, 'country');
      expect(node.cpu).to.equal(this.nodeSpec.cpu, 'cpu');
      expect(node.gpu).to.equal(this.nodeSpec.gpu, 'gpu');
      expect(node.memory).to.equal(this.nodeSpec.memory, 'memory');
      expect(node.iops).to.equal(this.nodeSpec.iops, 'iops');
      expect(node.storage).to.equal(this.nodeSpec.storage, 'storage');
      expect(node.icon.toString()).to.equal(this.accounts.icon.toString(), 'storage');
      expect(node.endpoint).to.equal(this.nodeSpec.endpoint, 'endpoint');
      expect(node.version).to.equal(this.nodeSpec.version, 'version');
    });
  });
}
