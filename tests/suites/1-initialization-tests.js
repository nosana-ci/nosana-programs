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
var spl_token_1 = require("@solana/spl-token");
var _ = require("lodash");
var chai_1 = require("chai");
var utils_1 = require("../utils");
function suite() {
    describe('mints and users', function () {
        it('can create mint', function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = chai_1.expect;
                            return [4 /*yield*/, (0, utils_1.mintFromFile)(this.connection, this.payer, this.publicKey)];
                        case 1:
                            _a.apply(void 0, [(_b.sent()).toString()]).to.equal(this.mint.toString());
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('can create main user and fund mint', function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            // ata
                            _a = chai_1.expect;
                            return [4 /*yield*/, (0, spl_token_1.createAssociatedTokenAccount)(this.connection, this.payer, this.mint, this.publicKey)];
                        case 1:
                            // ata
                            _a.apply(void 0, [(_b.sent()).toString()]).to.equal(this.accounts.user.toString());
                            // fund user
                            return [4 /*yield*/, (0, utils_1.mintToAccount)(this.provider, this.mint, this.accounts.user, this.constants.mintSupply)];
                        case 2:
                            // fund user
                            _b.sent();
                            this.balances.user += this.constants.mintSupply;
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('can create more funded users and nodes', function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                var _c, _d;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            // users
                            _a = this.users;
                            return [4 /*yield*/, Promise.all(_.map(new Array(10), function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, (0, utils_1.setupSolanaUser)(this)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); }))];
                        case 1:
                            // users
                            _a.users = _e.sent();
                            _c = this.users.users, this.users.user1 = _c[0], this.users.user2 = _c[1], this.users.user3 = _c[2], this.users.user4 = _c[3], this.users.otherUsers = _c.slice(4);
                            // nodes
                            _b = this.users;
                            return [4 /*yield*/, Promise.all(_.map(new Array(10), function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, (0, utils_1.setupSolanaUser)(this)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); }))];
                        case 2:
                            // nodes
                            _b.nodes = _e.sent();
                            _d = this.users.nodes, this.users.node1 = _d[0], this.users.node2 = _d[1], this.users.otherNodes = _d.slice(2);
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('can mint NFTs', function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, nft, mintAddress, _b, _c;
                var _this = this;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.metaplex.nfts().create(this.nftConfig).run()];
                        case 1:
                            _a = _d.sent(), nft = _a.nft, mintAddress = _a.mintAddress;
                            _b = this.accounts;
                            return [4 /*yield*/, (0, spl_token_1.getAssociatedTokenAddress)(mintAddress, this.publicKey)];
                        case 2:
                            _b.nft = _d.sent();
                            _c = chai_1.expect;
                            return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, this.accounts.nft)];
                        case 3:
                            _c.apply(void 0, [_d.sent()]).to.equal(1);
                            this.accounts.metadata = nft.metadataAddress;
                            return [4 /*yield*/, Promise.all(this.users.nodes.map(function (n) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a, nft, mintAddress, _b, _c, _d, _e;
                                    return __generator(this, function (_f) {
                                        switch (_f.label) {
                                            case 0: return [4 /*yield*/, this.metaplex.nfts().create(this.nftConfig).run()];
                                            case 1:
                                                _a = _f.sent(), nft = _a.nft, mintAddress = _a.mintAddress;
                                                n.metadata = nft.metadataAddress;
                                                _b = n;
                                                return [4 /*yield*/, (0, utils_1.getOrCreateAssociatedSPL)(n.provider, n.publicKey, mintAddress)];
                                            case 2:
                                                _b.ataNft = _f.sent();
                                                _c = spl_token_1.transfer;
                                                _d = [this.connection,
                                                    this.payer];
                                                return [4 /*yield*/, (0, spl_token_1.getAssociatedTokenAddress)(mintAddress, this.publicKey)];
                                            case 3: return [4 /*yield*/, _c.apply(void 0, _d.concat([_f.sent(), n.ataNft,
                                                    this.payer,
                                                    1]))];
                                            case 4:
                                                _f.sent();
                                                _e = chai_1.expect;
                                                return [4 /*yield*/, (0, utils_1.getTokenBalance)(this.provider, n.ataNft)];
                                            case 5:
                                                _e.apply(void 0, [_f.sent()]).to.equal(1);
                                                (0, chai_1.expect)(nft.name).to.equal(this.nftConfig.name, 'NFT name');
                                                (0, chai_1.expect)(nft.collection.address.toString()).to.equal(this.nftConfig.collection.toString(), 'Collection pk');
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 4:
                            _d.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
    });
}
exports["default"] = suite;
