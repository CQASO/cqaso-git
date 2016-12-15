#!/usr/bin/env node

/**
 * Copyright (c) 2016-present, rainie, Inc.
 * All rights reserved.
 *
 */


const co = require('co');
const inquirer = require('inquirer');

const commandTag = require('./command_tag.js');
const commandCommit = require('./command_commit.js');
const commandChangelog = require('./command_changelog.js');

function main() {
    let schema = [{
        type: 'list',
        name: 'command',
        message: 'CQASO: 选择git命令',
        choices: [{
            name: '提交代码到当前分支',
            value: 'commit',
        }, {
            name: '更新tag到master',
            value: 'tag',
        }, {
            name: '更新Changelog',
            value: 'changelog',
        }]
    }];

    co(function*() {
        let result = yield inquirer.prompt(schema);
        switch (result.command) {
            case 'commit':
                commandCommit();
                break;
            case 'tag':
                commandTag();
                break;
            case 'changelog':
                commandChangelog();
        }
    });
}

main();
