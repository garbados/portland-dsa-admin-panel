import axios from 'axios'

const dayms = 24*60*60*1000 // good enough for javascript

// set a cookie with a default expiry of a week
function setCookie (name, value, days = 7) {
  const maxAge = days ? `; max-age=${days * dayms}` : ''
  document.cookie = `${name}=${encodeURIComponent(value)}${maxAge}; path=/`
}

// get a cookie aspect by name
function getCookie (name) {
  for (const section of document.cookie.split(';')) {
    const [rawName, rawValue] = section.split('=')
    const thisName = rawName.trim()
    if (name === thisName) return decodeURIComponent(rawValue)
  }
}

// returns the current JWT or null
function getCurrentJWT () {
  const result = getCookie('current-user')
  if (result) return JSON.parse(result)
}

export class Api {
  static fromBaseURL (baseURL, options = {}) {
    return new Api(axios.create({
      baseURL,
      responseType: 'json',
      ...options }))
  }

  constructor (axios) {
    this.axios = axios
  }

  async createUser ({ id, username, password }) {
    return this.axios.post('/v1/auth/create', {
      id,
      username: btoa(username),
      password: btoa(password)
    })
  }

  async login ({ username, password }) {
    const { data } = await this.axios.post('/v1/auth/login', btoa(`${username}:${password}`))
    setCookie('current-user', JSON.stringify(data))
  }
}
