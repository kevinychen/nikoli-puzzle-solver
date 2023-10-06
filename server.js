const express = require("express");
const path = require("path");

const app = express();
const port = 8080;

app.use((_req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

express.static.mime.define({ "text/javascript": ["js"] });

app.use(express.static("public"));
app.use(express.static("dist"));

app.listen(port, () => {
    console.log(`Started server on port ${port}`);
});
