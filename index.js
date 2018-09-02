'use strict'

require('dotenv').config()

const fs = require('fs')

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

const fn = require('./functions.js')

const serverPort = process.env.serverPort || 3000


app.post('/checkMoodleAccount', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.body.hasOwnProperty('moodleLogin') && req.body.hasOwnProperty('password')) {
    fn.checkMoodleAccount(req.body.moodleLogin, req.body.password)
      .then(result => fn.generatePairCode(...result))
      .then(pairCode => res.send({ success: true, pairCode }))
      .catch(err => {
        console.error(err)
        res.send(JSON.stringify({success: false}))
      })
  }
  else res.send(JSON.stringify({success: false}))
})


app.post('/linkDiscord', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.body.hasOwnProperty('discordId') && req.body.hasOwnProperty('pairCode')) {
    fn.checkPairCode(req.body.pairCode, req.body.discordId)
      .then(result => result && fn.addDiscordLink(req.body.pairCode, req.body.discordId))
      .then(() => fn.delPairCode(req.body.pairCode))
      .then(() => res.send(JSON.stringify({success: true})))
      .catch(err => {
        console.error(err)
        res.send(JSON.stringify({success: false}))
      })
  }
  else res.send(JSON.stringify({success: false}))
})

app.listen(serverPort, () =>
  console.log(`Server is listening on port ${serverPort}. http://localhost:${serverPort}/`))
