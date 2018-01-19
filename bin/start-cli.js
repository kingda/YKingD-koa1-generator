#!/usr/bin/env node
var program = require('commander');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var sortedObject = require('sorted-object');
var MODE_0666 = parseInt('0666', 8);
var MODE_0755 = parseInt('0755', 8);
var readline = require('readline');
var ejs = require('ejs')

//设置一些命令行的短标记
program.version('0.1.0')
    .option('-f, --force', 'force on non-empty directory')
    .option('    --git', 'add .gitignore')
    .parse(process.argv);

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory (path, fn) {
    fs.readdir(path, function (err, files) {
        if (err && err.code !== 'ENOENT') throw err
        fn(!files || !files.length)
    })
}

/**
 * Create an app name from a directory path, fitting npm naming requirements.
 *
 * @param {String} pathName
 */
function createAppName (pathName) {
    return path.basename(pathName)
        .replace(/[^A-Za-z0-9.()!~*'-]+/g, '-')
        .replace(/^[-_.]+|-+$/g, '')
        .toLowerCase()
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */

function mkdir (path, fn) {
    mkdirp(path, MODE_0755, function (err) {
        if (err) throw err
        console.log('   \x1b[36mcreate\x1b[0m : ' + path)
        fn && fn()
    })
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */

function write (path, str, mode) {
    fs.writeFileSync(path, str, { mode: mode || MODE_0666 })
    console.log('   \x1b[36mcreate\x1b[0m : ' + path)
}


/**
 * Copy file from template directory.
 */

function copyTemplate (from, to) {
    from = path.join(__dirname, '..', 'templates', from)
    write(to, fs.readFileSync(from, 'utf-8'))
}


/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */
function createApplication (name, path) {
    var wait = 6;

    function complete() {
        if (--wait) return
        console.log();
        console.log('If you wanna start the application,please input command as shown')
        console.log('cd %s && npm install',path);
    }



    //生成一些模板文件
    mkdir(path, function () {
        //创建client的文件夹
        mkdir(path + '/client',function () {
            mkdir(path + '/client/css');
            mkdir(path + '/client/images');
            mkdir(path + '/client/js');
            //create util 工具库 以及 自家的fetch实现
            mkdir(path + '/client/js/common',function () {
                copyTemplate('js/fetch/fetch.js.ejs',path + '/client/js/common/fetch.js');
                copyTemplate('js/fetch/fetch-poly.js.ejs',path + '/client/js/common/fetch-polyfill.js');
                copyTemplate('js/util/util.js.ejs',path + '/client/js/common/util.js');
                complete();
            });
        });
        //创建config文件夹
        mkdir(path + '/config',function () {
            copyTemplate('config/beta.json.ejs',path + '/config/beta.json');
            copyTemplate('config/default.json.ejs',path + '/config/default.json');
            copyTemplate('config/development.json.ejs',path + '/config/development.json');
            copyTemplate('config/production.json.ejs',path + '/config/production.json');
            copyTemplate('config/test.json.ejs',path + '/config/test.json');
            complete();
        });
        //创建server文件夹
        mkdir(path + '/server',function () {

            //创建server路由文件夹
            mkdir(path + '/server/router',function () {
                copyTemplate('js/server/router.js.ejs', path + '/server/router/main.js');
                complete();
            });
            
            //创建server的工具库
            mkdir(path + '/server/common',function () {
                copyTemplate('js/server/util.js.ejs',path  + '/server/common/util.js');
                complete();
            });
            
            //创建public文件夹
            mkdir(path + '/server/public/statics');
            
            //创建view文件夹
            mkdir(path + '/server/view',function () {
                copyTemplate('js/server/index.ejs.ejs',path + '/server/view/index.ejs');
                copyTemplate('js/server/404.ejs.ejs',path + '/server/view/404.ejs');
                complete();
            })

        });


    });

    //生成 app.js
    var app = loadTemplate('js/app.js');

    // package.json
    var pkg = {
        name: name,
        version: '0.0.0',
        dependencies: {
            "chalk": "^2.3.0",
            "config": "^1.27.0",
            "ejs": "^2.5.7",
            "koa": "^1.0.0",
            "co-body": "^1.0.0",
            "koa-body": "^1.6.0",
            "koa-ejs": "^3.0.0",
            "koa-logger": "^1.3.1",
            "koa-router": "^5.4.2",
            "koa-send": "^3.3.0",
            "koa-compress": "^1.0.9",
            "node-fetch": "^1.7.3"
        }
    }
    // sort dependencies like npm(1)
    pkg.dependencies = sortedObject(pkg.dependencies)
    // write files
    write(path + '/package.json', JSON.stringify(pkg, null, 2) + '\n')
    write(path + '/app.js', app.render())

    //生成gitignore文件
    if (program.git) {
        copyTemplate('js/git/.gitignore', path + '/.gitignore')
    }
    //最后完成的输出
    complete();

}

/**
 * Load template file.
 */
function loadTemplate (name) {
    var contents = fs.readFileSync(path.join(__dirname, '..', 'templates', (name + '.ejs')), 'utf-8')
    var locals = Object.create(null)

    function render () {
        return ejs.render(contents, locals)
    }
    return {
        locals: locals,
        render: render
    }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm (msg, callback) {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(msg, function (input) {
        rl.close()
        callback(/^y|yes|ok|true$/i.test(input))
    })
}

/**
 * Graceful exit for async STDIO
 */

function exit (code) {
    // flush output for Node.js Windows pipe bug
    // https://github.com/joyent/node/issues/6247 is just one bug example
    // https://github.com/visionmedia/mocha/issues/333 has a good discussion
    function done () {
        if (!(draining--)) _exit(code)
    }

    var draining = 0
    var streams = [process.stdout, process.stderr]

    exit.exited = true

    streams.forEach(function (stream) {
        // submit empty write request and wait for completion
        draining += 1
        stream.write('', done)
    })

    done()
}

/**
 * 主要入口 第一个args为目标路径，默认为当前路径，
 */
function main() {
    //生成目录
    // Path
    var destinationPath = program.args.shift() || '.';
    // App name
    var appName = createAppName(path.resolve(destinationPath)) || 'YKingD-koa1';
    emptyDirectory(destinationPath,function (empty) {
        // if the directory is empty or args option with -f force, it will do it.
        if (empty || program.force) {
            createApplication(appName, destinationPath)
        } else {
            confirm('destination is not empty, continue? [y/N] ', function (ok) {
                if (ok) {
                    process.stdin.destroy();
                    createApplication(appName, destinationPath)
                } else {
                    console.error('aborting');
                    exit(1)
                }
            })
        }
    })
}

//主要入口
main();




