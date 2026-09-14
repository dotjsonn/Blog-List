const loginRouter = require('express').Router()
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

loginRouter.post('/', async (req, res) => {
  const {username, password} = req.body

  const user = await User.findOne({ username })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return res.status(401).send({
      error: 'invalid username or password'
    })
  }

  const tokenForUser = {
    username: user.username,
    id: user._id
  }
  const token = jwt.sign(tokenForUser, process.env.JWT_SECRET)
  res.send({
    token,
    username: user.username,
    name: user.name,
    id: user.id
  })
})

module.exports = loginRouter