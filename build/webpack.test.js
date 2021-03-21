const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
      main: path.resolve(__dirname, '../src/example.js'),
    },
    output: {
        filename: "[name].[chunkhash:8].js",
        path: path.resolve(__dirname, '../dist'),
        publicPath: ''
    },
    devServer: {
        contentBase: path.join(__dirname, '../dist'),
        compress: true,
        open: false,
        port: 9000
    },
    plugins: [
        // new HtmlWebpackPlugin()
    ]
};