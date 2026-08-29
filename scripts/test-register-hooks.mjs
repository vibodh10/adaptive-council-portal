import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.startsWith("@/")) {
            const sourcePath = path.resolve(
                projectRoot,
                "src",
                `${specifier.slice(2)}.ts`,
            );

            return nextResolve(pathToFileURL(sourcePath).href, context);
        }

        return nextResolve(specifier, context);
    },
});
