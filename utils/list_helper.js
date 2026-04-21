const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (total, current) => {
    return total + current.likes
  }
  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const highestLike = Math.max(...blogs.map(blog => blog.likes))
  const favorite = blogs.find(blog => blog.likes === highestLike)
  return favorite
}

const mostBlogs = (blogs) => {
  const names = _.map(blogs, 'author')
  const authorCount = _.countBy(names)
  const makeItObject = _.map(authorCount, (value, key) => {
    return {
      author: key,
      blogs: value
    }
  })
  const mostBlogObject = _.maxBy(makeItObject, 'blogs')
  return mostBlogObject
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}