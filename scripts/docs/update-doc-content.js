var fs = require('fs-extra')
var path = require('path')
var dir = require('node-dir')
var matter = require('gray-matter')
var jsonToYaml = require('yamljs')

module.exports = function updateFileContents (filePath, callBack) {
  dir.readFiles(filePath, {
    match: /.md$/,
    //exclude: /^\./
  }, function (err, content, filename, next) {
    if (err) throw err

    var replace = fixCommentedYaml(content, filename)
    // parse yaml frontmatter for title
    var item = matter(replace).data
    item.gitLink = filename.split('framework')[1]
    var what = jsonToYaml.stringify(item)
    // regex patterns to match frontmatter
    // ---(\s*?.*?)*?---
    // ^(---)(\s*?.*?)*?(---)
    // ^---(\s*?.*?)*?---
    var newYamlContent = `---
${what}---`

    var finalNewContent = replace.replace(/^---(\s*?.*?)*?---/, newYamlContent)

    // writeBackToFile(filename, replace, next)
    fs.writeFileSync(filename, finalNewContent)

    if (path.basename(filename) === 'README.md') {
      var newName = path.join(path.dirname(filename), 'index.md')
      fs.renameSync(filename, newName, function (err) {
        if (err) {
          callBack(err)
        }
      })
    }
    next()
  },
    function (err, files) {
      if (err) {
        callBack(err)
      }
      callBack && callBack(null, files)
    }
  )
}

function fixCommentedYaml (content, filename) {
  // fix links for website
  var fixLinks = content.replace(/([0-9]{2})-/g, '').replace(/.md\)/g, ')')
  // replace /README)
  fixLinks = fixLinks.replace(/\/README\)/g, ')')
  // fix paths of links that are not index.md
  if (path.basename(filename) !== 'README.md') {
    console.log('FIX LINKS')
    // replace (.. with (../..
    fixLinks = fixLinks.replace(/\(\.\./g, '(../..')
    // replace (./ with (../
    fixLinks = fixLinks.replace(/\(\.\//g, '(../')

  }
  return fixLinks.replace('<!--', '---').replace('-->', '---')
}
