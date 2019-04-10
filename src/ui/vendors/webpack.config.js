const path = require('path');

module.exports = {
  entry: {
    vendor: path.resolve(__dirname, 'vendor.js')
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../../../dist/ui/js'),
    filename: '[name].js'
  }
};
