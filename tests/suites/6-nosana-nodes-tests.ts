import { describe } from 'mocha';

export default function suite() {
  describe('register()', async function () {
    it('register a node', async function () {
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
  });
}
