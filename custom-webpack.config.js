const path = require("path");

module.exports = (config, options) => {
  config.module.rules.push({
    test: /\.js$/,
    include: [
      path.resolve(__dirname, "node_modules/lit-element"),
      path.resolve(__dirname, "node_modules/lit-html"),
      path.resolve(__dirname, "node_modules/@pharos"),
      path.resolve(__dirname, "node_modules/@popperjs"),
    ],
    use: {
      loader: "babel-loader",
      options: {
        presets: ["@babel/preset-env"],
        plugins: [
          [
            "@babel/plugin-transform-runtime",
            {
              corejs: false,
              helpers: false,
              regenerator: true,
              useESModules: false,
            },
          ],
        ],
      },
    },
  });
  return config;
};
