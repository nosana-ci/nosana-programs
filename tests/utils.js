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
exports.updateRewards = exports.sleep = exports.setupSolanaUser = exports.pda = exports.now = exports.mintToAccount = exports.mintFromFile = exports.getTokenBalance = exports.getOrCreateAssociatedSPL = exports.calculateXnos = exports.buf2hex = void 0;
var anchor = require("@project-serum/anchor");
var SecretKey = require("./keys/devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP.json");
var spl_token_1 = require("@solana/spl-token");
var bytes_1 = require("@project-serum/anchor/dist/cjs/utils/bytes");
var web3_js_1 = require("@solana/web3.js");
var anchor_1 = require("@project-serum/anchor");
var chai_1 = require("chai");
/**
 *
 * @param provider
 * @param wallet
 */
function getTokenBalance(provider, wallet) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = parseInt;
                    return [4 /*yield*/, provider.connection.getTokenAccountBalance(wallet)];
                case 1: return [2 /*return*/, _a.apply(void 0, [(_b.sent()).value.amount])];
            }
        });
    });
}
exports.getTokenBalance = getTokenBalance;
/**
 *
 * @param connection
 * @param payer
 * @param key
 * @param authority
 */
function mintFromFile(connection, payer, authority) {
    return __awaiter(this, void 0, void 0, function () {
        var keyPair;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    keyPair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(SecretKey));
                    return [4 /*yield*/, (0, spl_token_1.createMint)(connection, payer, authority, null, 6, keyPair)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.mintFromFile = mintFromFile;
/**
 *
 * @param provider
 * @param mint
 * @param destination
 * @param amount
 */
function mintToAccount(provider, mint, destination, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tx = new anchor.web3.Transaction();
                    tx.add((0, spl_token_1.createMintToInstruction)(mint, destination, provider.wallet.publicKey, amount, [], spl_token_1.TOKEN_PROGRAM_ID));
                    return [4 /*yield*/, provider.sendAndConfirm(tx)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.mintToAccount = mintToAccount;
/**
 *
 * @param buffer
 */
function buf2hex(buffer) {
    // buffer is an ArrayBuffer
    return __spreadArray([], new Uint8Array(buffer), true).map(function (x) { return x.toString().padStart(2, '0'); }).join('');
}
exports.buf2hex = buf2hex;
/**
 *
 * @param provider
 * @param owner
 * @param mint
 */
function getOrCreateAssociatedSPL(provider, owner, mint) {
    return __awaiter(this, void 0, void 0, function () {
        var ata, tx, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, spl_token_1.getAssociatedTokenAddress)(mint, owner)];
                case 1:
                    ata = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    tx = new anchor.web3.Transaction();
                    tx.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(owner, ata, owner, mint));
                    return [4 /*yield*/, provider.sendAndConfirm(tx, [], {})];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.log('exists!');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, ata];
            }
        });
    });
}
exports.getOrCreateAssociatedSPL = getOrCreateAssociatedSPL;
/**
 *
 * @param seeds
 * @param programId
 */
function pda(seeds, programId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress(seeds, programId)];
                case 1: return [2 /*return*/, (_a.sent())[0]];
            }
        });
    });
}
exports.pda = pda;
/**
 *
 * @param duration
 * @param amount
 */
function calculateXnos(duration, amount) {
    var xnosDiv = ((365 * 24 * 60 * 60) / 12) * 4;
    return Math.floor((duration / xnosDiv + 1) * amount);
}
exports.calculateXnos = calculateXnos;
/**
 *
 * @param ms
 */
var sleep = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
exports.sleep = sleep;
/**
 *
 */
var now = function () {
    return Math.floor(Date.now() / 1e3);
};
exports.now = now;
/**
 *
 * @param mochaContext
 * @param stakePubkey
 * @param fee
 * @param reflection
 */
function updateRewards(mochaContext, stakePubkey, fee, reflection) {
    if (fee === void 0) { fee = new anchor.BN(0); }
    if (reflection === void 0) { reflection = new anchor.BN(0); }
    return __awaiter(this, void 0, void 0, function () {
        var stake, stats, amount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mochaContext.stakingProgram.account.stakeAccount.fetch(stakePubkey)];
                case 1:
                    stake = _a.sent();
                    return [4 /*yield*/, mochaContext.rewardsProgram.account.statsAccount.fetch(mochaContext.accounts.stats)];
                case 2:
                    stats = _a.sent();
                    amount = 0;
                    if (!reflection.eqn(0)) {
                        amount = reflection.div(mochaContext.total.rate).sub(stake.xnos).toNumber();
                        mochaContext.total.xnos.isub(stake.xnos.add(new anchor_1.BN(amount)));
                        mochaContext.total.reflection.isub(reflection);
                    }
                    if (!fee.eqn(0)) {
                        mochaContext.total.xnos.iadd(fee);
                        mochaContext.total.rate = mochaContext.total.reflection.div(mochaContext.total.xnos);
                    }
                    else {
                        mochaContext.total.xnos.iadd(stake.xnos);
                        mochaContext.total.reflection.iadd(stake.xnos.mul(mochaContext.total.rate));
                    }
                    (0, chai_1.expect)(stats.rate.toString()).to.equal(mochaContext.total.rate.toString(), 'Rate error');
                    (0, chai_1.expect)(stats.totalXnos.toString()).to.equal(mochaContext.total.xnos.toString(), 'Total XNOS error');
                    (0, chai_1.expect)(stats.totalReflection.toString()).to.equal(mochaContext.total.reflection.toString(), 'Total reflection error');
                    return [2 /*return*/, amount];
            }
        });
    });
}
exports.updateRewards = updateRewards;
/**
 *
 * @param mochaContext
 */
function setupSolanaUser(mochaContext) {
    return __awaiter(this, void 0, void 0, function () {
        var user, publicKey, wallet, provider, _a, _b, ata;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    user = anchor.web3.Keypair.generate();
                    publicKey = user.publicKey;
                    wallet = new anchor.Wallet(user);
                    provider = new anchor.AnchorProvider(mochaContext.connection, wallet, {});
                    _b = (_a = mochaContext.connection).confirmTransaction;
                    return [4 /*yield*/, mochaContext.connection.requestAirdrop(publicKey, anchor.web3.LAMPORTS_PER_SOL)];
                case 1:
                // fund SOL
                return [4 /*yield*/, _b.apply(_a, [_d.sent()])];
                case 2:
                    // fund SOL
                    _d.sent();
                    return [4 /*yield*/, getOrCreateAssociatedSPL(provider, publicKey, mochaContext.mint)];
                case 3:
                    ata = _d.sent();
                    return [4 /*yield*/, mintToAccount(mochaContext.provider, mochaContext.mint, ata, mochaContext.constants.userSupply)];
                case 4:
                    _d.sent();
                    _c = {
                        user: user,
                        publicKey: publicKey,
                        ata: ata,
                        provider: provider,
                        wallet: wallet,
                        signers: {
                            job: anchor.web3.Keypair.generate()
                        },
                        balance: mochaContext.constants.userSupply
                    };
                    return [4 /*yield*/, pda([bytes_1.utf8.encode('project'), publicKey.toBuffer()], mochaContext.jobsProgram.programId)];
                case 5:
                    // pdas
                    _c.project = _d.sent();
                    return [4 /*yield*/, pda([bytes_1.utf8.encode('stake'), mochaContext.mint.toBuffer(), publicKey.toBuffer()], mochaContext.stakingProgram.programId)];
                case 6:
                    _c.stake = _d.sent();
                    return [4 /*yield*/, pda([bytes_1.utf8.encode('reward'), publicKey.toBuffer()], mochaContext.rewardsProgram.programId)];
                case 7:
                    _c.reward = _d.sent();
                    return [4 /*yield*/, pda([bytes_1.utf8.encode('vault'), mochaContext.mint.toBuffer(), publicKey.toBuffer()], mochaContext.stakingProgram.programId)];
                case 8:
                // return user object
                return [2 /*return*/, (_c.vault = _d.sent(),
                        // undefined
                        _c.job = undefined,
                        _c.ataNft = undefined,
                        _c.metadataAddress = undefined,
                        _c)];
            }
        });
    });
}
exports.setupSolanaUser = setupSolanaUser;
