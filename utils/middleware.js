const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const requestLogger = (req, res, next) => {
  logger.info('Method:', req.method)
  logger.info('Path:', req.path)
  logger.info('Body:', req.body)
  logger.info('---')
  next()
}

const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization')
  if(authorization && authorization.startsWith('Bearer ')) {
    req.token = authorization.replace('Bearer ', '')
  } else {
    req.token = null
  }
  next()
}

const userExtractor =  async (req, res, next) => {
  if(!req.token) {
    return res.status(401).send({ error: 'invalid token' })
  } else {
    const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET)
    if(!decodedToken.id) {
      return res.status(401).send({error: 'invalid token'})
    }
    req.user = await User.findById(decodedToken.id)
  }
  next()
}

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, req, res, next) => {
  logger.error(error.message)

  if(error.name === 'CastError') {
    return res.status(400).json({error: 'malformed id'})
  } else if(error.name === 'ValidationError') {
    return res.status(400).json({error: error.message})
  } else if(error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return res.status(400).json({error: 'username should be unique'})
  }
  next(error)
}

module.exports = {
  requestLogger,
  tokenExtractor,
  userExtractor,
  unknownEndpoint,
  errorHandler
}