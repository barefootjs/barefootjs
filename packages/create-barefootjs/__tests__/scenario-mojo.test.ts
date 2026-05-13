// Specification-as-test for `bun create barefootjs --adapter mojo <project-name>`.
//
// Read this file top-to-bottom to learn the mojo-specific scaffold
// surface. The companion `scenario.test.ts` covers the default Hono
// path; this file pins everything that differs when `--adapter mojo`
// is selected:
//
//   - `barefoot.config.ts` targets `@barefootjs/mojolicious/build` and
//     uses `clientJsBasePath: '/static/components/'`.
//   - `app.pl` forwards `/static/*` URLs to the on-disk static paths
//     (Mojolicious's built-in dispatcher does not honour URL prefixes,
//     so the explicit routes are load-bearing — without them every
//     stylesheet and client bundle 404s in the browser).
//   - `lib/BarefootJS.pm` is vendored, `cpanfile` lists Mojolicious,
//     and `app.pl` uses `register_components_from_manifest` so the
//     manifest-driven child rendering works without per-component
//     wire-up.
//
// Run the full scenario locally with the network-reaching gate the
// Hono scenario already uses:
//
//   BAREFOOT_CREATE_INTEGRATION=1 bun test scenario-mojo.test.ts

import { describe, test, expect, beforeAll } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { mktmp, runCreate, type RunResult } from './helpers'

const INTEGRATION = process.env.BAREFOOT_CREATE_INTEGRATION === '1'

describe.skipIf(!INTEGRATION)(
  'Scenario: bun create barefootjs --adapter mojo <project-name>',
  () => {
    let result: RunResult
    let projectDir: string

    beforeAll(() => {
      const cwd = mktmp()
      result = runCreate(['mojo-app', '--adapter', 'mojo'], { cwd })
      projectDir = path.join(cwd, 'mojo-app')
    })

    test('scaffold completes successfully', () => {
      expect(result.exitCode).toBe(0)
    })

    describe('app.pl serves static assets', () => {
      // Mojolicious's built-in static dispatcher does not honour URL
      // prefixes. The scaffold's `barefoot.config.ts` and layout
      // `<link>`s all reference `/static/*` URLs, so `app.pl` needs
      // explicit forwarding routes — without them every stylesheet
      // and client bundle 404s in the browser even though the SSR
      // HTML rendered correctly. Pin both routes here so a refactor
      // to the scaffold's app.pl template doesn't drop either one.
      test('forwards /static/components/* to dist/client/* (clientJsBasePath)', () => {
        const app = readFileSync(path.join(projectDir, 'app.pl'), 'utf-8')
        expect(app).toMatch(/get\s+'\/static\/components\/\*asset'/)
        expect(app).toContain("reply->static('client/'")
      })

      test('forwards /static/* to public/* (handwritten stylesheets)', () => {
        const app = readFileSync(path.join(projectDir, 'app.pl'), 'utf-8')
        expect(app).toMatch(/get\s+'\/static\/\*asset'/)
      })

      test('mounts public/ and dist/ on app->static->paths', () => {
        const app = readFileSync(path.join(projectDir, 'app.pl'), 'utf-8')
        expect(app).toContain("app->home->child('public')")
        expect(app).toContain("app->home->child('dist')")
      })
    })

    describe('mojo wiring', () => {
      test('lib/BarefootJS.pm is vendored', () => {
        expect(existsSync(path.join(projectDir, 'lib', 'BarefootJS.pm'))).toBe(true)
      })

      test('cpanfile lists Mojolicious', () => {
        const cp = readFileSync(path.join(projectDir, 'cpanfile'), 'utf-8')
        expect(cp).toMatch(/Mojolicious/)
      })

      test('app.pl uses register_components_from_manifest', () => {
        const app = readFileSync(path.join(projectDir, 'app.pl'), 'utf-8')
        expect(app).toContain('register_components_from_manifest')
      })

      test('app.pl reads the build-time manifest from dist/templates', () => {
        const app = readFileSync(path.join(projectDir, 'app.pl'), 'utf-8')
        expect(app).toContain("app->home->child('dist/templates/manifest.json')")
      })

      test('barefoot.config.ts targets the mojolicious adapter', () => {
        const cfg = readFileSync(path.join(projectDir, 'barefoot.config.ts'), 'utf-8')
        expect(cfg).toContain("from '@barefootjs/mojolicious/build'")
        expect(cfg).toContain("clientJsBasePath: '/static/components/'")
      })

      test('package.json depends on @barefootjs/mojolicious', () => {
        const pkg = JSON.parse(
          readFileSync(path.join(projectDir, 'package.json'), 'utf-8'),
        ) as { dependencies?: Record<string, string> }
        expect(pkg.dependencies?.['@barefootjs/mojolicious']).toBeTruthy()
      })

      test('layout stylesheets point at /static/*.css', () => {
        // The forwarding `/static/*asset` route serves these from
        // `public/`, so the `<link href>`s in the rendered HTML must
        // match. A drift here would make every page render unstyled.
        const app = readFileSync(path.join(projectDir, 'app.pl'), 'utf-8')
        expect(app).toContain('/static/tokens.css')
        expect(app).toContain('/static/styles.css')
        expect(app).toContain('/static/uno.css')
      })
    })

    describe('next-step instructions', () => {
      test('the printed next-step uses the chosen target directory', () => {
        expect(result.stdout).toContain('cd mojo-app')
      })
    })
  },
)
