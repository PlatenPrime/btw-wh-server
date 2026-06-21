import fs from "node:fs";
import path from "node:path";
const SRC_ROOT = path.resolve("src");
const LOG_MODULE_IMPORT = "logModuleError.js";
const SKIP_PARTS = ["__tests__", "test/scripts", "globalTeardown.ts"];
function shouldSkip(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    if (!normalized.endsWith(".ts"))
        return true;
    if (normalized.includes(".test.ts"))
        return true;
    return SKIP_PARTS.some((part) => normalized.includes(part));
}
function resolveModuleName(filePath) {
    const rel = path.relative(SRC_ROOT, filePath).replace(/\\/g, "/");
    if (rel.startsWith("modules/")) {
        return rel.split("/")[1] ?? "app";
    }
    if (rel.startsWith("utils/")) {
        return rel.split("/")[1] ?? "utils";
    }
    if (rel.startsWith("constants/")) {
        return "constants";
    }
    return "app";
}
function resolveImportPath(filePath) {
    const fileDir = path.dirname(filePath);
    const loggingDir = path.join(SRC_ROOT, "logging");
    let rel = path.relative(fileDir, loggingDir).replace(/\\/g, "/");
    if (!rel.startsWith(".")) {
        rel = `./${rel}`;
    }
    return `${rel}/${LOG_MODULE_IMPORT}`;
}
function collectTsFiles(dir, acc = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectTsFiles(full, acc);
            continue;
        }
        if (shouldSkip(full))
            continue;
        acc.push(full);
    }
    return acc;
}
function ensureImport(source, importPath) {
    const needsWarn = source.includes("logModuleWarn(");
    const needsError = source.includes("logModuleError(");
    if (!needsError && !needsWarn) {
        return source;
    }
    const importLine = `import { logModuleError${needsWarn ? ", logModuleWarn" : ""} } from "${importPath}";`;
    const existingImport = source.match(/import\s+\{([^}]+)\}\s+from\s+"[^"]*logModuleError\.js";/);
    if (existingImport) {
        const names = existingImport[1] ?? "";
        if (needsWarn && !names.includes("logModuleWarn")) {
            return source.replace(existingImport[0], importLine);
        }
        return source;
    }
    const lines = source.split("\n");
    let insertAt = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() ?? "";
        if (line.startsWith("import ") && line.endsWith(";")) {
            insertAt = i + 1;
        }
    }
    lines.splice(insertAt, 0, importLine);
    return lines.join("\n");
}
function migrateContent(source, moduleName) {
    let next = source;
    next = next.replace(/console\.error\(\s*`([^`]+)`\s*,\s*(\w+)\s*\)/g, (_match, message, errVar) => `logModuleError("${moduleName}", ${errVar}, ${JSON.stringify(message)})`);
    next = next.replace(/console\.error\(\s*(["'`])((?:\\.|(?!\1).)*)\1\s*,\s*(\w+)\s*\)/g, (_match, _q, message, errVar) => `logModuleError("${moduleName}", ${errVar}, ${JSON.stringify(message)})`);
    next = next.replace(/console\.error\(\s*(\w+)\s*\)/g, (_match, errVar) => `logModuleError("${moduleName}", ${errVar}, "operation failed")`);
    next = next.replace(/console\.warn\(\s*(["'`])((?:\\.|(?!\1).)*)\1\s*,\s*(\{[\s\S]*?\})\s*\)/g, (_match, _q, message, extra) => `logModuleWarn("${moduleName}", ${JSON.stringify(message)}, ${extra})`);
    next = next.replace(/console\.warn\(\s*(["'`])((?:\\.|(?!\1).)*)\1\s*,\s*(\w+)\s*\)/g, (_match, _q, message, errVar) => `logModuleWarn("${moduleName}", ${JSON.stringify(message)}, { err: ${errVar} })`);
    next = next.replace(/console\.warn\(\s*(["'`])((?:\\.|(?!\1).)*)\1\s*\)/g, (_match, _q, message) => `logModuleWarn("${moduleName}", ${JSON.stringify(message)})`);
    return next;
}
function migrateFile(filePath) {
    const original = fs.readFileSync(filePath, "utf8");
    const hasConsole = /console\.(error|warn)\(/.test(original);
    const needsImport = /logModuleError\(/.test(original) || /logModuleWarn\(/.test(original);
    if (!hasConsole && !needsImport) {
        return false;
    }
    const moduleName = resolveModuleName(filePath);
    let updated = hasConsole ? migrateContent(original, moduleName) : original;
    updated = ensureImport(updated, resolveImportPath(filePath));
    if (updated === original) {
        return false;
    }
    fs.writeFileSync(filePath, updated, "utf8");
    return true;
}
const files = collectTsFiles(SRC_ROOT);
const changed = files.filter(migrateFile);
console.log(`Migrated ${changed.length} files`);
