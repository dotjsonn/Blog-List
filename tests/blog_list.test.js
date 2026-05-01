const {test, after, beforeEach} = require('node:test')
const mongoose = require('mongoose')
const app = require('../app')
const supertest = require('supertest')
const api = supertest(app)
const helper = require('./test_helper')
const Blog = require('../models/blog')
const assert = require('node:assert')

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

// returns blog posts in the JSON format.
test('returns blog posts in JSON format', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})
// returns the correct amount of blog posts
test('returns the correct amount of blog posts', async () => {
  const result = await api.get('/api/blogs')  
  assert.strictEqual(result.body.length, helper.initialBlogs.length)
})

after(async () => {
  await mongoose.connection.close()
})