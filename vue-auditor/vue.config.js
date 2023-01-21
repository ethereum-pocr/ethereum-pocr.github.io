const compression = require('compression')
module.exports = {
  chainWebpack: (config) => config.resolve.symlinks(false),
  publicPath: "/",
  pages: {
    'index': {
      entry: "./src/main.js",
      template: "./public/index.html",
      title: "PoCR Net",
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
  },
  configureWebpack: {
    devServer: {
      disableHostCheck: true,
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      before: app => {
        app.set('etag', false);
        app.use(compression());
      }
    }
  }
};
