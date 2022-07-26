// imports
import * as anchor from '@project-serum/anchor';
import * as _ from 'lodash';
import * as utils from './utils';
import { calculateXnos } from './utils';
import { expect } from 'chai';
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  transfer,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { NosanaStaking } from '../target/types/nosana_staking';
import { NosanaRewards } from '../target/types/nosana_rewards';

const { BN } = anchor;

const bn = (n) => { return new BN(n); };

describe('Nosana Rewards', () => {
  // provider and program
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const wallet = provider.wallet;
  const payer = wallet.payer as anchor.web3.Signer;
  const stakingProgram = anchor.workspace.NosanaStaking as anchor.Program<NosanaStaking>;
  const rewardsProgram = anchor.workspace.NosanaRewards as anchor.Program<NosanaRewards>;

  // globals variables
  const nosID = new anchor.web3.PublicKey('testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp');

  // time
  const allowedClockDelta = 2000;
  const secondsPerMonth = (365 * 24 * 60 * 60) / 12;
  const stakeDurationMonth = secondsPerMonth;
  const stakeDurationYear = 12 * secondsPerMonth;

  // tokens
  const decimals = 1e6;
  const mintSupply = 1e7 * decimals;
  const userSupply = 10e4 * decimals;
  const stakeAmount = 1e3 * decimals;
  const minimumNodeStake = 1e3 * decimals;

  // setup users
  const users = _.map(new Array(3), () => {
    return utils.setupSolanaUser(connection);
  });
  const [bob, alice, carol] = users;

  // public keys
  const accounts = {
    // program ids
    systemProgram: anchor.web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    stakingProgram: stakingProgram.programId,

    // sys vars
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

    // main user
    authority: provider.wallet.publicKey,
    feePayer: provider.wallet.publicKey,

    // Solana accounts for ci/cd and staking
    stake: undefined,

    // token and ATAs (tbd)
    mint: undefined,
    ataVault: undefined,
    stats: undefined,
    ataFrom: undefined,
    ataTo: undefined,
    ataNft: undefined,
  };

  const errors = {
    Unauthorized: 'NosanaError::Unauthorized - You are not authorized to perform this action.',
    SeedsConstraint: 'A seeds constraint was violated',
  };

  let mint, bumpStaking, bumpRewards, statsStaking, statsRewards = null;
  const ata = { user: undefined, vaultJob: undefined, vaultStaking: undefined, vaultRewards: undefined, nft: undefined };

  const initialRate = 12736648300;

  //======
  // HELPER FUNCTIONS
  //======
  const stake = async (u, amount) => {
    await stakingProgram.methods
      .stake(bn(amount).mul(bn(decimals)), bn(stakeDurationMonth))
      .accounts({
        ...accounts,
        ataFrom: u.ata,
        authority: u.publicKey,
        stats: statsStaking,
        stake: u.stake,
        ataVault: ata.vaultStaking,
      })
      .signers([u.user])
      .rpc();
  }
  const enterRewards = async (u) => {
    await rewardsProgram.methods.enter()
      .accounts({...accounts,stake: u.stake,reward: u.reward,authority: u.publicKey})
      .signers([u.user])
      .rpc();
  }
  const claimRewards = async (user) => {
    await rewardsProgram.methods.claim()
      .accounts({
        ...accounts,
        ataTo: user.ata,
        authority: user.publicKey,
        stats: statsRewards,
        stake: user.stake,
        reward: user.reward,
        ataVault: ata.vaultRewards,
      })
      .signers([user.user])
      .rpc();
  }

  before(async () => {
    accounts.mint = mint = await utils.mintFromFile(nosID.toString(), provider, provider.wallet.publicKey);
    accounts.ataFrom =
      accounts.ataTo =
      ata.user =
      await createAssociatedTokenAccount(provider.connection, payer, mint, provider.wallet.publicKey);

    [ata.vaultStaking] = await anchor.web3.PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode('nos'), mint.toBuffer()], stakingProgram.programId
    );
    [ata.vaultRewards] = await anchor.web3.PublicKey.findProgramAddress(
      [mint.toBuffer()], rewardsProgram.programId
    );
    [statsStaking] = await anchor.web3.PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode('stats'), mint.toBuffer()], stakingProgram.programId
    );
    [statsRewards] = await anchor.web3.PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode('stats')], rewardsProgram.programId
    );

    // fund users
    await utils.mintToAccount(provider, mint, ata.user, mintSupply);
    await Promise.all(
      users.map(async (u) => {
        await connection.confirmTransaction(
          await connection.requestAirdrop(u.publicKey, anchor.web3.LAMPORTS_PER_SOL)
        );
        u.ata = await utils.getOrCreateAssociatedSPL(u.provider, u.publicKey, mint);
        await utils.mintToAccount(provider, mint, u.ata, userSupply);
        u.balance = userSupply;
        [u.stake] = await anchor.web3.PublicKey.findProgramAddress(
          [anchor.utils.bytes.utf8.encode('stake'), mint.toBuffer(), u.publicKey.toBuffer()],
          stakingProgram.programId
        );
        [u.reward] = await anchor.web3.PublicKey.findProgramAddress(
          [anchor.utils.bytes.utf8.encode('reward'), u.publicKey.toBuffer()],
          rewardsProgram.programId
        );
      })
    );

    // init staking
    await stakingProgram.methods.initVault().accounts({...accounts, ataVault: ata.vaultStaking, stats: statsStaking}).rpc();
    await stake(bob, 7500);
    await stake(alice, 2500);
    await stake(carol, 16000);
  });

  beforeEach(() => {
    accounts.stats = statsRewards;
    accounts.stakingProgram = stakingProgram._programId;
    accounts.ataVault = ata.vaultRewards
  });

  //======
  // TEST CASES
  //======
  it('can initialize', async () => {
    await rewardsProgram.methods.init().accounts({...accounts}).rpc();
    const account = await rewardsProgram.account.statsAccount.fetch(statsRewards);
    expect(account.rTotal.eq(bn(0))).to.be.true;
    expect(account.tTotal.eq(bn(0))).to.be.true;
    expect(account.rate.eq(bn(initialRate))).to.be.true;
  });

  it('can enter reward pool', async () => {
    await enterRewards(bob);

    const account = await rewardsProgram.account.statsAccount.fetch(statsRewards);

    let xnos = calculateXnos(0,stakeDurationMonth,7500);

    expect(account.rTotal.eq(bn(xnos).mul(bn(initialRate)).mul(bn(decimals)))).to.be.true;
    expect(account.tTotal.eq(bn(xnos).mul(bn(decimals)))).to.be.true;
  });

  it('can add fees to the pool', async () => {
    await rewardsProgram.methods.addFee(bn(600 * decimals)).accounts(accounts).rpc();
    const account = await rewardsProgram.account.statsAccount.fetch(statsRewards);
  });

  const getbal = async (ata) => { return await utils.getTokenBalance(provider, ata) };
  const getbals = async (atas) => { return await Promise.all(
    atas.map(async (ata) => { return await getbal(ata); })
  )};

  it('can claim all rewards alone', async () => {
    const nosBefore = await getbal(bob.ata);

    await rewardsProgram.methods.claim()
      .accounts({
        ...accounts,
        ataTo: bob.ata,
        authority: bob.publicKey,
        stats: statsRewards,
        stake: bob.stake,
        reward: bob.reward,
        ataVault: ata.vaultRewards,
      })
      .signers([bob.user])
      .rpc();

    const account = await rewardsProgram.account.statsAccount.fetch(statsRewards);
    const nosAfter = await getbal(bob.ata);

    // pool is empty now
    expect(account.rTotal.eq(bn(0))).to.be.true;
    expect(account.tTotal.eq(bn(0))).to.be.true;
    expect(account.rate.eq(bn(initialRate))).to.be.true;

    // and bob received the 600 in fees
    expect(nosAfter).to.equal(nosBefore + 600 * decimals);
  });


  // We'll first let 2 users enter the reward pool:
  //
  // - Bob: 750 xNOS (75%)
  // - Alice: 250 xNOS (25%)
  //
  // => Add 600 NOS in fees.
  // ==> Now: Bob + 450 and Alice + 150
  it('split rewards between 3 parties', async () => {
    let bobNosBefore, aliceNosBefore, carolNosBefore, bobNosAfter, aliceNosAfter, carolNosAfter = 0;

    [bobNosBefore, aliceNosBefore, carolNosBefore] = await getbals([bob.ata, alice.ata, carol.ata]);

    // Let 2 users enter with 600 rewards
    await enterRewards(bob);
    await enterRewards(alice);
    await rewardsProgram.methods.addFee(bn(600 * decimals)).accounts(accounts).rpc();

    // Check the 600 is split correctly
    await claimRewards(bob);
    await claimRewards(alice);
    [bobNosAfter, aliceNosAfter, carolNosAfter] = await getbals([bob.ata, alice.ata, carol.ata]);
    expect(bobNosAfter).to.equal(bobNosBefore + (450 * decimals));
    expect(aliceNosAfter).to.equal(aliceNosBefore + (150 * decimals));

    // Let 2 users enter again with 600 rewards. Then enter a 3rd with
    await enterRewards(bob);
    await enterRewards(alice);
    await rewardsProgram.methods.addFee(bn(600 * decimals)).accounts(accounts).rpc();
    await enterRewards(carol);

    // Now tOwned:
    // - bob:    750*1.25 + 450   = 1350   (= 0.362903225806)
    // - alice:  250*1.25 + 150   = 450    (= 0.12097)
    // - carol: 1600*1.25         = 1920   (= 0.51613)
    // Now add 1000 fees
    let [bob1, alice1, carol1] = [ 7500 * 1.25 + 450,
                                   2500 * 1.25 + 150,
                                   16000 * 1.25];
    let tot = bob1 + alice1 + carol1;
    let [bobShare, aliceShare, carolShare] = [bob1 / tot, alice1 / tot, carol1 / tot];

    [bobNosBefore, aliceNosBefore, carolNosBefore] = await getbals([bob.ata, alice.ata, carol.ata]);
    await rewardsProgram.methods.addFee(bn(1000 * decimals)).accounts(accounts).rpc();
    await claimRewards(bob);
    await claimRewards(alice);
    await claimRewards(carol);

    // Check the the 600 is split between 2, and the 1000 between 3
    [bobNosAfter, aliceNosAfter, carolNosAfter] = await getbals([bob.ata, alice.ata, carol.ata]);
    expect(bobNosAfter).to.equal(Math.round(bobNosBefore + (450 * decimals) + (bobShare * 1000 * decimals)));
    expect(aliceNosAfter).to.equal(Math.round(aliceNosBefore + (150 * decimals) + (aliceShare * 1000 * decimals)));
    expect(carolNosAfter).to.equal(Math.round(carolNosBefore + (carolShare * 1000 * decimals)));
  });
});
