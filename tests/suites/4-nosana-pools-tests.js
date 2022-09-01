"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var anchor = require("@project-serum/anchor");
var anchor_1 = require("@project-serum/anchor");
var chai_1 = require("chai");
var utils_1 = require("../utils");
var mocha_1 = require("mocha");
var bytes_1 = require("@project-serum/anchor/dist/cjs/utils/bytes");
var spl_token_1 = require("@solana/spl-token");
/**
 * Function to add additional funds to the vault from the pool
 * @param mochaContext
 * @param amount
 */
function fundPool(mochaContext, amount) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, spl_token_1.transfer)(mochaContext.connection, mochaContext.payer, mochaContext.accounts.user, mochaContext.vaults.pools, mochaContext.payer, amount)];
                case 1:
                    _a.sent();
                    mochaContext.balances.user -= amount;
                    mochaContext.balances.vaultPool += amount;
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Function to fetch the pool account
 * @param mochaContext
 */
function getPool(mochaContext) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mochaContext.poolsProgram.account.poolAccount.fetch(mochaContext.accounts.pool)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 *
 */
function suite() {
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!!this.poolClosed) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.pools)];
                    case 1:
                        _a.poolsBalanceBefore = _c.sent();
                        _c.label = 2;
                    case 2:
                        _b = this;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.rewards)];
                    case 3:
                        _b.rewardsBalanceBefore = _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    (0, mocha_1.afterEach)(function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = chai_1.expect;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.accounts.user)];
                    case 1:
                        _a.apply(void 0, [_d.sent()]).to.equal(this.balances.user, 'user');
                        if (!!this.poolClosed) return [3 /*break*/, 3];
                        _b = chai_1.expect;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.pools)];
                    case 2:
                        _b.apply(void 0, [_d.sent()]).to.equal(this.balances.vaultPool, 'vaultPool');
                        _d.label = 3;
                    case 3:
                        _c = chai_1.expect;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.rewards)];
                    case 4:
                        _c.apply(void 0, [_d.sent()]).to.equal(this.balances.vaultRewards, 'vaultRewards');
                        return [2 /*return*/];
                }
            });
        });
    });
    describe('open()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can open a pool', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var throwAwayKeypair, _a, startTime, pool;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    throwAwayKeypair = anchor.web3.Keypair.generate();
                                    this.accounts.pool = throwAwayKeypair.publicKey;
                                    _a = this.vaults;
                                    return [4 /*yield*/, (0, utils_1.pda)([bytes_1.utf8.encode('vault'), this.accounts.pool.toBuffer()], this.poolsProgram.programId)];
                                case 1:
                                    _a.pools = _b.sent();
                                    this.accounts.vault = this.vaults.pools;
                                    this.poolClosed = false;
                                    startTime = (0, utils_1.now)() - 3;
                                    // open pool
                                    return [4 /*yield*/, this.poolsProgram.methods
                                            .open(new anchor_1.BN(this.constants.emission), new anchor_1.BN(startTime), this.constants.claimType.addFee, true)
                                            .accounts(this.accounts)
                                            .signers([throwAwayKeypair])
                                            .rpc()];
                                case 2:
                                    // open pool
                                    _b.sent();
                                    return [4 /*yield*/, getPool(this)];
                                case 3:
                                    pool = _b.sent();
                                    (0, chai_1.expect)(pool.emission.toNumber()).to.equal(this.constants.emission);
                                    (0, chai_1.expect)(pool.startTime.toNumber()).to.equal(startTime);
                                    (0, chai_1.expect)(pool.claimedTokens.toNumber()).to.equal(0);
                                    (0, chai_1.expect)(pool.closeable).to.equal(true);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('claim_fee()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can fill pool vault', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fundPool(this, 14)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can claim underfunded', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc()];
                                case 1:
                                    _c.sent();
                                    _b = (_a = (0, chai_1.expect)(this.rewardsBalanceBefore).to).equal;
                                    return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.rewards)];
                                case 2:
                                    _b.apply(_a, [_c.sent()]);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can claim a multiple of emission', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var rewardsBalanceAfter, reward;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fundPool(this, this.constants.emission * 3)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.rewards)];
                                case 3:
                                    rewardsBalanceAfter = _a.sent();
                                    (0, chai_1.expect)(this.rewardsBalanceBefore).to.be.lessThan(rewardsBalanceAfter, 'rewards have increased');
                                    reward = rewardsBalanceAfter - this.rewardsBalanceBefore;
                                    this.balances.vaultRewards += reward;
                                    this.balances.vaultPool -= reward;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can claim for full elapsed time', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var poolsBalanceBefore, pool, elapsed, reward;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.pools)];
                                case 1:
                                    poolsBalanceBefore = _a.sent();
                                    // fund for 3 seconds
                                    return [4 /*yield*/, fundPool(this, this.constants.emission * 3)];
                                case 2:
                                    // fund for 3 seconds
                                    _a.sent();
                                    return [4 /*yield*/, getPool(this)];
                                case 3:
                                    pool = _a.sent();
                                    // sleep at least 5 second
                                    return [4 /*yield*/, (0, utils_1.sleep)(5000)];
                                case 4:
                                    // sleep at least 5 second
                                    _a.sent();
                                    elapsed = (0, utils_1.now)() - pool.startTime.toNumber();
                                    (0, chai_1.expect)(elapsed).to.be.above(1);
                                    // claim fee
                                    return [4 /*yield*/, this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc()];
                                case 5:
                                    // claim fee
                                    _a.sent();
                                    return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.rewards)];
                                case 6:
                                    reward = (_a.sent()) - this.rewardsBalanceBefore;
                                    (0, chai_1.expect)(reward).to.equal(this.constants.emission * 3 + poolsBalanceBefore);
                                    this.balances.vaultRewards += reward;
                                    this.balances.vaultPool -= reward;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('claim_transfer()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can claim a transfer', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            console.log('        ❌ TODO!!');
                            return [2 /*return*/];
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('close()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can close a pool', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var amount;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.accounts.vault)];
                                case 1:
                                    amount = _a.sent();
                                    return [4 /*yield*/, this.poolsProgram.methods.close().accounts(this.accounts).rpc()];
                                case 2:
                                    _a.sent();
                                    this.balances.user += amount;
                                    this.balances.vaultPool -= amount;
                                    this.poolClosed = true;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
}
exports["default"] = suite;
