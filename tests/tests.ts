// suites
import globals from './suites/0-setup-globals';
import initTests from './suites/1-initialization-tests';
import stakingTests from './suites/2-nosana-staking-tests';
import rewardTests from './suites/3-nosana-rewards-tests';
import rewardScenario from './suites/6-rewards-scenario-tests';
import poolTests from './suites/4-nosana-pools-tests';
import jobTests from './suites/5-nosana-jobs-tests';

// run
describe('nosana programs', async function () {
  describe('globals', globals);
  describe('initialization', initTests);
  describe('rewards-scenario', rewardScenario);
  // describe('staking', stakingTests);
  // describe('rewards', rewardTests);
  // describe('pools', poolTests);
  // describe('jobs', jobTests);
});
