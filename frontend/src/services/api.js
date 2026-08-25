import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Accept': 'application/json',
  },
  timeout: 60000,
});

export default api;
