/**
 * Copyright (c) 2016-present, rainie, Inc.
 * All rights reserved.
 *
 */

const co = require('co');
const colors = require('colors');
const moment = require('moment');
const inquirer = require('inquirer');
const thunkify = require('thunkify');
const promptMessage = colors.blue('git-tag-generate') + ': ';


// 更新 week 设置
moment.locale('zh-cn', {
    // 每年第一周的定义：
    // 国内：包含1月4号的那周为每年第一周
    // 美国：包含1月1号的那周为每年第一周（苹果日历也是如此）
    // 更新了下 moment，现在规则是 包含1月1号的那周为每年第一周，新的一周起始于周一（比较好理解，苹果日历也可设置）
    week: {
        dow: 1, // Monday is the first day of the week.
        doy: 7 // The week that contains Jan 1th is the first week of the year.
    }
});

// 功能类库加载
const commandAdd = require('./lib/git.js');

function main() {
    let currentVersion = '';
    let currentVersionWithoutTag = '';

    try {
        currentVersion = commandAdd.getCurentVersion();
        let currentVersionArr = currentVersion.split('+');

        currentVersionWithoutTag = currentVersionArr[0];

        console.log('!!!!!!!!!!! '.rainbow + `当前版本: ${currentVersion.white}` + ' !!!!!!!!!!!'.rainbow);
        generateVersion(currentVersionWithoutTag);
    } catch (e) {
        console.log(`当前目录：${process.cwd()}，不存在 package.json 文件，请到 package.json 文件所在目录执行命令`.red);
        process.exit(1);
    }
}

// 生成版本号
function generateVersion(currentVersionWithoutTag) {
    let versionNextSuggest = {
        major: commandAdd.generateTag({
            version: currentVersionWithoutTag,
            part: 'major'
        }),
        feature: commandAdd.generateTag({
            version: currentVersionWithoutTag,
            part: 'feature'
        }),
        patch: commandAdd.generateTag({
            version: currentVersionWithoutTag,
            part: 'patch'
        })
    };

    let schema = [{
        type: 'list',
        name: 'version',
        message: promptMessage + colors.gray('semver 规范的版本号:'),
        default: versionNextSuggest.patch,
        choices: [{
            short: '自定义',
            name: '自定义\n' +
                colors.gray('  - 格式如 ${major}.${feature}.${patch}(请遵循 semver 规范)'),
            value: false
        }, {
            short: versionNextSuggest.patch,
            name: 'patch   (' + versionNextSuggest.patch + ')\n' +
                colors.gray('  - 递增修订版本号(用于 bug 修复)'),
            value: versionNextSuggest.patch
        }, {
            short: versionNextSuggest.feature,
            name: 'feature (' + versionNextSuggest.feature + ')\n' +
                colors.gray('  - 递增特性版本号(用于向下兼容的特性新增, 递增位的右侧位需要清零)'),
            value: versionNextSuggest.feature
        }, {
            short: versionNextSuggest.major,
            name: 'major   (' + versionNextSuggest.major + ')\n' +
                colors.gray('  - 递增主版本号  (用于断代更新或大版本发布，递增位的右侧位需要清零)'),
            value: versionNextSuggest.major
        }]
    }];

    inquirer.prompt(schema).then(function(result) {
        if (!result.version) {
            reVersion();
        } else {
            generateNewTag(result.version);
        }
    });
}


// 重新生成版本号
function reVersion() {
    let schema = [{
        type: 'input',
        name: 'version',
        message: promptMessage + 'semver 规范的版本号',
        validate: function(value) {
            if (!/^\d+\.\d+\.\d+$/.test(value)) {
                return '[X] 格式如 ${major}.${feature}.${patch} (请遵循 semver 规范)'.red;
            }

            let res = commandAdd.versionValidate(currentVersionWithoutTag, value);
            if (res.pass) {
                return true;
            } else {
                return '[X] '.red + res.message.red;
            }
        }
    }];

    inquirer.prompt(schema).then(function(result) {
        generateNewTag(result.version);
    });
}

// 生成新的tag
function generateNewTag(version) {
    let schema = [{
        type: 'confirm',
        name: 'isNeedPublishTimesTag',
        message: promptMessage + '是否添加发布次数 tag (格式如 ${year}w${weeks}${[a-z]本周第几次发布})',
        default: false
    }];

    inquirer.prompt(schema).then(function(result) {
        let newTag = commandAdd.generateTagHandInput({
            version: version,
            isNeedPublishTimesTag: result.isNeedPublishTimesTag
        });
        tagConfirm(newTag);
    });
}

// tag 确认
function tagConfirm(newTag) {
    console.log('!!!!!!!!!!! '.rainbow + `新版 tag: ${newTag.white}` + ' !!!!!!!!!!!'.rainbow);
    co(function*() {
        yield* editPackage(newTag);
        yield* gitTagAdd(newTag);
        yield* gitTagPush(newTag);
        console.log('😁  Good Job!');
    }).catch(err => {
        console.log('😟  ' + err.message.red);
    });
}

// 修改package
function *editPackage(newTag) {
    let schema = [{
        type: 'confirm',
        name: 'confirm',
        message: promptMessage + '是否更改 package.json 文件的 version 信息',
        default: true
    }];

    const result = yield inquirer.prompt(schema);
    yield thunkify(commandAdd.changePackage)(newTag);
    console.log('>>> package.json 更改成功'.green);
}

// 执行 git tag add 命令
function *gitTagAdd(newTag) {
    let schema = [{
        type: 'confirm',
        name: 'confirm',
        message: promptMessage + '是否执行 git tag add 命令',
        default: true
    }];

    const result = yield inquirer.prompt(schema);
    if (result.confirm) {
        let schema = [{
            type: 'input',
            name: 'message',
            message: promptMessage + 'tag 描述信息',
            validate: function(value) {
                if (!value) {
                    return 'tag 描述信息不能为空';
                }
                return true;
            }
        }];

        const result = yield inquirer.prompt(schema);
        yield thunkify(commandAdd.gitTagAdd)(newTag, result.message);
        console.log('>>> git tag 添加成功!'.green);
    }
}

// tag推送到远端
function *gitTagPush(newTag) {
    let schema = [{
        type: 'confirm',
        name: 'confirm',
        message: promptMessage + '是否 push tag 到远端',
        default: true
    }];

    const result = yield inquirer.prompt(schema);
    if (result.confirm) {
        yield thunkify(commandAdd.gitTagPush)(newTag);
        console.log('>>> tag 成功推送到远端!'.green);
    }
}

module.exports = main;
