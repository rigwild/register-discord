'use strict'

require('dotenv').config()

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

const fn = require('./functions.js')

const serverPort = process.env.serverPort || 3000

app.post('/loginIut', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'POST'
    && req.body.hasOwnProperty('username')
    && req.body.hasOwnProperty('password'))
    {
    fn.checkMoodleAccount(req.body.username, req.body.password)
      .then(result => res.send(JSON.stringify(result)))
      .catch(err => {
        console.error(err)
        res.send(JSON.stringify({success: false}))
      })
  }
  else res.send(JSON.stringify({success: false}))
})

app.listen(serverPort, () =>
  console.log(`Server is listening on port ${serverPort}. http://localhost:${serverPort}/`))