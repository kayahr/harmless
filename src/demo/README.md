# Harmless demos

For simplicity the demos in this directory are not using a web bundler. Instead they are loading the scripts as standard ESM using an importmap. But because browsers don't like loading local files by default for security reasons you must access them via a local web server or must start your browser with enabled file access.


## Local webserver

There are many ways to do this. One is this:

* Run `npx local-web-server` in the project root directory.
* Open the demo (for example: http://127.0.0.1:8000/src/demo/hello-world/) in your browser.


## Enable file access in Chrome

Start Chrome like this to open a demo with enabled local file access:

```
google-chrome --allow-file-access-from-files src/demo/hello-world/index.html
```
