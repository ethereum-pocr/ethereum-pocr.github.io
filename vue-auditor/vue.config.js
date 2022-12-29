
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
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
};
