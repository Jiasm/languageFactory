var Excel = require('yamilquery-excel')
var fs = require('fs')
var nodeExcel = new Excel()
var filePath = `${__dirname}/${process.argv.pop()}` // 默认最后一个参数必须是 excel资源的路径

// 全局的存储语言包的JSON对象 生成就用这个来生成
var results = []

process.stdin.setEncoding('utf8')

/**
 * 接收一个资源路径 并启动生成系统
 * @param  {String} filePath 资源路径
 */
function init (filePath) {
  try {
    nodeExcel.readFile(filePath).then(data => {
      // return generator(data, require('./test.json'))
      if (!data) return
      output('欢迎使用酷炫狂拽屌炸天的语言包生成系统（暂时木有GUI）...')
      output('\n按任意键进入语言包生成界面（command + C, command + W 除外）')

      let cursor = 0

      recurrence(next => {
        let sheet = data[cursor++]
        if (!sheet) return over(data)

        let text = `\n现在要生成的为 [${sheet.name}] tab页的内容\n直接敲回车跳过该页签，大写P跳过后边步骤： `
        let cb = () => {
          var chunk = process.stdin.read()

          if (chunk === '\n') {
            return next()
          } else if (chunk == 'P\n') {
            return over(data)
          } else if (chunk !== null) {
            return build(sheet.data, cursor - 1, next)
          }
        }

        output(text, cb)
      })
    })
  } catch (e) {
    console.log(e)
  }
}

/**
 * 配置完毕 将配置文件存下来 然后根据配置生成语言包
 * @param  {Object} data       excel的数据
 */
function over (data) {
  fs.writeFileSync(`${__dirname}/test.json`, JSON.stringify(results))
  generator(data, results)
  process.exit()
}

/**
 * 调用生成配置文件的函数
 * @param  {Object} data       excel的数据
 * @param  {Number} sheetIndex 页签的下标
 * @param  {Function} jump     跳过当前层级的后续所有操作
 */
function build (data, sheetIndex, jump) {
  // 默认认为第一行是标题，所以直接取
  let titles = data.shift()
  setTitle(titles, sheetIndex, () => {
    setItem(data, sheetIndex, jump)
  })
}

/**
 * 这里用来设置标题
 * @param {Array} titles        某个页签下的所需要的语言
 * @param {Number} sheetIndex   页签在集合中的下标
 * @param {Function} jump       跳过剩余语言的配置 进入翻译文本的配置
 */
function setTitle (titles, sheetIndex, jump) {
  let cursor = 0

  if (!results[sheetIndex]) {
    results[sheetIndex] = {}
  }

  let result = results[sheetIndex].title = results[sheetIndex].title || []

  recurrence(next => {
    let title = titles[cursor++]

    if (!title) return jump()

    let text = `\n现在要生成的为 [${title ? title.slice(0, 10) : 'Warning：key值为空 建议跳过'}] 所对应的语言包文件名\n直接敲回车跳过该语言下的所有项，大写P跳过后边步骤： `
    let cb = () => {
      var chunk = process.stdin.read()

      if (chunk === '\n') {
        result.push(false)
      } else if (chunk == 'P\n') {
        return jump()
      } else {
        result.push(chunk.replace(/\n/g, ''))
      }
      return next()
    }

    output(text, cb)
  })
}

/**
 * 设置翻译文本的配置
 * @param {Array} itemList    某个页签下所有的翻译文本的行 因为标题那一行已经被剃掉了了 所以直接循环就好
 * @param {Number} sheetIndex 页签的下标
 * @param {Function} jump     用于跳过剩余翻译文本的配置 进入下一个页签的语言配置
 */
function setItem (itemList, sheetIndex, jump) {
  let cursor = 0

  if (!results[sheetIndex]) {
    results[sheetIndex] = {}
  }

  let result = results[sheetIndex].item = results[sheetIndex].item || []

  recurrence(next => {
    let item = itemList[cursor++]

    if (item === undefined || item === null) return jump()

    item = item[0]

    let text = `\n现在要为 [${item ? item.slice(0, 10) : 'Warning：key值为空 建议跳过'}] 生成对应的语言包的key\n直接敲回车跳过对当前项的处理，大写P跳过后边步骤： `
    let cb = () => {
      let chunk = process.stdin.read()

      if (chunk === '\n') {
        result.push(false)
      } else if (chunk === 'P\n') {
        return jump()
      } else {
        result.push(chunk.replace(/\n/g, ''))
      }
      return next()
    }

    output(text, cb)
  })
}

/**
 * 通过配置对象 从excel数据中取出对应的数据 并且对语言对应的文本进行合并
 * 最后数据类似这样：
 * {
 *   ch: [
 *     {
 *       beans: '豆子'
 *     }
 *   ],
 *   en: [
 *    {
 *      beams: 'Beans'
 *    }
 *   ],
 *   ...
 * }
 * @param  {Object} excel excel数据
 * @param  {Object} data  配置对象
 */
function generator (excel, data) {
  let languageObj = new Map()
  data.forEach((sheet, sheetIndex) => {
    if (!sheet) return

    try {
      let titleList = sheet.title
      let itemList = sheet.item

      titleList.forEach((title, titleIndex) => {
        if (!title) return

        let languageItem = {}

        if (languageObj.has(title)) {
          languageItem = languageObj.get(title)
        }

        itemList.forEach((item, index) => {
          if (!item) return
          // 将数据转换为 key: [某国对应文本]
          languageItem[item] = excel[sheetIndex].data[index][titleIndex]
        })

        languageObj.set(title, languageItem)
      })
    } catch (e) {
      console.log(e);
    }
  })

  // 调用生成json文件的方法
  buildJSON(languageObj)
}

/**
 * 根据数据生成文件 默认会为每一个key生成一个文件
 * @param  {Object} data 经过一次转化后的语言包数据
 */
function buildJSON (data) {
  let buildPath = `${__dirname}/build`
  data.forEach((item, key) => {
    try {
      let result = {}

      for (let key in item) {
        result[key] = item[key]
      }
      if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath)
      }
      fs.writeFileSync(`${buildPath}/${key}.json`, JSON.stringify(result, null, '  '))
    } catch (e) {
      console.log(e);
    }
  })
  console.log('生成完毕')
}

/**
 * 打印文本 并可选的监听用户输入
 * @param  {String}   text     要显示的文本
 * @param  {Function} callback 监听输入事件（可选）
 */
function output (text, callback) {
  if (callback) {
    process.stdin.removeAllListeners('readable')
    process.stdin.on('readable', callback)
  }
  process.stdout.write(text)
}

/**
 * 递归
 * @param  {Function} callback 要执行的函数 会将调用自身的一个函数传入进去
 */
function recurrence (callback) {
  callback(() => {
    recurrence(callback)
  })
}

// 执行吊炸天系统
init(filePath)
