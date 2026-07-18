const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (_, argv) => {
  const production = argv.mode === 'production'
  return {
    mode: production ? 'production' : 'development',
    entry: path.resolve(__dirname, 'src/main.jsx'),
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: production ? 'assets/[name].[contenthash:8].js' : 'assets/[name].js',
      chunkFilename: production ? 'assets/[name].[contenthash:8].chunk.js' : 'assets/[name].chunk.js',
      publicPath: '/',
      clean: true,
    },
    devtool: production ? 'source-map' : 'eval-cheap-module-source-map',
    resolve: { extensions: ['.js', '.jsx'] },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'defaults', modules: false }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: [production ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/[name].[hash:8][ext]' },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'index.html') }),
      new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash:8].css' }),
      new webpack.DefinePlugin({
        'process.env.API_URL': JSON.stringify(process.env.API_URL || '/api'),
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      }),
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          react: { test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/, name: 'react', priority: 20 },
          mui: { test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/, name: 'mui', priority: 15 },
          charts: { test: /[\\/]node_modules[\\/](echarts|zrender)[\\/]/, name: 'charts', priority: 15 },
        },
      },
    },
    devServer: {
      port: 3000,
      host: '0.0.0.0',
      historyApiFallback: true,
      hot: true,
      proxy: [{ context: ['/api'], target: process.env.API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true }],
      client: { overlay: true },
    },
    performance: { hints: production ? 'warning' : false, maxEntrypointSize: 900000, maxAssetSize: 900000 },
  }
}
