/**
 * Copyright (c) 2016-present, rainie, Inc.
 * All rights reserved.
 *
 */

const inquirer = require('inquirer');
const colors = require('colors');
const promptMessage = colors.blue('git-commit-push') + ': ';
const commandGit = require('./lib/git.js');
const thunkify = require('thunkify');
const co = require('co');

// 仓库分支列表
const envList = ['master', 'dev'];

// 表情列表
const emojiList = {
    // bug
    Bugfix: ':bug:  [bug]',
    // 新功能
    NewFeature : ':sparkles:  [feature]',
    // 文档
    Documentation: ':books:  [document]',
    // 重构
    Refactoring: ':package:  [refact]',
    // 工具
    Tooling: ':wrench:  [config]',
};

function main() {
    co(function *() {
        yield *submit();
        yield *push();
        console.log('😁  Good Job!');
    }).catch(err => {
        console.log('😟  ' + err.message.red);
    });
}

// git提交
function *submit() {
    yield thunkify(commandGit.gitAdd)();

    let schemaEmoji = [{
        type: 'list',
        name: 'emoji',
        message: promptMessage + 'git提交修改的类型:',
        default: 'Bugfix',
        choices: [
            {
                name: '🐛  bug',
                value: 'Bugfix'
            },
            {
                name: '✨  新特性',
                value: 'NewFeature'
            },
            {
                name: '📚  文档',
                value: 'Documentation'
            },
            {
                name: '📦  重构',
                value: 'Refactoring'
            },
            {
                name: '🔧  配置',
                value: 'Tooling'
            },
        ]
    }];

    const emojiObj = yield inquirer.prompt(schemaEmoji);

    let schemaMessage = [{
        type: 'input',
        name: 'message',
        message: promptMessage + 'commit 描述信息',
        validate: function(value) {
            if (!value) {
                return 'commit 描述信息不能为空';
            }
            return true;
        }
    }];

    const messageObj = yield inquirer.prompt(schemaMessage);

    yield thunkify(commandGit.gitCommit)(emojiList[emojiObj.emoji] + messageObj.message);
    console.log('>>> git commit 提交成功!'.green);

}

// git推送
function *push() {
    let schema = [{
        type: 'confirm',
        name: 'confirm',
        message: promptMessage + '是否 push commit 到远端',
        default: true
    }];

    const result = yield inquirer.prompt(schema);
    if (result.confirm) {
        yield thunkify(commandGit.gitPush)();
        console.log('>>> commit 成功推送到远端!'.green);
    }
}

module.exports = main;
