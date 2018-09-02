'use strict'

require('dotenv').config()

const http = require('http')
const querystring = require('querystring')
const url = require('url')
const fs = require('fs')

const { Pool } = require('pg')
const database = new Pool()

const moodleLoginPageUrl = process.env.moodleLoginPageUrl
const moodleProfilePageUrl = process.env.moodleProfilePageUrl
const HTTPUserAgent = 'discord-register'
const pairCodeSize = parseInt(process.env.pairCodeSize) || 6

// Generate a random string
const randomStr = size =>
  [...Array(size)].map(i => (~~(Math.random()*36)).toString(36)).join('').toUpperCase()


// Check moodle credentials
const checkMoodleAccount = (moodleLogin, password) => 
  new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      username: moodleLogin,
      password: password,
      rememberusername: 0
    })

    let options = {
      hostname: url.parse(moodleLoginPageUrl).hostname,
      path: url.parse(moodleLoginPageUrl).path,
      port: 80,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': HTTPUserAgent,
        'Content-Encoding': 'gzip, deflate',
        'Content-Length': Buffer.byteLength(postData),
      }
    }

    // Check the login
    const req = http.request(options, response => {
      if (response.headers['set-cookie'].find(x => x.includes('expires'))) {

        // Login valid, we fetch the user's full name
        options = {
          hostname: url.parse(moodleProfilePageUrl).hostname,
          path: url.parse(moodleProfilePageUrl).path,
          port: 80,
          method: 'GET',
          headers: {
            'Cookie': response.headers['set-cookie'][1] + ';',
            'User-Agent': HTTPUserAgent,
            'Content-Encoding': 'gzip, deflate',
            'Content-Length': Buffer.byteLength(postData),
          }
        }
        const req2 = http.request(options, response2 => {
          let data = ''
          // We can check on each chunk because the data is at the top of the page.
          // If it works we can close the request before it ends i.e. save some time
          response2.on('data', chunk => {
            const nameMatch = chunk.toString().match(/\<title\>(.*?) (.*?)\: Profil public\<\/title\>/)
            if (nameMatch && nameMatch.length >= 3) {
              resolve([moodleLogin, nameMatch[1].toLowerCase(), nameMatch[2].toLowerCase()])
              req2.end()
            }
            else data += chunk
          });
        
          response2.on('end', () => {
            const nameMatch = data.match(/\<title\>(.*?) (.*?)\: Profil public\<\/title\>/)
            if (nameMatch && nameMatch.length >= 3)
              resolve([moodleLogin, nameMatch[1].toLowerCase(), nameMatch[2].toLowerCase()])
            else reject()
          });
        }).on('error', reject)
      
        req2.end()
      }
      else reject()
    }).on('error', reject)

    req.write(postData)
    req.end()
  })

// Generate a random pair code and store it, store only the last pair code
const generatePairCode = async (moodleLogin, moodleFirstName, moodleLastName) => {
  const pairCode = randomStr(pairCodeSize)
  
  // Delete the last pairCode from this user
  await database.query(`DELETE FROM discord_pair_code WHERE moodle_login = $1`, [moodleLogin])

  // Add the new code in DB
  const query = `INSERT INTO discord_pair_code (moodle_login, moodle_firstname, moodle_lastname, pair_code)
  VALUES ($1, $2, $3, $4)`
  await database.query(query, [moodleLogin, moodleFirstName, moodleLastName, pairCode])
  
  return pairCode
}

// Check if a pair code is valid
const checkPairCode = async (pairCode) => {
  let query = 'SELECT pair_code FROM discord_pair_code WHERE pair_code = $1'
  const res = await database.query(query, [pairCode])
  return (res.rowCount > 0)
}

// Add a discord link, store only one data for the user
const addDiscordLink = async (pairCode, discordId) => {
  // Get the data from the code tuple
  let query = `SELECT moodle_login, moodle_firstname, moodle_lastname FROM discord_pair_code
  WHERE pair_code = $1`
  const res = await database.query(query, [pairCode])

  if (res.rowCount > 0) {
    const data = {
      moodleLogin: res.rows[0]['moodle_login'],
      moodleFirstName: res.rows[0]['moodle_firstname'],
      moodleLastName: res.rows[0]['moodle_lastname']
    }
    // Remove the last data backed up
    await database.query('DELETE FROM discord_user WHERE moodle_login = $1', [data.moodleLogin])

    // Add the new data
    query = `INSERT INTO discord_user (moodle_login, moodle_firstname, moodle_lastname, discord_id)
    VALUES ($1, $2, $3, $4)`
    return database.query(query, [data.moodleLogin, data.moodleFirstName, data.moodleLastName, discordId])
  }
}

// Delete a pair code from DB
const delPairCode = pairCode =>
  database.query('DELETE FROM discord_pair_code WHERE pair_code = $1', [pairCode])

module.exports = {
  checkMoodleAccount,
  generatePairCode,
  checkPairCode,
  delPairCode,
  addDiscordLink
}