"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.octokit = void 0;
var octokit_1 = require("octokit");
console.log(process.env.GITHUB_TOKEN);
exports.octokit = new octokit_1.Octokit({
    auth: process.env.GITHUB_TOKEN
});
