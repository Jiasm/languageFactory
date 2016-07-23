var Excel = require('yamilquery-excel')
var nodeExcel = new Excel()
var filePath = `${__dirname}/${process.argv.pop()}`

var result = {}

process.stdin.setEncoding('utf8');

try {
  nodeExcel.readFile(filePath).then(data => {
    console.log('欢迎使用酷炫狂拽屌炸天的语言包生成系统（暂时木有GUI）...')
    console.log('按任意键进入语言包编辑界面（command + C, command + W 除外）');
    for (let sheet of data) {
      console.log(sheet.data.length)
    }

    // process.stdin.on('readable', () => {
    //   var chunk = process.stdin.read()
    //   if (chunk !== null) {
    //     process.stdout.write(`data: ${chunk}`)
    //   }
    // });
    //
    // process.stdin.on('end', () => {
    //   process.stdout.write('end')
    // });
  })
} catch (e) {
  console.log(e)
} finally {
  // console.log(result)
}
