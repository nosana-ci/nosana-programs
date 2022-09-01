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
var fs_1 = require("fs");
var path_1 = require("path");
var csv_parse_1 = require("csv-parse");
var web3_js_1 = require("@solana/web3.js");
var anchor_1 = require("@project-serum/anchor");
var bytes_1 = require("@project-serum/anchor/dist/cjs/utils/bytes");
var utils_1 = require("../tests/utils");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var mint, rewardsId, stakingId, idl, program, rows, accounts, _a, instructions, _i, rows_1, row, authority, _b, _c, tx, _d, _e;
        var _this = this;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    // setup anchor
                    (0, anchor_1.setProvider)(anchor_1.AnchorProvider.env());
                    mint = new web3_js_1.PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');
                    rewardsId = new web3_js_1.PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
                    stakingId = new web3_js_1.PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE');
                    return [4 /*yield*/, anchor_1.Program.fetchIdl(rewardsId.toString())];
                case 1:
                    idl = (_f.sent());
                    program = new anchor_1.Program(idl, rewardsId);
                    rows = [{}];
                    (0, csv_parse_1.parse)((0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, 'stakers.csv'), { encoding: 'utf-8' }), {
                        delimiter: ',',
                        columns: ['address', 'amount', 'duration', 'xnos']
                    }, function (error, result) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (error) {
                                console.error(error);
                                throw error;
                            }
                            rows = result;
                            return [2 /*return*/];
                        });
                    }); });
                    accounts = {};
                    _a = accounts;
                    return [4 /*yield*/, (0, utils_1.pda)([bytes_1.utf8.encode('stats')], rewardsId)];
                case 2:
                    _a.stats = _f.sent();
                    instructions = [];
                    _i = 0, rows_1 = rows;
                    _f.label = 3;
                case 3:
                    if (!(_i < rows_1.length)) return [3 /*break*/, 10];
                    row = rows_1[_i];
                    if (row.address === 'address')
                        return [3 /*break*/, 9]; // skip the header row
                    authority = new web3_js_1.PublicKey(row.address);
                    _b = accounts;
                    return [4 /*yield*/, (0, utils_1.pda)([bytes_1.utf8.encode('reward'), authority.toBuffer()], rewardsId)];
                case 4:
                    _b.reward = _f.sent();
                    _c = accounts;
                    return [4 /*yield*/, (0, utils_1.pda)([bytes_1.utf8.encode('stake'), mint.toBuffer(), authority.toBuffer()], stakingId)];
                case 5:
                    _c.stake = _f.sent();
                    if (!(instructions.length === 12 || row === rows[rows.length - 1])) return [3 /*break*/, 7];
                    return [4 /*yield*/, program.methods.sync().accounts(accounts).preInstructions(instructions).rpc()];
                case 6:
                    tx = _f.sent();
                    console.log("https://explorer.solana.com/tx/".concat(tx));
                    instructions = []; // reset instructions
                    return [3 /*break*/, 9];
                case 7:
                    _e = (_d = instructions).push;
                    return [4 /*yield*/, program.methods.sync().accounts(accounts).instruction()];
                case 8:
                    _e.apply(_d, [_f.sent()]);
                    _f.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 3];
                case 10: return [2 /*return*/];
            }
        });
    });
}
console.log('Running client.');
main().then(function () { return console.log('Success'); });
