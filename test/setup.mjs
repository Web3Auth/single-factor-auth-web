import Register from "@babel/register";

import currentPkg from "../package.json" assert { type: "json" };

const runtimeVersion = currentPkg.peerDependencies["@babel/runtime"];

Register({
  presets: [["@babel/env", { bugfixes: true }], "@babel/typescript"],
  plugins: [
    "@babel/plugin-syntax-bigint",
    "@babel/plugin-transform-object-rest-spread",
    "@babel/plugin-transform-class-properties",
    ["@babel/transform-runtime", { version: runtimeVersion }],
    "@babel/plugin-transform-numeric-separator",
  ],
  sourceType: "unambiguous",
  extensions: [".ts", ".js"],
});
