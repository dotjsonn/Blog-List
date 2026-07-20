const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.length === 0
    ? 0
    : blogs.map(blog => blog.likes).reduce((total, curr) => total + curr, 0)
}

const favoriteBlog = (blogs) => {
  const highestLike = Math.max(...blogs.map(blog => blog.likes))
  return blogs.find(blog => blog.likes === highestLike)
}

const mostBlogs = (blogs) => {
  const authorCount = _.countBy(blogs, 'author')
  const highestAuthor = _.maxBy(_.keys(authorCount), author => authorCount[author])
  return {
    author: highestAuthor,
    blogs: authorCount[highestAuthor]
  }
}

const mostLikes = (blogs) => {
  const eachAuthorLikes = _.map(_.groupBy(blogs, 'author'), (group, author) => ({
    author,
    likes: _.sumBy(group, 'likes')
  }))
  const highestAuthorLikes = _.maxBy(eachAuthorLikes, 'likes')
  return highestAuthorLikes

}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}