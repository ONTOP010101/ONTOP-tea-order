// service-worker.js
const CACHE_VERSION = 'v2';
const CACHE_NAME = `yuexiang-tea-cache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `yuexiang-tea-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `yuexiang-tea-api-${CACHE_VERSION}`;

// 静态资源缓存列表
const STATIC_ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // 预缓存关键JS文件（构建后会生成具体文件名，这里使用通配符）
  '/js/vendor-*.js',
  '/js/Home-*.js',
  '/js/Category-*.js',
  '/js/ProductDetail-*.js',
  // 预缓存关键CSS文件
  '/assets/index-*.css',
  '/assets/Home-*.css',
  '/assets/Category-*.css',
  '/assets/ProductDetail-*.css'
];

// API缓存配置
const API_CACHE_CONFIG = {
  maxEntries: 50,
  maxAgeSeconds: 300, // 5分钟
  paths: [
    '/api/categories',
    '/api/products',
    '/api/banners',
    '/api/product/hot',
    '/api/product/new'
  ]
};

// 缓存清理配置
const CACHE_CONFIG = {
  maxCacheSize: 10 * 1024 * 1024, // 10MB
  maxCacheAge: 7 * 24 * 60 * 60, // 7天
};

// 安装Service Worker，缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Opened static cache');
        return cache.addAll(STATIC_ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
        return self.skipWaiting();
      })
  );
});

// 激活Service Worker，清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker activated');
      // 立即获取控制权，无需等待旧的Service Worker终止
      return self.clients.claim();
    })
  );
});

// 拦截网络请求，优先使用缓存
self.addEventListener('fetch', (event) => {
  // 跳过非GET请求和浏览器扩展请求
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // 对于API请求，使用网络优先策略
  if (event.request.url.includes('/api')) {
    event.respondWith(
      fetch(event.request, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
        .then((response) => {
          // 只缓存成功的响应
          if (response && response.status === 200) {
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();
            // 缓存API响应
            caches.open(API_CACHE_NAME)
              .then((cache) => {
                // 检查API路径是否在缓存配置中
                const apiPath = event.request.url.split('/api')[1] || '';
                if (API_CACHE_CONFIG.paths.some(path => apiPath.includes(path))) {
                  cache.put(event.request, responseToCache);
                }
              });
          }
          return response;
        })
        .catch(() => {
          // 网络请求失败时，尝试从缓存中获取
          return caches.match(event.request);
        })
    );
  }
  // 对于静态资源，使用缓存优先策略
  else if (event.request.url.includes('/js/') || event.request.url.includes('/assets/') || 
           event.request.url.includes('/vite.svg')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 如果缓存中存在，直接返回
          if (response) {
            return response;
          }
          // 否则，发起网络请求
          return fetch(event.request)
            .then((response) => {
              // 只缓存成功的响应
              if (response && response.status === 200) {
                // 克隆响应，因为响应流只能使用一次
                const responseToCache = response.clone();
                // 缓存新的静态资源
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        })
    );
  }
  // 对于HTML页面，使用网络优先策略，确保获取最新内容
  else if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 只缓存成功的响应
          if (response && response.status === 200) {
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();
            // 缓存HTML响应
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // 网络请求失败时，尝试从缓存中获取
          return caches.match(event.request) || caches.match('/');
        })
    );
  }
  // 对于其他请求，使用缓存优先策略
  else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 如果缓存中存在，直接返回
          if (response) {
            return response;
          }
          // 否则，发起网络请求
          return fetch(event.request)
            .then((response) => {
              return response;
            });
        })
    );
  }
});

// 后台同步，用于离线时的操作
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

// 同步购物车数据
async function syncCart() {
  // 实现购物车数据同步逻辑
  console.log('Syncing cart data...');
}

// 缓存清理功能
async function cleanupCache() {
  try {
    // 清理超过大小限制的缓存
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // 如果缓存项数量超过限制，删除最旧的
      if (requests.length > API_CACHE_CONFIG.maxEntries) {
        // 按时间排序，删除最旧的
        const sortedRequests = requests.sort((a, b) => {
          const dateA = new Date(a.url.split('?t=')[1] || 0);
          const dateB = new Date(b.url.split('?t=')[1] || 0);
          return dateA.getTime() - dateB.getTime();
        });
        
        // 删除多余的缓存项
        const toDelete = sortedRequests.slice(0, requests.length - API_CACHE_CONFIG.maxEntries);
        for (const request of toDelete) {
          await cache.delete(request);
        }
      }
    }
    
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// 定期清理缓存
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupCache());
  }
});

// 消息事件，用于接收来自主线程的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupCache();
  } else if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    // 发送缓存状态到主线程
    caches.keys().then((cacheNames) => {
      event.ports[0].postMessage({ cacheNames });
    });
  }
});

// 推送通知事件（如果需要）
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || '您有新消息',
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '悦享茶歇', options)
    );
  } catch (error) {
    console.error('Push notification failed:', error);
  }
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 如果已有窗口，导航到指定URL
      for (const client of clientList) {
        if (client.url === event.notification.data?.url && 'focus' in client) {
          return client.focus();
        }
      }
      // 如果没有窗口，打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});
