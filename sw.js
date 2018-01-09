// SW Version
const version = '1.0'

// Static Cache - App Shell
const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.js'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(`static-${version}`)
    .then( cache => cache.addAll(appAssets))
  )
})

self.addEventListener('activate', event => {
  let cleaned = caches.keys()
  .then(keys => {
    keys.forEach(key => {
      if (key !== `static-${version}` && key.match('static-')) {
        return caches.delete(key)
      }
    })
  })

  event.waitUntil(cleaned)
})

const staticCache = (req, cacheName = `static-${version}`) => {
  return caches.match(req)
  .then(cachedRes => {
    if (cachedRes) { return cachedRes }
    return fetch(req).then(networkRes => {
      caches.open(cacheName)
      .then(cache => cache.put(req, networkRes))

      return networkRes.clone()
    })
  })
}

const fallbackCache = (req) => {
  return fetch(req)
  .then(networkRes => {
    if (!networkRes.ok) { throw 'Fetch Error' }

    caches.open(`static-${version}`)
    .then(cache => cache.put(req, networkRes))

    return networkRes.clone()
  })
  .catch(err => caches.match(req))
}

const cleanGiphyCache = giphys => {
  caches.open('giphy')
  .then(cache => {
    cache.keys()
    .then(keys => {
      keys.forEach(key => {
        if (!giphys.includes(key.url)) { caches.delete(key) }
      })
    })
  })
}

self.addEventListener('fetch', event => {
  if (event.request.url.match(location.origin)) {
    event.respondWith(staticCache(event.request))
  } else if (event.request.url.match('api.giphy.com/v1/gifs/trending')) {
    event.respondWith(fallbackCache(event.request))
  } else if (event.request.url.match('giphy.com/media')) {
    event.respondWith(staticCache(event.request, 'giphy'))
  }
})

self.addEventListener('message', event => {
  if(event.data.action === 'cleanGiphyCache') { cleanGiphyCache(event.data.giphys) }
})
