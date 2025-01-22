// Dynamically creating importmap because browsers are not able to load external
// importmap as static JSON and I don't want to inline the mapping in each demo file
const root = "../../..";
const modules = `${root}/node_modules`;
const script = document.createElement("script");
script.type = "importmap";
script.textContent = JSON.stringify({
    imports: {
        "symbol-observable": `${modules}/symbol-observable/es/index.js`,
        "@kayahr/observable": `${modules}/@kayahr/observable/lib/main/index.js`,
        "@kayahr/signal": `${modules}/@kayahr/signal/lib/main/index.js`,
        "@kayahr/cdi": `${modules}/@kayahr/cdi/lib/main/index.js`,
        "@kayahr/harmless/jsx-runtime": `${root}/lib/main/jsx-runtime.js`,
        "@kayahr/harmless": `${root}/lib/main/index.js`
    }
});
document.currentScript.after(script);
