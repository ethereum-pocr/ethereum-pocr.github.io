
module.exports = {
  chainWebpack: (config) => config.resolve.symlinks(false),
  publicPath: "/",
  pages: {
    'index': {
      entry: "./src/main.js",
      template: "./public/index.html",
      title: "Home",
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    // 'auth': {
    //   entry: "./src/pages/auth/main.js",
    //   template: "./public/index.html",
    //   title: "AUTH",
    //   chunks: ['chunk-vendors', 'chunk-common', 'auth']
    // },
  },
};
