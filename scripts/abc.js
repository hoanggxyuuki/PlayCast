#!/usr/bin/env node


const fs = require('fs');
const path = require('path');


const CONFIG = {

    excludeDirs: [
        'node_modules',
        '.git',
        '.expo',
        'android',
        'ios',
        'build',
        'dist',
        '.vscode',
        '.claude',
    ],

    extensions: ['.ts', '.tsx', '.js', '.jsx'],

    rootDir: process.cwd(),
};


const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');


let stats = {
    filesScanned: 0,
    filesModified: 0,
    commentsRemoved: 0,
    linesRemoved: 0,
};


function removeComments(code) {
    let result = '';
    let i = 0;
    let commentsFound = 0;
    let linesRemoved = 0;

    while (i < code.length) {

        if (code[i] === "'") {
            let str = "'";
            i++;
            while (i < code.length && code[i] !== "'") {
                if (code[i] === '\\' && i + 1 < code.length) {
                    str += code[i] + code[i + 1];
                    i += 2;
                } else {
                    str += code[i];
                    i++;
                }
            }
            if (i < code.length) {
                str += "'";
                i++;
            }
            result += str;
            continue;
        }


        if (code[i] === '"') {
            let str = '"';
            i++;
            while (i < code.length && code[i] !== '"') {
                if (code[i] === '\\' && i + 1 < code.length) {
                    str += code[i] + code[i + 1];
                    i += 2;
                } else {
                    str += code[i];
                    i++;
                }
            }
            if (i < code.length) {
                str += '"';
                i++;
            }
            result += str;
            continue;
        }


        if (code[i] === '`') {
            let str = '`';
            i++;
            while (i < code.length && code[i] !== '`') {
                if (code[i] === '\\' && i + 1 < code.length) {
                    str += code[i] + code[i + 1];
                    i += 2;
                } else {
                    str += code[i];
                    i++;
                }
            }
            if (i < code.length) {
                str += '`';
                i++;
            }
            result += str;
            continue;
        }


        if (code[i] === '/' && i + 1 < code.length) {

            const prevNonSpace = result.trimEnd().slice(-1);
            const isRegexContext = ['=', '(', ',', '[', '!', '&', '|', ':', ';', '{', '}', '\n'].includes(prevNonSpace) || result.trimEnd() === '';

            if (isRegexContext && code[i + 1] !== '/' && code[i + 1] !== '*') {
                let regex = '/';
                i++;
                while (i < code.length && code[i] !== '/' && code[i] !== '\n') {
                    if (code[i] === '\\' && i + 1 < code.length) {
                        regex += code[i] + code[i + 1];
                        i += 2;
                    } else {
                        regex += code[i];
                        i++;
                    }
                }
                if (i < code.length && code[i] === '/') {
                    regex += '/';
                    i++;

                    while (i < code.length && /[gimsuy]/.test(code[i])) {
                        regex += code[i];
                        i++;
                    }
                }
                result += regex;
                continue;
            }
        }


        if (code[i] === '/' && i + 1 < code.length && code[i + 1] === '/') {
            commentsFound++;

            while (i < code.length && code[i] !== '\n') {
                i++;
            }

            if (i < code.length) {
                result += '\n';
                i++;
            }
            continue;
        }


        if (code[i] === '/' && i + 1 < code.length && code[i + 1] === '*') {
            commentsFound++;
            i += 2;
            let newlinesInComment = 0;

            while (i < code.length && !(code[i] === '*' && i + 1 < code.length && code[i + 1] === '/')) {
                if (code[i] === '\n') newlinesInComment++;
                i++;
            }
            if (i < code.length) {
                i += 2; 
            }


            linesRemoved += newlinesInComment;
            continue;
        }


        result += code[i];
        i++;
    }


    result = result.replace(/\n{3,}/g, '\n\n');


    result = result.split('\n').map(line => {
        if (line.trim() === '') return '';
        return line;
    }).join('\n');

    return { result, commentsFound, linesRemoved };
}


function getFiles(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {

            if (CONFIG.excludeDirs.includes(item)) {
                if (isVerbose) console.log(`  Skipping directory: ${item}`);
                continue;
            }
            getFiles(fullPath, files);
        } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (CONFIG.extensions.includes(ext)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}


function processFile(filePath) {
    stats.filesScanned++;

    const relativePath = path.relative(CONFIG.rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    const { result, commentsFound, linesRemoved } = removeComments(content);

    if (commentsFound > 0) {
        stats.filesModified++;
        stats.commentsRemoved += commentsFound;
        stats.linesRemoved += linesRemoved;

        if (isDryRun) {
            console.log(`📝 Would modify: ${relativePath} (${commentsFound} comments)`);
        } else {
            fs.writeFileSync(filePath, result, 'utf-8');
            console.log(`✅ Modified: ${relativePath} (${commentsFound} comments removed)`);
        }
    } else if (isVerbose) {
        console.log(`  No comments: ${relativePath}`);
    }
}


function main() {
    console.log('🧹 Comment Remover for PlayCast');
    console.log('================================');

    if (isDryRun) {
        console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    console.log(`📂 Scanning: ${CONFIG.rootDir}`);
    console.log(`📋 Extensions: ${CONFIG.extensions.join(', ')}`);
    console.log(`🚫 Excluding: ${CONFIG.excludeDirs.join(', ')}\n`);

    const files = getFiles(CONFIG.rootDir);
    console.log(`Found ${files.length} files to process\n`);

    for (const file of files) {
        processFile(file);
    }

    console.log('\n================================');
    console.log('📊 Summary:');
    console.log(`   Files scanned: ${stats.filesScanned}`);
    console.log(`   Files modified: ${stats.filesModified}`);
    console.log(`   Comments removed: ${stats.commentsRemoved}`);

    if (isDryRun && stats.filesModified > 0) {
        console.log('\n💡 Run without --dry-run to apply changes');
    }
}


main();
