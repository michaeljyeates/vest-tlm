const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const DIST = path.resolve(__dirname, "dist");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: DIST,
    publicPath: DIST,
  },
  devServer: {
    contentBase: DIST,
    port: process.env.PORT || "3000",
    hot: true,
    writeToDisk: true,
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),

    // for build scripts
    new CopyPlugin({
      patterns: [
        {
          flatten: true,
          from: "./src/*",
          globOptions: {
            ignore: ["**/*.js"],
          },
        },
      ],
    }),
  ],
};
