import { createServer } from "node:http";

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Auth browser harness</title>
  </head>
  <body>
    <main>
      <h1>Auth browser harness</h1>
      <p id="tenant" aria-live="polite"></p>
      <button id="continue" type="button">Continue</button>
      <p id="result" role="status"></p>
    </main>
    <script>
      const tenant = new URLSearchParams(window.location.search).get("tenant") ?? "missing";
      document.querySelector("#tenant").textContent = "Isolated tenant: " + tenant;
      document.querySelector("#continue").addEventListener("click", () => {
        document.querySelector("#result").textContent = "Ready for " + tenant;
      });
    </script>
  </body>
</html>`;

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(204);
    response.end();
    return;
  }

  response.writeHead(200, {
    "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline'",
    "Content-Type": "text/html; charset=utf-8",
  });
  response.end(PAGE);
});

server.listen(4173, "127.0.0.1");
