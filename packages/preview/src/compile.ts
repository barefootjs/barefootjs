// Preview compiler pipeline (CSR mode)
//
// Bundles preview files for client-side rendering using esbuild
// with a custom DOM-based JSX runtime.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type Plugin } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = resolve(__dirname, '../../..')
const DIST_DIR = resolve(ROOT_DIR, '.preview-dist')
const JSX_RUNTIME_DIR = __dirname

export interface CompileOptions {
  previewsPath: string
  previewNames: string[]
  componentName: string
}

export interface CompileResult {
  distDir: string
}

export async function compile(options: CompileOptions): Promise<CompileResult> {
  const { previewsPath, previewNames, componentName } = options

  await mkdir(DIST_DIR, { recursive: true })

  // 1. Generate CSS from token JSON
  const { loadTokens, mergeTokenSets, generateCSS } = await import(
    resolve(ROOT_DIR, 'site/shared/tokens/index')
  )
  const baseTokens = await loadTokens(resolve(ROOT_DIR, 'site/shared/tokens/tokens.json'))
  const uiTokens = await loadTokens(resolve(ROOT_DIR, 'site/ui/tokens.json'))
  const mergedTokens = mergeTokenSets(baseTokens, uiTokens)
  const tokensCSS = generateCSS(mergedTokens)
  const globalsCSS = await readFile(resolve(ROOT_DIR, 'site/ui/styles/globals.css'), 'utf-8')
  await writeFile(resolve(DIST_DIR, 'globals.css'), tokensCSS + '\n' + globalsCSS)
  console.log('Generated: .preview-dist/globals.css')

  // 2. Generate UnoCSS
  console.log('Generating UnoCSS...')
  const unocssbin = resolve(__dirname, '../node_modules/.bin/unocss')
  execFileSync(unocssbin, [
    '../../ui/components/**/*.tsx', './**/*.tsx', './dist/**/*.tsx',
    '-o', resolve(DIST_DIR, 'uno.css'),
  ], { cwd: resolve(ROOT_DIR, 'site/ui'), stdio: 'inherit' })
  console.log('Generated: .preview-dist/uno.css')

  // 3. Generate browser entry point that imports previews and mounts them
  const entrySource = generateEntryScript(previewsPath, previewNames)
  const entryPath = resolve(DIST_DIR, '_entry.tsx')
  await writeFile(entryPath, entrySource)

  // 4. Bundle with esbuild using our DOM-based JSX runtime
  console.log('Bundling for browser...')
  await build({
    entryPoints: [entryPath],
    outdir: DIST_DIR,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: false,
    sourcemap: 'inline',
    jsx: 'automatic',
    jsxImportSource: JSX_RUNTIME_DIR,
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    plugins: [jsxRuntimePlugin()],
  })
  console.log('Generated: .preview-dist/_entry.js')

  // 5. Generate index.html
  const html = generateHTML(componentName)
  await writeFile(resolve(DIST_DIR, 'index.html'), html)
  console.log('Generated: .preview-dist/index.html')

  return { distDir: DIST_DIR }
}

function generateEntryScript(previewsPath: string, previewNames: string[]): string {
  const jsxRuntimePath = resolve(JSX_RUNTIME_DIR, 'jsx-runtime.ts')
  const names = previewNames.join(', ')
  return `
import { mount } from '${jsxRuntimePath}'
import { ${names} } from '${previewsPath}'

const previews = { ${names} }
const app = document.getElementById('preview-root')!

for (const [name, Preview] of Object.entries(previews)) {
  const section = document.createElement('div')
  section.className = 'preview-section'
  section.dataset.preview = name

  const title = document.createElement('div')
  title.className = 'preview-title'
  title.textContent = name.replace(/([a-z])([A-Z])/g, '$1 $2')
  section.appendChild(title)

  const content = document.createElement('div')
  mount((Preview as Function)(), content)
  section.appendChild(content)

  app.appendChild(section)
}
`
}

function generateHTML(componentName: string): string {
  const displayName = componentName.charAt(0).toUpperCase() + componentName.slice(1)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${displayName} — Preview</title>
  <link rel="stylesheet" href="/globals.css" />
  <link rel="stylesheet" href="/uno.css" />
  <style>
    body {
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .preview-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .preview-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    #bf-theme-toggle {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,.1);
    }
    #bf-theme-toggle:hover { background: var(--accent); }
    #bf-theme-toggle .sun { display: none; }
    #bf-theme-toggle .moon { display: block; }
    .dark #bf-theme-toggle .sun { display: block; }
    .dark #bf-theme-toggle .moon { display: none; }
  </style>
</head>
<body>
  <h1>${displayName}</h1>
  <div id="preview-root"></div>
  <button id="bf-theme-toggle" type="button" aria-label="Toggle dark mode"
    onclick="var r=document.documentElement;r.classList.add('theme-transition');r.classList.toggle('dark');setTimeout(function(){r.classList.remove('theme-transition')},300)">
    <svg class="sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
    </svg>
    <svg class="moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  </button>
  <script type="module" src="/_entry.js"></script>
</body>
</html>`
}

function jsxRuntimePlugin(): Plugin {
  return {
    name: 'preview-jsx',
    setup(build) {
      build.onLoad({ filter: /\.tsx$/ }, async (args) => {
        let contents = await readFile(args.path, 'utf-8')
        contents = contents.replace(/^['"]use client['"];?\s*\n?/m, '')
        contents = contents.replace(/\/\*\*?\s*@jsxImportSource\s+[^\s*]+\s*\*\//g, '')
        contents = `/** @jsxImportSource ${JSX_RUNTIME_DIR} */\n${contents}`
        return { contents, loader: 'tsx' }
      })
    },
  }
}
