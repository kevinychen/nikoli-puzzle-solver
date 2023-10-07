const express = require("express");

const app = express();
const port = 8080;

app.use((_req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

app.use(express.static("dist"));
app.use(express.static("public"));
app.use("/penpa-edit", express.static("penpa-edit/docs"));

app.listen(port, () => {
    console.log(`Started server on port ${port}`);
});
