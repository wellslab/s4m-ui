export default {
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: 'Stemformatics',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
  ],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    //{ src: '~/plugins/plotly.js', ssr: false }
    //{src: '~/plugins/vue-gtag',},
    //{src: '~/plugins/vue-shepherd', mode: 'client'}
  ],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    //'@nuxtjs/google-analytics'
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    'bootstrap-vue/nuxt',
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    '@nuxtjs/dotenv',
    '@nuxtjs/google-analytics'
  ],
  
  bootstrapVue: {
    bootstrapCSS: false, // Or `css: false`
    bootstrapVueCSS: false, // Or `bvCSS: false`
    icons: true,
  },

  server: {
    port: 5002,
    host: '0.0.0.0',
  },

  axios: {
    proxy: true,
  },
  
  proxy: {
    '/api': {
      target: process.env.BASE_API_URL,  // works as long as api server runs on the same localhost
      pathRewrite: {'^/api' : ''},
    },
    '/mygene': {
      target: 'https://mygene.info',
      pathRewrite: {'^/mygene' : ''},
    },
    '/reactome': {
      target: 'https://reactome.org',
      pathRewrite: {'^/reactome' : ''},
    },
  },
  
  auth: {
    strategies: {
      local: {
        endpoints: {
          login: { url:'/api/auth/login', method:'post', propertyName:'token'},
          logout: { url:'/api/auth/logout', method:'delete'},
          user: { url:'/api/auth/user', method:'get', propertyName:false}  // propertyName:false is very important!
        }
      }
    },
    redirect: {
      login: '/datasets/governance',
      logout: '/datasets/governance',
      callback: '/datasets/governance',
      home: '/datasets/governance'
    },
  },
  
  publicRuntimeConfig: {
    // googleAnalytics: {
    //   id: process.env.GOOGLE_ANALYTICS_ID
    // }
  },
  
  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    babel: {  // https://github.com/bootstrap-vue/bootstrap-vue/issues/5627
      compact: true
    }
  },

  googleAnalytics: {
    id: process.env.GOOGLE_ANALYTICS_ID
  },

}
