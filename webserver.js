const express = require('express')
const path = require('path')
const crawler = require('./crawler')

const server = express()
let databaseCache = null

server.use('/node_modules', express.static(path.resolve(__dirname, 'node_modules')))

server.get('/database', async (req, res) => {
  if (databaseCache) {
    return res.json(databaseCache)
  }

  databaseCache = await crawler.getAllResources('http://www.linuxfromscratch.org/lfs/view/stable/index.html')
  return res.json(databaseCache)
})

server.use('/', express.static(path.resolve(__dirname, 'frontend')))

server.listen(8080, () => console.log('Server listening on port 8080'))