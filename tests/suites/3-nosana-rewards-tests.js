"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var chai_1 = require("chai");
var anchor_1 = require("@project-serum/anchor");
var utils_1 = require("../utils");
function suite() {
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = chai_1.expect;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.accounts.user)];
                    case 1:
                        _a.apply(void 0, [_c.sent()]).to.equal(this.balances.user);
                        _b = chai_1.expect;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.rewards)];
                    case 2:
                        _b.apply(void 0, [_c.sent()]).to.equal(this.balances.vaultRewards);
                        return [2 /*return*/];
                }
            });
        });
    });
    describe('init()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can initialize the rewards vault', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stats;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    this.accounts.vault = this.vaults.rewards;
                                    return [4 /*yield*/, this.rewardsProgram.methods.init().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.rewardsProgram.account.statsAccount.fetch(this.accounts.stats)];
                                case 2:
                                    stats = _a.sent();
                                    (0, chai_1.expect)(stats.totalXnos.toString()).to.equal(this.total.xnos.toString());
                                    (0, chai_1.expect)(stats.totalReflection.toString()).to.equal(this.total.reflection.toString());
                                    (0, chai_1.expect)(stats.rate.toString()).to.equal(this.constants.initialRate.toString());
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('enter()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can not enter rewards pool with other stake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.rewardsProgram.methods
                                            .enter()
                                            .accounts(__assign(__assign({}, this.accounts), { stake: this.users.node1.stake }))
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.Unauthorized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can enter rewards pool with main wallet', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.rewardsProgram.methods.enter().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, (0, utils_1.updateRewards)(this, this.accounts.stake)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not unstake while reward is open', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .unstake()
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeHasReward);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can enter rewards with the other nodes', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _i, _a, node;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _i = 0, _a = this.users.otherNodes;
                                    _b.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                                    node = _a[_i];
                                    return [4 /*yield*/, this.rewardsProgram.methods
                                            .enter()
                                            .accounts(__assign(__assign({}, this.accounts), { stake: node.stake, reward: node.reward, authority: node.publicKey }))
                                            .signers([node.user])
                                            .rpc()];
                                case 2:
                                    _b.sent();
                                    return [4 /*yield*/, (0, utils_1.updateRewards)(this, node.stake)];
                                case 3:
                                    _b.sent();
                                    _b.label = 4;
                                case 4:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 5: return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('add_fee()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can add fees to the pool', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var fee;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    fee = new anchor_1.BN(this.constants.feeAmount);
                                    return [4 /*yield*/, this.rewardsProgram.methods.addFee(fee).accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, (0, utils_1.updateRewards)(this, this.accounts.stake, fee)];
                                case 2:
                                    _a.sent();
                                    this.balances.user -= this.constants.feeAmount;
                                    this.balances.vaultRewards += this.constants.feeAmount;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can claim rewards', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var reflection, amount;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward)];
                                case 1:
                                    reflection = (_a.sent()).reflection;
                                    return [4 /*yield*/, this.rewardsProgram.methods.claim().accounts(this.accounts).rpc()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, (0, utils_1.updateRewards)(this, this.accounts.stake, new anchor.BN(0), reflection)];
                                case 3:
                                    amount = _a.sent();
                                    this.balances.user += amount;
                                    this.balances.vaultRewards -= amount;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can claim rewards with other users', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _i, _a, node, reflection, amount, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _i = 0, _a = this.users.otherNodes;
                                    _c.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                                    node = _a[_i];
                                    return [4 /*yield*/, this.rewardsProgram.account.rewardAccount.fetch(node.reward)];
                                case 2:
                                    reflection = (_c.sent()).reflection;
                                    return [4 /*yield*/, this.rewardsProgram.methods
                                            .claim()
                                            .accounts(__assign(__assign({}, this.accounts), { stake: node.stake, reward: node.reward, authority: node.publicKey, user: node.ata }))
                                            .signers([node.user])
                                            .rpc()];
                                case 3:
                                    _c.sent();
                                    return [4 /*yield*/, (0, utils_1.updateRewards)(this, node.stake, new anchor.BN(0), reflection)];
                                case 4:
                                    amount = _c.sent();
                                    node.balance += amount;
                                    this.balances.vaultRewards -= amount;
                                    _c.label = 5;
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6:
                                    _b = chai_1.expect;
                                    return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.rewards)];
                                case 7:
                                    _b.apply(void 0, [_c.sent()]).to.be.closeTo(0, 100, 'vault is empty');
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('sync()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can add more fees to the pool', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.rewardsProgram.methods.addFee(new anchor.BN(this.constants.feeAmount)).accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, (0, utils_1.updateRewards)(this, this.accounts.stake, new anchor.BN(this.constants.feeAmount))];
                                case 2:
                                    _a.sent();
                                    this.balances.user -= this.constants.feeAmount;
                                    this.balances.vaultRewards += this.constants.feeAmount;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can topup stake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .topup(new anchor.BN(this.constants.stakeAmount))
                                        .accounts(__assign(__assign({}, this.accounts), { vault: this.vaults.staking }))
                                        .rpc()];
                                case 1:
                                    _b.sent();
                                    this.balances.user -= this.constants.stakeAmount;
                                    this.balances.vaultStaking += this.constants.stakeAmount;
                                    _a = chai_1.expect;
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 2:
                                    _a.apply(void 0, [(_b.sent()).xnos.toNumber()]).to.equal((0, utils_1.calculateXnos)(this.constants.stakeDurationMin * 2 + 7, this.constants.stakeAmount * 2 + this.constants.stakeMinimum));
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not sync reward reflection for wrong accounts', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.rewardsProgram.methods
                                            .sync()
                                            .accounts(__assign(__assign({}, this.accounts), { reward: this.users.nodes[4].reward }))
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.Unauthorized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can sync reward reflection', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var before, after, stake, reflection, stats;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward)];
                                case 1:
                                    before = _a.sent();
                                    return [4 /*yield*/, this.rewardsProgram.methods.sync().accounts(this.accounts).rpc()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward)];
                                case 3:
                                    after = _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 4:
                                    stake = (_a.sent()).xnos.toNumber();
                                    // test xnos before vs after
                                    (0, chai_1.expect)(before.xnos.toNumber()).to.be.lessThan(after.xnos.toNumber());
                                    (0, chai_1.expect)(after.xnos.toNumber()).to.equal(stake);
                                    (0, chai_1.expect)(after.xnos.toNumber()).to.equal((0, utils_1.calculateXnos)(this.constants.stakeDurationMin * 2 + 7, this.constants.stakeAmount * 2 + this.constants.stakeMinimum));
                                    // update totals
                                    this.total.xnos.iadd(after.xnos.sub(before.xnos));
                                    this.total.reflection.isub(before.reflection);
                                    reflection = after.xnos
                                        .add(before.reflection.div(new anchor.BN(this.total.rate)).sub(before.xnos))
                                        .mul(this.total.rate);
                                    this.total.reflection.iadd(reflection);
                                    (0, chai_1.expect)(reflection.toString()).to.equal(after.reflection.toString());
                                    return [4 /*yield*/, this.rewardsProgram.account.statsAccount.fetch(this.accounts.stats)];
                                case 5:
                                    stats = _a.sent();
                                    (0, chai_1.expect)(stats.totalXnos.toString()).to.equal(this.total.xnos.toString(), 'Total XNOS error');
                                    (0, chai_1.expect)(stats.totalReflection.toString()).to.equal(this.total.reflection.toString(), 'Total reflection error');
                                    (0, chai_1.expect)(stats.rate.toString()).to.equal(this.total.rate.toString(), 'Rate error');
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can add another round of fees to the pool', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.rewardsProgram.methods.addFee(new anchor.BN(this.constants.feeAmount)).accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, (0, utils_1.updateRewards)(this, this.accounts.stake, new anchor.BN(this.constants.feeAmount))];
                                case 2:
                                    _a.sent();
                                    this.balances.user -= this.constants.feeAmount;
                                    this.balances.vaultRewards += this.constants.feeAmount;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can sync reward reflection for others', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _i, _a, node, before_1, after_1, stake;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _i = 0, _a = this.users.otherNodes;
                                    _b.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                                    node = _a[_i];
                                    return [4 /*yield*/, this.rewardsProgram.account.rewardAccount.fetch(node.reward)];
                                case 2:
                                    before_1 = _b.sent();
                                    return [4 /*yield*/, this.rewardsProgram.methods
                                            .sync()
                                            .accounts(__assign(__assign({}, this.accounts), { stake: node.stake, reward: node.reward }))
                                            .rpc()];
                                case 3:
                                    _b.sent();
                                    return [4 /*yield*/, this.rewardsProgram.account.rewardAccount.fetch(node.reward)];
                                case 4:
                                    after_1 = _b.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(node.stake)];
                                case 5:
                                    stake = _b.sent();
                                    (0, chai_1.expect)(before_1.xnos.toNumber()).to.equal(after_1.xnos.toNumber());
                                    (0, chai_1.expect)(stake.xnos.toNumber()).to.equal(after_1.xnos.toNumber());
                                    _b.label = 6;
                                case 6:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 7: return [2 /*return*/];
                            }
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
                it('can close a reward account and unstake in the same tx', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stake, _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 1:
                                    stake = _c.sent();
                                    (0, chai_1.expect)(stake.timeUnstake.toNumber()).to.equal(0);
                                    _b = (_a = this.stakingProgram.methods
                                        .unstake()
                                        .accounts(this.accounts))
                                        .preInstructions;
                                    return [4 /*yield*/, this.rewardsProgram.methods.close().accounts(this.accounts).instruction()];
                                case 2: return [4 /*yield*/, _b.apply(_a, [[_c.sent()]])
                                        .rpc()];
                                case 3:
                                    _c.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 4:
                                    stake = _c.sent();
                                    (0, chai_1.expect)(stake.timeUnstake.toNumber()).to.not.equal(0);
                                    return [4 /*yield*/, this.stakingProgram.methods.restake().accounts(this.accounts).rpc()];
                                case 5:
                                    _c.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can close other reward accounts', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _i, _a, node;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _i = 0, _a = this.users.otherNodes;
                                    _b.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                                    node = _a[_i];
                                    return [4 /*yield*/, this.rewardsProgram.methods
                                            .close()
                                            .accounts(__assign(__assign({}, this.accounts), { reward: node.reward, authority: node.publicKey }))
                                            .signers([node.user])
                                            .rpc()];
                                case 2:
                                    _b.sent();
                                    _b.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4: return [2 /*return*/];
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
