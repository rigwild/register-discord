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
  if (req.body.hasOwnProperty('username') && req.body.hasOwnProperty('password')) {
    fn.checkMoodleAccount(req.body.username, req.body.password)
      .then(result => res.send(JSON.stringify(result)))
      .catch(err => {
        console.error(err)
        res.send(JSON.stringify({success: false}))
      })
  }
  else res.send(JSON.stringify({success: false}))
})


app.post('/linkDiscord', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (
    req.body.hasOwnProperty('discordId') &&
    req.body.hasOwnProperty('pairCode') &&
    fn.checkPairCode(req.body.pairCode, req.body.discordId)
  ) {
    res.send(JSON.stringify({success: true}))
  }
  else res.send(JSON.stringify({success: false}))
})


app.get('/getDiscord', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.query.hasOwnProperty('username')) {
    const data = fn.getDiscord(req.query.username)
    if (!!data)
      res.send(JSON.stringify({success: true, data}))
    else
      res.send(JSON.stringify({success: false}))
  }
  else res.send(JSON.stringify({success: false}))
})

app.get('/getAllDiscord', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  const data = fn.getAllDiscord()
  if (!!data)
    res.send(JSON.stringify({success: true, data}))
  else
    res.send(JSON.stringify({success: false}))
})

app.listen(serverPort, () =>
  console.log(`Server is listening on port ${serverPort}. http://localhost:${serverPort}/`))