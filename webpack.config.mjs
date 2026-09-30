import path from "path";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

export default (_env, argv) => {
  return {
    stats: "none", // Полностью отключает вывод статистики
    entry: "./src/main.js",
    cache: {
      type: "filesystem",
      buildDependencies: {
        config: [new URL(import.meta.url).pathname],
      },
    },
    
    output: {
      path: path.resolve(process.cwd(), "dist"),
      filename: "bundle.js",
      chunkFilename: "[name].bundle.js",
      clean: true,
    },

    devServer: {
      compress: true,
      allowedHosts: "all",
      static: false,
      client: {
        logging: "none", // Отключает логи в браузере
        overlay: false, // Отключает оверлей с ошибками
        progress: false, // Отключает индикатор прогресса
      },
      port: 5143,
      host: "0.0.0.0",
      devMiddleware: {
        writeToDisk: true,
        stats: "none", // Отключает статистику devServer
      },
    },

    performance: { 
      hints: false, // Отключает предупреждения о размере бандла
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },

    // Отключаем sourcemaps в production
    devtool: argv.mode === "development" ? "eval-source-map" : false,

    optimization: {
      minimize: argv.mode === "production",
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 6,
            compress: { 
              drop_console: true,
              warnings: false // Отключает предупреждения Terser
            },
            mangle: {
              safari10: true,
            },
            output: { 
              comments: false, 
              beautify: false 
            },
            warnings: false, // Дополнительное отключение предупреждений
          },
          extractComments: false, // Убирает файл с лицензионными комментариями
        }),
      ],
    },

    module: {
      rules: [],
    },
    resolve: {
      extensions: [".js", ".jsx"],
    },

    plugins: [
      new CopyPlugin({
        patterns: [{ from: "public/" }],
      }),

      new HtmlWebpackPlugin({
        template: "./index.ejs",
        hash: true,
        minify: false,
      }),
    ],

    // Дополнительные настройки для подавления предупреждений
    ignoreWarnings: [
      {
        module: /node_modules/, // Игнорировать все предупреждения из node_modules
      },
    ],
  };
};
