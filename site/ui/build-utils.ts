// Matches all relative import styles:
// - Named:      import { foo } from './bar'
// - Default:    import Foo from './bar'
// - Namespace:  import * as Foo from './bar'
// - Mixed:      import Foo, { bar } from './bar'
// - Side-effect: import './bar'
//
// Capture group 1: the relative path (starts with '.' or '..')
export const RELATIVE_IMPORT_RE = /^import\s+(?:.*\s+from\s+)?['"](\.[^'"]+)['"]\s*;?$/gm
