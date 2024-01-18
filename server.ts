import * as Bun from "bun";
import * as path from "path";

const PUBLIC_PATH = path.join(import.meta.dirname, "public");

const watch = Bun.spawn(["bun", "run", "build", "--watch"], {
    stderr: "inherit",
    stdout: "inherit",
});

process.on("exit", () => {
    watch.kill();
});

const server = Bun.serve({
    async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") {
            url.pathname = "/index.html";
        }
        const file = Bun.file(PUBLIC_PATH + url.pathname);
        if (await file.exists()) {
            return new Response(file);
        }
        return new Response("Not found", { status: 404 });
    },
});

console.log(`Server running at ${server.url}`);
