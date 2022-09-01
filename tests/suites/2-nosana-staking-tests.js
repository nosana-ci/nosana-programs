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
var utils_1 = require("../utils");
function suite() {
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = chai_1.expect;
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.accounts.user)];
                    case 1:
                        _a.apply(void 0, [_b.sent()]).to.equal(this.balances.user);
                        return [2 /*return*/];
                }
            });
        });
    });
    describe('init()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can initialize', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    this.accounts.vault = this.vaults.staking;
                                    return [4 /*yield*/, this.stakingProgram.methods.init().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('stake()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can not stake too short', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .stake(new anchor.BN(this.constants.stakeAmount), new anchor.BN(this.constants.stakeDurationMin - 1))
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeDurationTooShort);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not stake too long', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .stake(new anchor.BN(this.constants.stakeAmount), new anchor.BN(this.constants.stakeDurationMax + 1))
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeDurationTooLong);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not stake too little', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .stake(new anchor.BN(this.constants.stakeMinimum - 1), new anchor.BN(this.constants.stakeDurationMax))
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeAmountNotEnough);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can stake minimum', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stake;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .stake(new anchor.BN(this.constants.stakeMinimum), new anchor.BN(this.constants.stakeDurationMin))
                                        .accounts(this.accounts)
                                        .rpc()];
                                case 1:
                                    _a.sent();
                                    this.balances.user -= this.constants.stakeMinimum;
                                    this.balances.vaultStaking += this.constants.stakeMinimum;
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 2:
                                    stake = _a.sent();
                                    (0, chai_1.expect)(stake.amount.toNumber()).to.equal(this.constants.stakeMinimum, 'amount');
                                    (0, chai_1.expect)(stake.vault.toString()).to.equal(this.accounts.vault.toString(), 'vault');
                                    (0, chai_1.expect)(stake.authority.toString()).to.equal(this.accounts.authority.toString(), 'authority');
                                    (0, chai_1.expect)(stake.duration.toNumber()).to.equal(this.constants.stakeDurationMin, 'duration');
                                    (0, chai_1.expect)(stake.xnos.toNumber()).to.equal((0, utils_1.calculateXnos)(this.constants.stakeDurationMin, this.constants.stakeMinimum), 'xnos');
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can stake maximum', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .stake(new anchor.BN(this.constants.stakeAmount), new anchor.BN(this.constants.stakeDurationMax))
                                        .accounts(__assign(__assign({}, this.accounts), { user: this.users.user4.ata, authority: this.users.user4.publicKey, stake: this.users.user4.stake, vault: this.users.user4.vault }))
                                        .signers([this.users.user4.user])
                                        .rpc()];
                                case 1:
                                    _a.sent();
                                    this.users.user4.balance -= this.constants.stakeAmount;
                                    this.balances.vaultStaking += this.constants.stakeAmount;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can stake for node 1', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var amount;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    amount = this.constants.minimumNodeStake - 1;
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .stake(new anchor.BN(amount), new anchor.BN(this.constants.stakeDurationMin))
                                            .accounts(__assign(__assign({}, this.accounts), { user: this.users.node1.ata, authority: this.users.node1.publicKey, stake: this.users.node1.stake, vault: this.users.node1.vault }))
                                            .signers([this.users.node1.user])
                                            .rpc()];
                                case 1:
                                    _a.sent();
                                    this.users.node1.balance -= amount;
                                    this.balances.vaultStaking += amount;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can stake for node 2, and unstake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .stake(new anchor.BN(this.constants.minimumNodeStake), new anchor.BN(this.constants.stakeDurationMin))
                                        .accounts(__assign(__assign({}, this.accounts), { user: this.users.node2.ata, authority: this.users.node2.publicKey, stake: this.users.node2.stake, vault: this.users.node2.vault }))
                                        .signers([this.users.node2.user])
                                        .rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .unstake()
                                            .accounts(__assign(__assign({}, this.accounts), { authority: this.users.node2.publicKey, reward: this.users.node2.reward, stake: this.users.node2.stake }))
                                            .signers([this.users.node2.user])
                                            .rpc()];
                                case 2:
                                    _a.sent();
                                    this.users.node2.balance -= this.constants.minimumNodeStake;
                                    this.balances.vaultStaking += this.constants.minimumNodeStake;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can stake for other nodes', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Promise.all(this.users.otherNodes.map(function (n) { return __awaiter(_this, void 0, void 0, function () {
                                        var _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                                        .stake(new anchor.BN(this.constants.stakeAmount * 2), new anchor.BN(3 * this.constants.stakeDurationMin))
                                                        .accounts(__assign(__assign({}, this.accounts), { user: n.ata, authority: n.publicKey, stake: n.stake, vault: n.vault }))
                                                        .signers([n.user])
                                                        .rpc()];
                                                case 1:
                                                    _b.sent();
                                                    this.balances.vaultStaking += this.constants.stakeAmount * 2;
                                                    n.balance -= this.constants.stakeAmount * 2;
                                                    _a = chai_1.expect;
                                                    return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, n.ata)];
                                                case 2:
                                                    _a.apply(void 0, [_b.sent()]).to.equal(n.balance);
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); }))];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('extend()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can extend with negative duration', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var accountBefore, accountAfter;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 1:
                                    accountBefore = _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.methods.extend(new anchor.BN(-7)).accounts(this.accounts).rpc()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 3:
                                    accountAfter = _a.sent();
                                    (0, chai_1.expect)(accountAfter.duration.toNumber()).to.equal(accountBefore.duration.toNumber() + 7);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not extend a stake that is too long', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .extend(new anchor.BN(this.constants.stakeDurationMax))
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeDurationTooLong);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can extend a stake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stake;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .extend(new anchor.BN(this.constants.stakeDurationMin))
                                        .accounts(this.accounts)
                                        .rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 2:
                                    stake = _a.sent();
                                    (0, chai_1.expect)(stake.duration.toNumber()).to.equal(this.constants.stakeDurationMin * 2 + 7);
                                    (0, chai_1.expect)(stake.amount.toNumber()).to.equal(this.constants.stakeMinimum);
                                    (0, chai_1.expect)(stake.xnos.toNumber()).to.equal((0, utils_1.calculateXnos)(this.constants.stakeDurationMin * 2 + 7, this.constants.stakeMinimum), 'xnos');
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('unstake()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can unstake from other account', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .unstake()
                                            .accounts(__assign(__assign({}, this.accounts), { authority: this.users.user3.publicKey }))
                                            .signers([this.users.user3.user])
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.Unauthorized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not unstake with invalid reward account', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .unstake()
                                            .accounts(__assign(__assign({}, this.accounts), { reward: anchor.web3.Keypair.generate().publicKey }))
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeDoesNotMatchReward);
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .unstake()
                                            .accounts(__assign(__assign({}, this.accounts), { reward: this.accounts.stake }))
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 2:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeHasReward);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can unstake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var data, stake;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods.unstake().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 2:
                                    data = _a.sent();
                                    (0, chai_1.expect)(Date.now() / 1e3).to.be.closeTo(data.timeUnstake.toNumber(), 2);
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 3:
                                    stake = _a.sent();
                                    (0, chai_1.expect)(stake.xnos.toNumber()).to.equal(0);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('topup(), restake()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can not topup after unstake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .topup(new anchor.BN(this.constants.stakeAmount))
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeAlreadyUnstaked);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can restake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods.restake().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can topup', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stake;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods.topup(new anchor.BN(this.constants.stakeAmount)).accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    this.balances.user -= this.constants.stakeAmount;
                                    this.balances.vaultStaking += this.constants.stakeAmount;
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)];
                                case 2:
                                    stake = _a.sent();
                                    (0, chai_1.expect)(stake.duration.toNumber()).to.equal(this.constants.stakeDurationMin * 2 + 7, 'duration');
                                    (0, chai_1.expect)(stake.amount.toNumber()).to.equal(this.constants.stakeMinimum + this.constants.stakeAmount, 'amount');
                                    (0, chai_1.expect)(stake.xnos.toNumber()).to.equal((0, utils_1.calculateXnos)(this.constants.stakeDurationMin * 2 + 7, this.constants.stakeMinimum + this.constants.stakeAmount), 'xnos');
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('claim()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can not claim before unstake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .claim()
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeNotUnstaked);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not claim after too soon unstake', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods.unstake().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .claim()
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 2:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.StakeLocked);
                                    return [4 /*yield*/, this.stakingProgram.methods.restake().accounts(this.accounts).rpc()];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('slash(), update_authority()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can slash', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stakeBefore, stakeAfter;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.users.nodes[2].stake)];
                                case 1:
                                    stakeBefore = _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .slash(new anchor.BN(this.constants.slashAmount))
                                            .accounts(__assign(__assign({}, this.accounts), { stake: this.users.nodes[2].stake, vault: this.users.nodes[2].vault }))
                                            .rpc()];
                                case 2:
                                    _a.sent();
                                    this.balances.user += this.constants.slashAmount;
                                    this.balances.vaultStaking -= this.constants.slashAmount;
                                    return [4 /*yield*/, this.stakingProgram.account.stakeAccount.fetch(this.users.nodes[2].stake)];
                                case 3:
                                    stakeAfter = _a.sent();
                                    (0, chai_1.expect)(stakeAfter.amount.toNumber()).to.equal(stakeBefore.amount.toNumber() - this.constants.slashAmount);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not slash unauthorized', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .slash(new anchor.BN(this.constants.slashAmount))
                                            .accounts(__assign(__assign({}, this.accounts), { authority: this.users.node1.publicKey }))
                                            .signers([this.users.node1.user])
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.Unauthorized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not slash unauthorized hack 2', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.stakingProgram.methods
                                            .slash(new anchor.BN(this.constants.slashAmount))
                                            .accounts(__assign(__assign({}, this.accounts), { settings: this.accounts.stake }))
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.Solana8ByteConstraint);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can update slash authority', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stats;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .updateAuthority()
                                        .accounts(__assign(__assign({}, this.accounts), { newAuthority: this.users.node1.publicKey }))
                                        .rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.settingsAccount.fetch(this.accounts.settings)];
                                case 2:
                                    stats = _a.sent();
                                    (0, chai_1.expect)(stats.authority.toString()).to.equal(this.users.node1.publicKey.toString());
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can slash with node 1', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .slash(new anchor.BN(this.constants.slashAmount))
                                        .accounts(__assign(__assign({}, this.accounts), { stake: this.users.nodes[2].stake, authority: this.users.node1.publicKey, vault: this.users.nodes[2].vault }))
                                        .signers([this.users.node1.user])
                                        .rpc()];
                                case 1:
                                    _a.sent();
                                    this.balances.user += this.constants.slashAmount;
                                    this.balances.vaultStaking -= this.constants.slashAmount;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can update settings authority back', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var stats;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.stakingProgram.methods
                                        .updateAuthority()
                                        .accounts(__assign(__assign({}, this.accounts), { authority: this.users.node1.publicKey, newAuthority: this.accounts.authority }))
                                        .signers([this.users.node1.user])
                                        .rpc()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.stakingProgram.account.settingsAccount.fetch(this.accounts.settings)];
                                case 2:
                                    stats = _a.sent();
                                    (0, chai_1.expect)(stats.authority.toString()).to.equal(this.accounts.authority.toString());
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
