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
var anchor_1 = require("@project-serum/anchor");
var bytes_1 = require("@project-serum/anchor/dist/cjs/utils/bytes");
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var utils_1 = require("../tests/utils");
var poolConfig = require("../tests/data/pool.json");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var provider, keyPair, mint, poolsId, rewardsId, idl, program, accounts, tx;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    provider = anchor_1.AnchorProvider.env();
                    (0, anchor_1.setProvider)(provider);
                    keyPair = web3_js_1.Keypair.generate();
                    mint = new web3_js_1.PublicKey(poolConfig.mint);
                    poolsId = new web3_js_1.PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
                    rewardsId = new web3_js_1.PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
                    return [4 /*yield*/, anchor_1.Program.fetchIdl(poolsId.toString())];
                case 1:
                    idl = (_b.sent());
                    program = new anchor_1.Program(idl, poolsId);
                    _a = {
                        authority: provider.wallet.publicKey
                    };
                    return [4 /*yield*/, (0, utils_1.pda)([mint.toBuffer()], rewardsId)];
                case 2:
                    _a.beneficiary = _b.sent(),
                        _a.mint = mint,
                        _a.pool = keyPair.publicKey,
                        _a.rent = anchor_1.web3.SYSVAR_RENT_PUBKEY,
                        _a.systemProgram = anchor_1.web3.SystemProgram.programId,
                        _a.tokenProgram = spl_token_1.TOKEN_PROGRAM_ID;
                    return [4 /*yield*/, (0, utils_1.pda)([bytes_1.utf8.encode('vault'), keyPair.publicKey.toBuffer()], poolsId)];
                case 3:
                    accounts = (_a.vault = _b.sent(),
                        _a);
                    return [4 /*yield*/, program.methods
                            .open(new anchor_1.BN(poolConfig.emission), new anchor_1.BN(poolConfig.startTime), poolConfig.claimType, poolConfig.closeable)
                            .accounts(accounts)
                            .signers([keyPair])
                            .rpc()];
                case 4:
                    tx = _b.sent();
                    console.log("https://explorer.solana.com/tx/".concat(tx));
                    return [2 /*return*/];
            }
        });
    });
}
console.log('Running client.');
main().then(function () { return console.log('Success'); });
