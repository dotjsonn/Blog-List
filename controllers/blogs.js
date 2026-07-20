const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', {username: 1, name: 1, id: 1})
  res.json(blogs)
})

blogsRouter.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id)
  if(!blog) {
    return res.status(404).end()
  }
  res.json(blog)
})

blogsRouter.post('/', userExtractor, async (req, res) => {
  const blog = req.body
  if(!blog.title || !blog.url) {
    return res.status(400).send({error: 'title or url is missing'})
  }
  if(!blog.likes) {
    blog.likes = 0
  }

  const user = req.user
  
  if(!user) {
    return res.status(400).json({error: 'user missing'})
  }

  const blogObject = new Blog({
    title: blog.title,
    author: blog.author,
    url: blog.url,
    likes: blog.likes,
    user: user._id.toString()
  })

  const blogSaved = await blogObject.save()
  user.blogs = user.blogs.concat(blogSaved._id)
  await user.save()
  res.status(201).json(blogSaved)
})

blogsRouter.delete('/:id', userExtractor, async (req, res) => {
  const blog = await Blog.findById(req.params.id)
  const user = req.user
  console.log(user);
  console.log(blog);
  
  
  const userid = user._id
  if(blog.user.toString() === userid.toString()) {
    await Blog.findByIdAndDelete(req.params.id)
    await User.findByIdAndUpdate(userid, {
      $pull: { blogs: req.params.id }
    })
  res.status(204).end()
  } else {
    return res.status(401).send({ error: 'invalid token' })
  }
  
})

blogsRouter.put('/:id', userExtractor, async (req, res) => {
  const { title, author, url, likes } = req.body

  const blog = await Blog.findById(req.params.id)

  if(!blog) {
    return res.status(404).end()
  }

  const user = req.user
  
  if(!user) {
    return res.status(400).json({error: 'user missing'})
  }

  blog.title = title
  blog.author = author
  blog.url = url
  blog.likes = likes
  blog.user = user._id.toString()

  const updatedBlog = await blog.save()
  res.json(updatedBlog)
})

module.exports = blogsRouter