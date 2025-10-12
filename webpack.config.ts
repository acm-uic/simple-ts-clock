import path from 'path';
import type webpack from 'webpack';
import 'eslint-webpack-plugin';
import ESLintWebpackPlugin from 'eslint-webpack-plugin';

const config: webpack.Configuration = {
  entry: {
    main: './frontend/main.ts',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|gif|png|ico)$/,
        exclude: /node_modules/,
        loader: 'file-loader',
        options: {
          name: 'public/[name].[ext]',
        },
      },
    ],
  },
  plugins: [new ESLintWebpackPlugin({})],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'public/[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
};

export default config;
