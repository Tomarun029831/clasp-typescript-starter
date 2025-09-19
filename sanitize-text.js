const fs = require('fs/promises');
const path = require('path');

async function getAllJSFiles(dir) {
    const files = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // サブディレクトリを再帰的に検索
                const subFiles = await getAllJSFiles(fullPath);
                files.push(...subFiles);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`💥 ディレクトリ "${dir}" の読み取りに失敗: ${error.message}`);
    }

    return files;
}

async function processPattern(pattern) {
    const files = [];

    // パターンにワイルドカードが含まれているかチェック
    if (pattern.includes('*')) {
        const dir = path.dirname(pattern);
        const filePattern = path.basename(pattern);

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            // 簡単なワイルドカードマッチング (* を .* に変換)
            const regex = new RegExp('^' + filePattern.replace(/\*/g, '.*') + '$');

            for (const entry of entries) {
                if (entry.isFile() && regex.test(entry.name)) {
                    files.push(path.join(dir, entry.name));
                }
            }
        } catch (error) {
            console.error(`💥 パターン "${pattern}" の処理に失敗: ${error.message}`);
        }
    }

    return files;
}

async function cleanupFiles() {
    // コマンドライン引数を取得
    const inputs = process.argv.slice(2);

    if (inputs.length === 0) {
        console.error('エラー: ディレクトリまたはファイルパターンが指定されていません。');
        console.error('使用例:');
        console.error('  node cleanup.js ./build/          # ディレクトリ指定');
        console.error('  node cleanup.js ./build/*.js      # パターン指定');
        console.error('  node cleanup.js ./build ./dist    # 複数ディレクトリ');
        process.exit(1);
    }

    console.log('🔍 指定された入力:', inputs);

    // すべてのJSファイルを収集
    const allFiles = new Set();

    for (const input of inputs) {
        try {
            console.log(`\n📁 "${input}" を処理中...`);

            // 入力がパターン（ワイルドカード含む）かディレクトリかを判定
            if (input.includes('*')) {
                console.log('  → ファイルパターンとして処理');
                const patternFiles = await processPattern(input);
                console.log(`  → 見つかったファイル: ${patternFiles.length}個`);

                patternFiles.forEach((file, index) => {
                    console.log(`    ${index + 1}. ${path.relative(process.cwd(), file)}`);
                    allFiles.add(file);
                });

            } else {
                // ディレクトリとして処理
                const stats = await fs.stat(input);

                if (!stats.isDirectory()) {
                    console.error(`💥 エラー: "${input}" はディレクトリではありません。`);
                    continue;
                }

                console.log('  → ディレクトリとして処理（再帰検索）');
                const jsFiles = await getAllJSFiles(input);
                console.log(`  → 見つかったJSファイル: ${jsFiles.length}個`);

                jsFiles.forEach(file => allFiles.add(file));
            }

        } catch (error) {
            console.error(`💥 エラー: "${input}" の処理中に問題が発生しました。`);
            console.error(`詳細: ${error.message}`);
        }
    }

    const fileList = Array.from(allFiles);

    if (fileList.length === 0) {
        console.warn('\n⚠️  警告: JSファイルが見つかりませんでした。');
        console.log('💡 ヒント: パスやパターンが正しいか確認してください。');
        return;
    }

    console.log(`\n📋 ${fileList.length}個のJSファイルをクリーンアップします:`);
    fileList.forEach((file, index) => {
        console.log(`  ${index + 1}. ${path.relative(process.cwd(), file)}`);
    });
    console.log('');

    // クリーンアップパターン
    const patterns = [
        /export\s*\{\s*\}\s*;?\s*/g,
        /Object\.defineProperty\s*\(\s*exports\s*,\s*["']__esModule["']\s*,\s*\{\s*value\s*:\s*(!0|true)\s*\}\s*\)\s*;?\s*/g
    ];

    let successCount = 0;
    let errorCount = 0;
    let totalRemovedChars = 0;

    for (const filePath of fileList) {
        try {
            // ファイルの内容を読み取り
            let code = await fs.readFile(filePath, 'utf8');
            const originalLength = code.length;

            let hasChanges = false;
            let matchCount = 0;

            patterns.forEach((pattern, index) => {
                const matches = code.match(pattern);
                if (matches) {
                    matchCount += matches.length;
                    hasChanges = true;
                }
                code = code.replace(pattern, '');
            });

            // 変更があった場合のみファイルを書き込み
            if (hasChanges) {
                await fs.writeFile(filePath, code, 'utf8');
                const newLength = code.length;
                const removedChars = originalLength - newLength;
                totalRemovedChars += removedChars;

                console.log(`✅ ${path.relative(process.cwd(), filePath)} (${matchCount}箇所, ${removedChars}文字削除)`);
                successCount++;
            } else {
                console.log(`⏭️  ${path.relative(process.cwd(), filePath)} (変更なし)`);
            }

        } catch (error) {
            console.error(`💥 エラー: ${path.relative(process.cwd(), filePath)} の処理中に問題が発生しました。`);
            console.error(`詳細: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n📊 処理結果:');
    console.log(`  ✅ クリーンアップ成功: ${successCount}ファイル`);
    console.log(`  ⏭️  変更なし: ${fileList.length - successCount - errorCount}ファイル`);
    console.log(`  💥 エラー: ${errorCount}ファイル`);
    console.log(`  📁 合計: ${fileList.length}ファイル`);
    console.log(`  🗑️  削除した文字数: ${totalRemovedChars}文字`);
}

cleanupFiles().catch(error => {
    console.error('💥 予期しないエラーが発生しました:', error);
    process.exit(1);
});
