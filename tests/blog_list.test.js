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

// check if unique identifier property is named id
test('check if unique identifier property is named id', async () => {
  const blogsToSee = await helper.blogsInDb()
  const checkingTheIdKey = blogsToSee.every(item => Object.hasOwn(item, 'id'))
  assert(checkingTheIdKey)
})

// test post request
test('a valid blog can be added', async () => {
  const blogObject = {
    title: "First class tests",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    likes: 10
  }

  await api
    .post('/api/blogs')
    .send(blogObject)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  const titles = blogsAtEnd.map(blog => blog.title)

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
  assert(titles.includes("First class tests"))
})

// test post request with no likes property
test('a valid blog can be added', async () => {
  const blogObject = {
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
  }

  await api
    .post('/api/blogs')
    .send(blogObject)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
})

// test post request with no title property
test('a blog with no title cannot be added', async () => {
  const blogObject = {
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
  }

  await api
    .post('/api/blogs')
    .send(blogObject)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})

// test post request with no url property
test('a blog with no url cannot be added', async () => {
  const blogObject = {
    title: "Type wars",
    author: "Robert C. Martin",
  }

  await api
    .post('/api/blogs')
    .send(blogObject)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})

after(async () => {
  await mongoose.connection.close()
})