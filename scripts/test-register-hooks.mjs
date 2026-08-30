import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === "next/headers") {
            return nextResolve("next/headers.js", context);
        }

        if (specifier.startsWith("@/")) {
            const basePath = path.resolve(
                projectRoot,
                "src",
                specifier.slice(2),
            );
            const sourcePath = [
                `${basePath}.ts`,
                `${basePath}.tsx`,
                path.join(basePath, "index.ts"),
            ].find(existsSync);

            if (!sourcePath) {
                return nextResolve(specifier, context);
            }

            return nextResolve(pathToFileURL(sourcePath).href, context);
        }

        return nextResolve(specifier, context);
    },
});
