const {
  test,
  beforeEach,
  after,
  describe,
} = require('node:test')

const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')

const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)

describe('GET /api/blogs', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })

  test('returns all blogs as JSON', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(
      response.body.length,
      helper.initialBlogs.length
    )
  })

  test('returns each blog with an id property instead of _id', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    response.body.forEach((blog) => {
      assert.ok(Object.hasOwn(blog, 'id'))
      assert.ok(!Object.hasOwn(blog, '_id'))
    })
  })
})

describe('Blog API with an authenticated user', () => {
  let token

  beforeEach(async () => {
    await helper.clearUserAndBlogInDb()

    const newUser = {
      username: 'quasar123',
      name: 'quasar',
      password: 'quasar67',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)

    const loginResponse = await api
      .post('/api/login')
      .send({
        username: newUser.username,
        password: newUser.password,
      })
      .expect(200)

    token = loginResponse.body.token

    const initialBlog = {
      title: 'Example',
      author: 'Jake C. Euro',
      url: 'http://example.com',
      likes: 2,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(initialBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  })

  describe('POST /api/blogs', () => {
    test('creates a new blog when the request contains a valid token', async () => {
      const blogsAtStart = await helper.blogsInDb()

      const newBlog = {
        title: 'Type Wars',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
        likes: 2,
      }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(
        blogsAtEnd.length,
        blogsAtStart.length + 1
      )

      const savedBlog = blogsAtEnd.find(
        (blog) => blog.id === response.body.id
      )

      assert.ok(savedBlog)
      assert.strictEqual(savedBlog.title, newBlog.title)
      assert.strictEqual(savedBlog.author, newBlog.author)
      assert.strictEqual(savedBlog.url, newBlog.url)
      assert.strictEqual(savedBlog.likes, newBlog.likes)
    })

    test('responds with 401 and does not create a blog when the token is missing', async () => {
      const blogsAtStart = await helper.blogsInDb()

      const newBlog = {
        title: 'Type Wars',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
        likes: 2,
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(
        blogsAtEnd.length,
        blogsAtStart.length
      )
    })

    test('defaults likes to zero when the likes property is missing', async () => {
      const blogsAtStart = await helper.blogsInDb()

      const newBlog = {
        title: 'TDD Harms Architecture',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
      }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(response.body.likes, 0)
      assert.strictEqual(
        blogsAtEnd.length,
        blogsAtStart.length + 1
      )
    })

    test('responds with 400 and does not create a blog when the title is missing', async () => {
      const blogsAtStart = await helper.blogsInDb()

      const blogWithoutTitle = {
        author: 'Robert C. Martin',
        url: 'http://example.com',
        likes: 12,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogWithoutTitle)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(
        blogsAtEnd.length,
        blogsAtStart.length
      )
    })

    test('responds with 400 and does not create a blog when the URL is missing', async () => {
      const blogsAtStart = await helper.blogsInDb()

      const blogWithoutUrl = {
        title: 'TDD Harms Architecture',
        author: 'Robert C. Martin',
        likes: 12,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blogWithoutUrl)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(
        blogsAtEnd.length,
        blogsAtStart.length
      )
    })
  })

  describe('DELETE /api/blogs/:id', () => {
    test('deletes an existing blog when the request contains a valid token', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(
        blogsAtEnd.length,
        blogsAtStart.length - 1
      )

      const remainingBlogIds = blogsAtEnd.map(
        (blog) => blog.id
      )

      assert.ok(!remainingBlogIds.includes(blogToDelete.id))
    })
  })

  describe('PUT /api/blogs/:id', () => {
    test('updates the information of an existing blog', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]

      const updatedInformation = {
        title: 'React Patterns',
        author: 'Michael Chan',
        url: 'https://reactpatterns.com/',
        likes: 10,
      }

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedInformation)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(
        blogsAtEnd.length,
        blogsAtStart.length
      )

      assert.strictEqual(response.body.id, blogToUpdate.id)
      assert.strictEqual(
        response.body.title,
        updatedInformation.title
      )
      assert.strictEqual(
        response.body.author,
        updatedInformation.author
      )
      assert.strictEqual(
        response.body.url,
        updatedInformation.url
      )
      assert.strictEqual(
        response.body.likes,
        updatedInformation.likes
      )

      const updatedBlogInDb = blogsAtEnd.find(
        (blog) => blog.id === blogToUpdate.id
      )

      assert.ok(updatedBlogInDb)
      assert.strictEqual(
        updatedBlogInDb.title,
        updatedInformation.title
      )
      assert.strictEqual(
        updatedBlogInDb.likes,
        updatedInformation.likes
      )
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})