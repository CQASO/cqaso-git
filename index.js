#!/usr/bin/env node

/**
 * Copyright (c) 2016-present, rainie, Inc.
 * All rights reserved.
 *
 */


const co = require('co');
const inquirer = require('inquirer');

const commandTag = require('./command_Tag.js');

function main() {
    let schema = [{
        type: 'list',
        name: 'command',
        message: 'CQASO:push到dev或master仓库',
        choices: [{
            name: 'dev',
            value: 'dev',
            short: 'dev'
        }, {
            name: 'master',
            value: 'master',
            short: 'master'
        }]
    }];

    co(function*() {
        let result = yield inquirer.prompt(schema);
        switch (result.command) {
            case 'dev':
            
                break;
            case 'master':
                commandTag();
                break;
        }
    });
}

main();
