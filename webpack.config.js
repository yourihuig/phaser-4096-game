const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	mode: 'production',

	entry: {
		app: './src/main.js'
	},

	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'app.bundle.js'
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				include: path.resolve(__dirname, 'src/'),
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['env']
					}
				}
			}
		]
	},

	optimization: {
		minimizer: [
			new UglifyJsPlugin({
				test: /\.js$/
			})
		]
	},

	devServer: {
		contentBase: path.resolve(__dirname, 'build')
	},

	plugins: [
		new CopyWebpackPlugin([
			{
			  from: path.resolve(__dirname, 'index.html'),
			  to: path.resolve(__dirname, 'build')
			},
			{	
				from: path.resolve(__dirname, 'src/assets', '**', '*'),
				typeof: path.resolve(__dirname, 'build')
			}
		]),
		new webpack.DefinePlugin({
			'typeof CANVAS_RENDERER': JSON.stringify(true),
			'typeof WEBGL_RENDERER': JSON.stringify(true)
		})
	]
};