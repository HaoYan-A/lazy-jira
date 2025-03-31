const png2icons = require('png2icons');
const fs = require('fs');
const path = require('path');

// 读取PNG文件
const pngBuffer = fs.readFileSync(path.join(__dirname, '../lazy-jira.png'));

// 转换为ICNS (macOS)
const icnsResult = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, 0);
if (icnsResult) {
    fs.writeFileSync(path.join(__dirname, '../lazy-jira.icns'), icnsResult);
    console.log('Successfully created lazy-jira.icns');
}

// 转换为ICO (Windows)
const icoResult = png2icons.createICO(pngBuffer, png2icons.BILINEAR, 0);
if (icoResult) {
    fs.writeFileSync(path.join(__dirname, '../lazy-jira.ico'), icoResult);
    console.log('Successfully created lazy-jira.ico');
} 