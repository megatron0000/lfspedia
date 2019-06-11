const cheerio = require('cheerio')
const request = require('request-promise-native')
const url = require('url')

/**
 * 
 * @param {string} pageHtml
 */
function isPackagePage(pageHtml) {
  const page = cheerio.load(pageHtml)
  return page('.content').length > 0
}

/**
 * 
 * @param {string} pageHtml 
 */
function getPackageName(pageHtml) {
  const page = cheerio.load(pageHtml)
  // regexp must swallow `\n` too
  return page('.content').children().first().text().replace(/^[^]+?Contents\s+of\s+/g, '').trim()
}

/**
 * @typedef {object} PackageResources
 * @property {string} name Name of the package
 * @property {string[]} programs
 * @property {string[]} headers
 * @property {string[]} libraries
 * @property {string[]} directories
 * @property {string[]} modules
 * @property {string[]} scripts
 */

/**
 * 
 * @param {string} pageHtml
 * @returns {PackageResources}
 */
function getListedResources(pageHtml) {
  const page = cheerio.load(pageHtml)
  /**
   * @type {PackageResources}
   */
  const result = {
    name: getPackageName(pageHtml),
    programs: [],
    headers: [],
    libraries: [],
    directories: [],
    modules: [],
    scripts: []
  }

  page('.content .segmentedlist .segtitle').each((index, title) => {
    const titletext = page(title).text()
    const bodytext = page(title).next('.segbody').text()

    // example: "lib.{a,so}, lib{,.a}, and otherlib.so"
    const bodyElements = bodytext
      .replace(/\([^)]*?\)/g, '')
      .split(/,(?![^{}]*\})|\s+and\s+(?![^]+\s+and\s+[^]+)/)
      .map(x => x.trim())
      .filter(x => x.length > 0)

    if (titletext.match(/Installed\s+program/i)) {
      if (result.programs.length) {
        throw new Error('Expected result.programs to be empty')
      }
      result.programs = bodyElements
    }
    else if (titletext.match(/Installed\s+director/i)) {
      if (result.directories.length) {
        throw new Error('Expected result.directories to be empty')
      }
      result.directories = bodyElements
    }
    else if (titletext.match(/Installed\s+librar/i)) {
      if (result.libraries.length) {
        throw new Error('Expected result.libraries to be empty')
      }
      result.libraries = bodyElements
    }
    else if (titletext.match(/Installed\s+header/i)) {
      if (result.headers.length) {
        throw new Error('Expected result.header to be empty')
      }
      result.headers = bodyElements
    }
    else if (titletext.match(/Installed\s+module/i)) {
      if (result.modules.length) {
        throw new Error('Expected result.modules to be empty')
      }
      result.modules = bodyElements
    }
    else if (titletext.match(/Installed\s+script/i)) {
      if (result.scripts.length) {
        throw new Error('Expected result.scripts to be empty')
      }
      result.scripts = bodyElements
    }
    // likely man-pages, which really install nothing
    else if (titletext.match(/Installed\s+file/i)) {
      return
    }
    else {
      throw new Error('Title for program ' +
        result.name +
        ' with html ' +
        pageHtml +
        ' had none of the expected classifications (programs, headers, etc.)')
    }

  })

  return result
}

/**
 * 
 * @param {*} bookIndexUrl 
 * @return {Promise<string[]>}
 */
async function getAllPackagePages(bookIndexUrl) {
  /**
   * @type {string}
   */
  const bookIndexHtml = await request.get(bookIndexUrl)
  const bookIndexPage = cheerio.load(bookIndexHtml)

  return Promise.all(
    bookIndexPage('a')
      .map((index, element) => {
        return bookIndexPage(element).attr('href')
      })
      .get()
      .map(maybeRelativeUrl => url.resolve(bookIndexUrl, maybeRelativeUrl))
      .filter(href => href.match('chapter06') || !href.match('chapter05'))
      .map(href => request.get(href))
  )
}

/**
 * 
 * @param {string} bookIndexUrl 
 * @returns {Promise<PackageResources[]>}
 */
function getAllResources(bookIndexUrl) {
  return getAllPackagePages(bookIndexUrl)
    .then(pages => pages.filter(isPackagePage))
    .then(packagePages => packagePages.map(getListedResources))
}

/**
 * 
 * @param {string} url 
 * @returns {Promise<string>}
 */
function getHtml(url) {
  return request.get(url)
}

module.exports = {
  isPackagePage,
  getPackageName,
  getListedResources,
  getAllPackagePages,
  getAllResources,
  getHtml
}