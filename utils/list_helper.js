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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}