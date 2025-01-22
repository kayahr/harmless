import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

import tsconfig from "./tsconfig.json" with { type: "json" };

export default defineConfig({
    esbuild: {
        // No idea why these two settings are not inherited from tsconfig... So passing them through
        target: tsconfig.compilerOptions.target,
        jsxDev: tsconfig.compilerOptions.jsx === "react-jsxdev"
    },
    resolve: {
        alias: {
            // These aliases force esbuild to load the JSX runtime from the typescript sources instead of using the compiled javascript referenced
            // in the package.json so it matches the sources imported by Vitest in the unit tests. This fixes problems with duplicate symbols during
            // unit tests and broken unit test coverage reports
            "@kayahr/harmless/jsx-runtime": resolve("src/main/jsx-runtime.ts"),
            "@kayahr/harmless/jsx-dev-runtime": resolve("src/main/jsx-runtime.ts")
        }
    },
    test: {
        include: [ "src/test/**/*.test.{ts,tsx}" ],
        reporters: [
            "default",
            [ "junit", { outputFile: "lib/test/junit.xml", suiteName: "harmless tests" } ]
        ],
        env: {
            NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --expose-gc`
        },
        browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            screenshotFailures: false,
            instances: [
                {
                    browser: "chromium",
                    launch: {
                        args: [
                            "--js-flags=--expose-gc"
                        ]
                    }
                }
            ]
        },
        coverage: {
            enabled: true,
            reporter: [ "text-summary", "json", "lcov", "clover", "cobertura", "html" ],
            reportsDirectory: "lib/test/coverage",
            include: [
                "src/main/**/*.{ts,tsx}"
            ]
        }
    }
});
