/**
 * API Configuration for Separated Architecture
 */

// Environment-based API URLs
const API_CONFIG = {
  development: {
    nodeApi: 'http://localhost:5000/api',
    phpApi: 'http://localhost/pathak-bhandar-php/api',
  },
  production: {
    nodeApi: 'https://your-node-api.herokuapp.com/api',
    phpApi: 'https://your-domain.com/php-api/api',
  }
};

const ENV = process.env.NODE_ENV || 'development';
const config = API_CONFIG[ENV];

export const API_ENDPOINTS = {
  // Node.js API endpoints (auth, sessions, business logic)
  auth: {
    login: `${config.nodeApi}/auth/login`,
    register: `${config.nodeApi}/auth/register`,
    profile: `${config.nodeApi}/user/profile`,
  },
  cart: {
    get: `${config.nodeApi}/cart`,
    add: `${config.nodeApi}/cart`,
    update: (id) => `${config.nodeApi}/cart/${id}`,
    delete: (id) => `${config.nodeApi}/cart/${id}`,
  },
  orders: {
    get: `${config.nodeApi}/orders`,
    create: `${config.nodeApi}/orders`,
    getById: (id) => `${config.nodeApi}/orders/${id}`,
  },

  // PHP API endpoints (database operations)
  products: {
    getAll: `${config.phpApi}/products`,
    getById: (id) => `${config.phpApi}/products?id=${id}`,
    create: `${config.phpApi}/products`,
    update: `${config.phpApi}/products`,
    search: (query) => `${config.phpApi}/products?search=${query}`,
    byCategory: (categoryId) => `${config.phpApi}/products?categoryId=${categoryId}`,
    featured: `${config.phpApi}/products?featured=true`,
  },
  categories: {
    getAll: `${config.phpApi}/categories`,
    getById: (id) => `${config.phpApi}/categories?id=${id}`,
    create: `${config.phpApi}/categories`,
    update: `${config.phpApi}/categories`,
  },
  banners: {
    getAll: `${config.phpApi}/banners`,
    create: `${config.phpApi}/banners`,
    update: `${config.phpApi}/banners`,
  }
};

// API client with error handling
export class ApiClient {
  static async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async get(url, headers = {}) {
    return this.request(url, { method: 'GET', headers });
  }

  static async post(url, data, headers = {}) {
    return this.request(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  static async put(url, data, headers = {}) {
    return this.request(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  static async delete(url, headers = {}) {
    return this.request(url, { method: 'DELETE', headers });
  }
}