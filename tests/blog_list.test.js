const {test, after, beforeEach, describe} = require('node:test')
const mongoose = require('mongoose')
const app = require('../app')
const supertest = require('supertest')
const api = supertest(app)
const helper = require('./test_helper')
const Blog = require('../models/blog')
const assert = require('node:assert')

describe('when initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })

  test('returns blog posts in JSON format', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('returns the correct amount of blog posts', async () => {
    const result = await api.get('/api/blogs')  
    assert.strictEqual(result.body.length, helper.initialBlogs.length)
  })


  describe('addition of blogs', () => {
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
  })
  describe('proper format', () => {
    test('check if unique identifier property is named id', async () => {
      const blogsToSee = await helper.blogsInDb()
      const checkingTheIdKey = blogsToSee.every(item => Object.hasOwn(item, 'id'))
      assert(checkingTheIdKey)
    })
  }) 

  describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToBeDeleted = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToBeDeleted.id}`)
        .expect(204)
      
      const blogsAtEnd = await helper.blogsInDb()
      const ids = blogsAtEnd.map(blog => blog.id)
      assert(!ids.includes(blogToBeDeleted.id))
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})