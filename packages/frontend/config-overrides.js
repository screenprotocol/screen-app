const { override, addWebpackModuleRule, addWebpackPlugin } = require('customize-cra')
const Dotenv = require('dotenv-webpack')

module.exports = override(
  addWebpackPlugin(new Dotenv()),
  addWebpackModuleRule({
    test: /\.svg$/,
    use: ['@svgr/webpack'],
  }),
  addWebpackModuleRule({
    test: /\.ttf$/,
    use: [
      {
        loader: 'ttf-loader',
        options: {
          name: './fonts/[hash].[ext]', // Output file name and path
        },
      },
    ],
  }),
  addWebpackModuleRule({
    test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',
        },
      },
    ],
  }),
)
