// Dependency-free regex patterns shared across build tools.

/**
 * Matches all relative import styles in compiled client JS:
 * named, default, namespace, mixed, and side-effect.
 * Capture group 1: the relative path (starts with '.' or '..').
 */
export const RELATIVE_IMPORT_RE = /^import\s+(?:.*\s+from\s+)?['"](\.[^'"]+)['"]\s*;?$/gm
