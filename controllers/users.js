const usersRouter = require('express').Router()
const bcrypt = require('bcryptjs')
const User = require('../models/user')


usersRouter.get('/', async (req, res) => {
  const users = await User.find({}).populate('blogs', {title: 1, author: 1, url: 1, id: 1})
  res.json(users)
})

usersRouter.post('/', async (req, res) => {
  let { username, name, password } = req.body
  password = password.toString()

  if(password.length < 3) {
    return res.status(400).send({error: 'password should be at least 3 characters long'})
  }
  const saltRound = 10
  const passwordHash = await bcrypt.hash(password, saltRound)

  const user = new User({
    username,
    name,
    passwordHash
  })

  const savedUser = await user.save()
  res.status(201).json(savedUser)
})

module.exports = usersRouter