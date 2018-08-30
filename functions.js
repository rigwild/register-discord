'use strict'

require('dotenv').config()

const http = require('http')
const querystring = require('querystring')
const url = require('url')
const fs = require('fs')

const moodleUrl = process.env.moodleUrl
const HTTPUserAgent = process.env.HTTPUserAgent || 'discord-register'
const pairCodesDir = process.env.pairCodesDir || './pairCodes/'
const pairCodeSize = parseInt(process.env.pairCodeSize) || 6

// Generate a random string
const randomStr = size =>
  [...Array(size)].map(i => (~~(Math.random()*36)).toString(36)).join('').toUpperCase();

// If pairCodes directory does not exist, create it
const createCodeDir = () => {!fs.existsSync(pairCodesDir) && fs.mkdirSync(pairCodesDir)}

// Generate a random pair code and store it
const generatePairCode = username => {
  createCodeDir()
  const path = `${pairCodesDir}${username}.json`
  const pairCode = randomStr(pairCodeSize)
  fs.writeFileSync(path, JSON.stringify(pairCode))
  return pairCode
}

// Check if a pair code is valid
const checkPairCode = (username, pairCode) => {
  createCodeDir()
  const path = `${pairCodesDir}${username}.json`
  return (fs.existsSync(path) && JSON.parse(fs.readFileSync(path, 'utf8')) === pairCode)
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