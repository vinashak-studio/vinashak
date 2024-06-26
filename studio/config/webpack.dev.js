const fs = require("fs");
const path = require("path");
const DotenvConfig = require("dotenv");

const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

let envFile = path.join(__dirname, "../.env");

if (!fs.existsSync(envFile)) {
  envFile = path.join(__dirname, "../.env.development");
}

DotenvConfig.config({ path: envFile });

module.exports = merge(common, {
  // Set the mode to development or production
  mode: "development",

  // Control how source maps are generated
  devtool: "source-map",

  // Spin up a server for quick development
  devServer: {
    historyApiFallback: true,
    open: true,
    compress: true,
    hot: true,
    port: process.env.PORT || 4000,
    proxy: [
      {
        context: ["/api"],
        target: process.env.API_URL || "http://localhost",
        secure: false
      },
      {
        context: ["/documentation"],
        target: process.env.DOCS_URL || "http://localhost:3000",
        secure: false
      }
    ]
  },

  module: {
    rules: [
      // ... other rules
      {
        test: /\.[js]sx?$/,
        exclude: /node_modules/,
        use: [
          // ... other loaders
          {
            loader: require.resolve("babel-loader"),
            options: {
              // ... other options
              plugins: [
                // ... other plugins
                require.resolve("react-refresh/babel")
              ].filter(Boolean)
            }
          }
        ]
      }
    ]
  },
  plugins: [new ReactRefreshWebpackPlugin()].filter(Boolean)
});
