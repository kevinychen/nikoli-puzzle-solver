const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    devServer: {
        devMiddleware: { writeToDisk: true },
        headers: {
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
        },
    },
    entry: "./src/index.ts",
    externals: {
        crypto: "var {}",
        fs: "var {}",
        path: "var {}",
        perf_hooks: "var {}",
        worker_threads: "var {}",
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: "ts-loader",
            },
        ],
    },
    node: {
        __filename: true,
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    performance: {
        hints: false,
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: require.resolve("z3-solver/build/z3-built.js"),
                    to: path.resolve(__dirname, "public/z3-built.js"),
                },
                {
                    from: require.resolve("z3-solver/build/z3-built.wasm"),
                    to: path.resolve(__dirname, "public/z3-built.wasm"),
                },
                {
                    from: require.resolve("z3-solver/build/z3-built.worker.js"),
                    to: path.resolve(__dirname, "public/z3-built.worker.js"),
                },
            ],
        }),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
};
