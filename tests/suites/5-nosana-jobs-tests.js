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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var anchor = require("@project-serum/anchor");
var chai_1 = require("chai");
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
                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.vaults.jobs)];
                    case 2:
                        _b.apply(void 0, [_c.sent()]).to.equal(this.balances.vaultJob);
                        return [2 /*return*/];
                }
            });
        });
    });
    describe('init()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can initialize the jobs vault', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    this.accounts.vault = this.vaults.jobs;
                                    return [4 /*yield*/, this.jobsProgram.methods.init().accounts(this.accounts).rpc()];
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
    describe('start_project()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can start a project', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.methods.start().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can start projects for other users', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Promise.all(this.users.users.map(function (u) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, this.jobsProgram.methods
                                                        .start()
                                                        .accounts({
                                                        systemProgram: this.accounts.systemProgram,
                                                        authority: u.publicKey,
                                                        project: u.project
                                                    })
                                                        .signers([u.user])
                                                        .rpc()];
                                                case 1:
                                                    _a.sent();
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
                it('can fetch a project', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var data;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.account.projectAccount.fetch(this.accounts.project)];
                                case 1:
                                    data = _a.sent();
                                    (0, chai_1.expect)(data.authority.toString()).to.equal(this.accounts.authority.toString());
                                    (0, chai_1.expect)(data.jobs.length).to.equal(0);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('create()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can create a job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var throwAwayKeypair;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    throwAwayKeypair = anchor.web3.Keypair.generate();
                                    this.accounts.job = throwAwayKeypair.publicKey;
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
                                            .accounts(this.accounts)
                                            .signers([throwAwayKeypair])
                                            .rpc()];
                                case 1:
                                    _a.sent();
                                    this.balances.user -= this.constants.jobPrice;
                                    this.balances.vaultJob += this.constants.jobPrice;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not create a job in different this.ata', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg, throwAwayKeypair;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    throwAwayKeypair = anchor.web3.Keypair.generate();
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
                                            .accounts(__assign(__assign({}, this.accounts), { vault: this.accounts.user, job: throwAwayKeypair.publicKey }))
                                            .signers([throwAwayKeypair])
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal('A seeds constraint was violated');
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can create jobs for other users', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Promise.all(this.users.users.map(function (u) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, this.jobsProgram.methods
                                                        .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
                                                        .accounts(__assign(__assign({}, this.accounts), { project: u.project, job: u.signers.job.publicKey, user: u.ata, authority: u.publicKey }))
                                                        .signers([u.user, u.signers.job])
                                                        .rpc()];
                                                case 1:
                                                    _a.sent();
                                                    // update this.balances
                                                    this.balances.vaultJob += this.constants.jobPrice;
                                                    u.balance -= this.constants.jobPrice;
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); }))];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, Promise.all(this.users.users.map(function (u) { return __awaiter(_this, void 0, void 0, function () {
                                            var _a;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        _a = chai_1.expect;
                                                        return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, u.ata)];
                                                    case 1:
                                                        _a.apply(void 0, [_b.sent()]).to.equal(u.balance);
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); }))];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                /*
                // create
                it('Create max jobs', async function () {
                for (let i = 0; i < 10; i++) {
                console.log(i);
                let job = anchor.web3.Keypair.generate();
                await program.rpthis.constants.create(
                bump,
                new anchor.BN(this.constants.jobPrice),
                this.constants.ipfsData,
                {
                accounts: {
                ...accounts,
                job: job.publicKey,
                }, signers: [job]});
                this.balances.user -= this.constants.jobPrice
                this.balances.vault += this.constants.jobPrice
                }

                // tests
                await utils.assertBalancesJobs(this.provider, this.ata, this.balances)
                });
                */
                it('can fetch a job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var data;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.account.jobAccount.fetch(this.accounts.job)];
                                case 1:
                                    data = _a.sent();
                                    (0, chai_1.expect)(data.jobStatus).to.equal(this.constants.jobStatus.created);
                                    (0, chai_1.expect)((0, utils_1.buf2hex)(new Uint8Array(data.ipfsJob))).to.equal((0, utils_1.buf2hex)(new Uint8Array(this.constants.ipfsData)));
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
                it('can claim a job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.methods.claim().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not claim a job that is already claimed', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .claim()
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.JobNotInitialized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can claim jobs for all other nodes and users', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Promise.all(__spreadArray([], Array(10).keys(), true).map(function (i) { return __awaiter(_this, void 0, void 0, function () {
                                        var user, node, msg;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    user = this.users.users[i];
                                                    node = this.users.nodes[i];
                                                    // store these temporary to get them easier later
                                                    node.project = user.project;
                                                    node.job = user.signers.job.publicKey;
                                                    msg = '';
                                                    return [4 /*yield*/, this.jobsProgram.methods
                                                            .claim()
                                                            .accounts(__assign(__assign({}, this.accounts), { authority: node.publicKey, stake: node.stake, nft: node.ataNft, metadata: node.metadata, job: node.job, project: user.project }))
                                                            .signers([node.user])
                                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                                case 1:
                                                    _a.sent();
                                                    if (i === 0)
                                                        (0, chai_1.expect)(msg).to.equal(this.constants.errors.NodeUnqualifiedStakeAmount);
                                                    else if (i === 1)
                                                        (0, chai_1.expect)(msg).to.equal(this.constants.errors.NodeUnqualifiedUnstaked);
                                                    else
                                                        (0, chai_1.expect)(msg).to.equal('');
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
                it('can fetch a claimed job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var data;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.account.jobAccount.fetch(this.accounts.job)];
                                case 1:
                                    data = _a.sent();
                                    (0, chai_1.expect)(Date.now() / 1e3).to.be.closeTo(data.timeStart.toNumber(), this.constants.allowedClockDelta, 'times differ too much');
                                    (0, chai_1.expect)(data.jobStatus).to.equal(this.constants.jobStatus.claimed);
                                    (0, chai_1.expect)(data.node.toString()).to.equal(this.provider.wallet.publicKey.toString());
                                    (0, chai_1.expect)(data.tokens.toString()).to.equal(this.constants.jobPrice.toString());
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('reclaim()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can reclaim job too soon', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .reclaim()
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.JobNotTimedOut);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('finish()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can not finish a job from another node', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .finish(this.constants.ipfsData)
                                            .accounts(__assign(__assign({}, this.accounts), { authority: this.users.user2.publicKey }))
                                            .signers([this.users.user2.user])
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.Unauthorized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can finish job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.methods.finish(this.constants.ipfsData).accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    this.balances.user += this.constants.jobPrice;
                                    this.balances.vaultJob -= this.constants.jobPrice;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not finish job that is already finished', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .finish(this.constants.ipfsData)
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.JobNotClaimed);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can finish job for all nodes', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Promise.all(this.users.otherNodes.map(function (n) { return __awaiter(_this, void 0, void 0, function () {
                                        var _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0: return [4 /*yield*/, this.jobsProgram.methods
                                                        .finish(this.constants.ipfsData)
                                                        .accounts(__assign(__assign({}, this.accounts), { job: n.job, user: n.ata, authority: n.publicKey }))
                                                        .signers([n.user])
                                                        .rpc()];
                                                case 1:
                                                    _b.sent();
                                                    // update this.balances
                                                    this.balances.vaultJob -= this.constants.jobPrice;
                                                    n.balance += this.constants.jobPrice;
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
                it('can fetch a finished job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var project, job;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.account.projectAccount.fetch(this.accounts.project)];
                                case 1:
                                    project = _a.sent();
                                    return [4 /*yield*/, this.jobsProgram.account.jobAccount.fetch(this.accounts.job)];
                                case 2:
                                    job = _a.sent();
                                    // test job and project
                                    (0, chai_1.expect)(Date.now() / 1e3).to.be.closeTo(job.timeEnd.toNumber(), this.constants.allowedClockDelta);
                                    (0, chai_1.expect)(job.jobStatus).to.equal(this.constants.jobStatus.finished, 'job status does not match');
                                    (0, chai_1.expect)(project.jobs.length).to.equal(0, 'number of jobs do not match');
                                    (0, chai_1.expect)((0, utils_1.buf2hex)(new Uint8Array(job.ipfsResult))).to.equal((0, utils_1.buf2hex)(new Uint8Array(this.constants.ipfsData)));
                                    return [4 /*yield*/, Promise.all(this.users.otherNodes.map(function (n) { return __awaiter(_this, void 0, void 0, function () {
                                            var project, job;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, this.jobsProgram.account.projectAccount.fetch(n.project)];
                                                    case 1:
                                                        project = _a.sent();
                                                        return [4 /*yield*/, this.jobsProgram.account.jobAccount.fetch(n.job)];
                                                    case 2:
                                                        job = _a.sent();
                                                        (0, chai_1.expect)(job.jobStatus).to.equal(this.constants.jobStatus.finished);
                                                        (0, chai_1.expect)(project.jobs.length).to.equal(0);
                                                        (0, chai_1.expect)((0, utils_1.buf2hex)(new Uint8Array(job.ipfsResult))).to.equal((0, utils_1.buf2hex)(new Uint8Array(this.constants.ipfsData)));
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); }))];
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
    describe('close()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can close a job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var lamport_before, lamport_after;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.connection.getBalance(this.accounts.authority)];
                                case 1:
                                    lamport_before = _a.sent();
                                    return [4 /*yield*/, this.jobsProgram.methods.close().accounts(this.accounts).rpc()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, this.connection.getBalance(this.accounts.authority)];
                                case 3:
                                    lamport_after = _a.sent();
                                    (0, chai_1.expect)(lamport_before).to.be.lessThan(lamport_after);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not fetch a closed Job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .finish(this.constants.ipfsData)
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.SolanaAccountNotInitialized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    });
    describe('cancel()', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it('can create a new job and a new project', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var throwAwayKeypair;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    throwAwayKeypair = anchor.web3.Keypair.generate();
                                    this.accounts.job = throwAwayKeypair.publicKey;
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
                                            .accounts(this.accounts)
                                            .signers([throwAwayKeypair])
                                            .rpc()];
                                case 1:
                                    _a.sent();
                                    this.balances.user -= this.constants.jobPrice;
                                    this.balances.vaultJob += this.constants.jobPrice;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not cancel a job from another user', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .cancel()
                                            .accounts(__assign(__assign({}, this.accounts), { authority: this.users.user1.publicKey }))
                                            .signers([this.users.user1.user])
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.Unauthorized);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can cancel a job', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.jobsProgram.methods.cancel().accounts(this.accounts).rpc()];
                                case 1:
                                    _a.sent();
                                    this.balances.user += this.constants.jobPrice;
                                    this.balances.vaultJob -= this.constants.jobPrice;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                it('can not cancel a job in wrong state', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var msg;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    msg = '';
                                    return [4 /*yield*/, this.jobsProgram.methods
                                            .cancel()
                                            .accounts(this.accounts)
                                            .rpc()["catch"](function (e) { return (msg = e.error.errorMessage); })];
                                case 1:
                                    _a.sent();
                                    (0, chai_1.expect)(msg).to.equal(this.constants.errors.JobNotInitialized);
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
