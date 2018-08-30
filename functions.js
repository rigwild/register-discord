'use strict'

require('dotenv').config()

const http = require('http')
const querystring = require('querystring')
const url = require('url')
const fs = require('fs')

const moodleUrl = process.env.moodleUrl
const HTTPUserAgent = process.env.HTTPUserAgent || 'discord-register'
const pairCodesFile = `./data/${process.env.pairCodesFile}` || './data/pairCodes.json'
const pairCodeSize = parseInt(process.env.pairCodeSize) || 6
const discordLinkFile= `./data/${process.env.discordLinkFile}` || './data/discordLink.json'

// Generate a random string
const randomStr = size =>
  [...Array(size)].map(i => (~~(Math.random()*36)).toString(36)).join('').toUpperCase()

const createMainFiles = () => {
  if (!fs.existsSync('./data/')) fs.mkdirSync('./data/')
  if (!fs.existsSync(pairCodesFile)) fs.writeFileSync(pairCodesFile, '[]')
  if (!fs.existsSync(discordLinkFile)) fs.writeFileSync(discordLinkFile, '{}')
}

// Add a discord link, store only trhe last discord id set
const addDiscordLink = (username, discordId) => {
  createMainFiles()
  let content = JSON.parse(fs.readFileSync(discordLinkFile, 'utf8'))
  content[username] = discordId
  fs.writeFileSync(discordLinkFile, JSON.stringify(content))
}

// Generate a random pair code and store it, store only the last code set
const generatePairCode = username => {
  createMainFiles()
  let content = JSON.parse(fs.readFileSync(pairCodesFile, 'utf8'))
  const pairCode = randomStr(pairCodeSize)

  const index = content.findIndex(x => x.username === username)
  if (index !== -1) content.splice(index, 1)

  content.push({username, pairCode})
  fs.writeFileSync(pairCodesFile, JSON.stringify(content))
  return pairCode
}

// Check if a pair code is valid, delete code if valid
const checkPairCode = (pairCode, discordId) => {
  createMainFiles()
  let content = JSON.parse(fs.readFileSync(pairCodesFile, 'utf8'))
  const index = content.findIndex(x => x.pairCode === pairCode)
  if (index !== -1 && content[index]) {
    addDiscordLink(content[index].username, discordId)
    content.splice(index, 1)
    fs.writeFileSync(pairCodesFile, JSON.stringify(content))
    return true
  }
  return false
}

// Check moodle credentials
const checkMoodleAccount = (username, password) => {
  const moodleUrlParsed = url.parse(moodleUrl)
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      username: username,
      password: password,
      rememberusername: 0
    })

    const options = {
      hostname: moodleUrlParsed.hostname,
      path: moodleUrlParsed.path,
      port: 80,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': HTTPUserAgent,
        'Content-Encoding': 'gzip, deflate',
        'Content-Length': Buffer.byteLength(postData),
      }
    }

    const req = http.request(options, response => {
      const result = {}
      result.success = false
      if (!!response.headers["set-cookie"].find(x => x.includes('expires'))) {
        result.success = true
        result.pairCode = generatePairCode(username)
      }
      resolve(result)
    }).on('error', reject)

    req.write(postData)
    req.end()
  })
}

module.exports = {
  checkMoodleAccount,
  checkPairCode
}