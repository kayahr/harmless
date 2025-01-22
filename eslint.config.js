import configs from "@kayahr/eslint-config";
import globals from "globals";

export default [
    {
        ignores: [
            "doc",
            "lib"
        ]
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        }
    },
    ...configs,
    {
        rules: {
           "@stylistic/jsx-one-expression-per-line": "off",
           "@stylistic/jsx-wrap-multilines": "off",
           "@stylistic/jsx-closing-tag-location": "off",
           "@stylistic/jsx-function-call-newline": "off",
           "@stylistic/jsx-closing-bracket-location": "off"
        }
    }
];
