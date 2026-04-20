import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
})

export default api