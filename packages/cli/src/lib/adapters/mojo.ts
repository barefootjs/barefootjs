// Mojolicious (Perl) adapter starter.
//
// Scaffolds a Mojolicious::Lite app with the BarefootJS Perl plugin
// vendored under `./lib`. The plugin sources are inlined into the CLI
// bundle by `scripts/embed-runtimes.mjs` so the scaffold runs without
// depending on a CPAN release of the plugin.

import { execSync } from 'node:child_process'
import type { AdapterTemplate } from '../templates'
import {
  COMPONENTS_MANIFEST_SEED,
  SHARED_COUNTER_TSX,
  STYLES_CSS,
  TOKENS_CSS,
  UNOCSS_DEV_DEPENDENCIES,
  UNO_CSS_PLACEHOLDER,
  unoConfigTs,
} from './shared'
import {
  barefootPluginPmSource,
  barefootPmSource,
} from './runtimes.generated'

const MOJO_BAREFOOT_CONFIG_TS = `import { createConfig } from '@barefootjs/mojolicious/build'

export default createConfig({
  paths: {
    components: 'components/ui',
    tokens: 'tokens',
    meta: 'meta',
  },
  components: ['components'],
  outDir: 'dist',
  adapterOptions: {
    clientJsBasePath: '/static/components/',
    barefootJsPath: '/static/components/barefoot.js',
  },
})
`

const MOJO_APP_PL = `#!/usr/bin/env perl
use Mojolicious::Lite -signatures;
use Mojo::JSON qw(decode_json);
use lib 'lib';

# Load the BarefootJS plugin (vendored under ./lib so the app runs
# without a CPAN release of the plugin yet).
plugin 'BarefootJS';

# Static asset roots:
#   - dist/         — compiled component bundles (served at /static/components)
#   - public/       — handwritten static files (served at /static)
push @{app->static->paths}, app->home->child('public');
push @{app->static->paths}, app->home->child('dist');

# Templates produced by \`barefoot build\`.
app->renderer->paths->[0] = app->home->child('dist/templates');

# In dev mode, drop the template cache so \`barefoot build --watch\`
# changes show up without a full server restart.
if (app->mode eq 'development') {
    app->renderer->cache->max_keys(0);
}

# Mojolicious's built-in static dispatcher does not honour URL prefixes,
# so map \`/static/*\` requests explicitly:
#   - \`/static/components/*\` → \`dist/client/*\` (matches the
#     \`clientJsBasePath: '/static/components/'\` in barefoot.config.ts).
#   - \`/static/*\` → \`public/*\` (the handwritten stylesheets).
get '/static/components/*asset' => sub ($c) {
    $c->reply->static('client/' . ($c->stash('asset') // '')) or $c->reply->not_found;
};
get '/static/*asset' => sub ($c) {
    $c->reply->static($c->stash('asset') // '') or $c->reply->not_found;
};

get '/' => sub ($c) {
    # Initialize the BarefootJS instance for this request so the layout's
    # \`$c->bf->scripts\` call picks up everything the template registers.
    my $bf = $c->bf;
    $bf->_scope_id('Counter_' . substr(rand() =~ s/^0\\.//r, 0, 6));

    # Auto-register every UI registry component the manifest knows
    # about so Counter's \`<%= bf->render_child('button', ...) %>\` and
    # similar calls resolve without per-component wire-up. The
    # \`signal_init\` callbacks supply the SSR defaults for each
    # template variable (until \`barefoot build\` learns to embed them
    # in the manifest itself).
    my $manifest = decode_json(app->home->child('dist/templates/manifest.json')->slurp);
    $bf->register_components_from_manifest($manifest, signal_init => {
        button => sub ($props) {
            return (
                asChild   => $props->{asChild}   // 0,
                variant   => $props->{variant}   // 'default',
                size      => $props->{size}      // 'default',
                className => $props->{className} // '',
                props     => $props->{props}     // {},
            );
        },
        slot => sub ($props) {
            return (
                className => $props->{className} // '',
                props     => $props->{props}     // {},
            );
        },
    });

    # Stash values for every signal/memo Counter.html.ep references.
    # \`barefoot build\` derives variable names directly from the JSX
    # \`createSignal\` / \`createMemo\` declarations (here: \`count\`,
    # \`doubled\`), so the SSR template needs each one set explicitly —
    # client-side hydration takes over once the bundle loads.
    my $initial = 0;
    $c->render(
        template => 'Counter',
        layout   => 'default',
        count    => $initial,
        doubled  => $initial * 2,
    );
};

app->start;

__DATA__

@@ layouts/default.html.ep
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BarefootJS app</title>
    <!-- Link all three sheets so the browser fetches them in parallel —
         chaining via styles.css @import would defer tokens/uno to a
         second round-trip and flash unstyled DOM. tokens first so its
         CSS variables are defined before any rule references them. -->
    <link rel="stylesheet" href="/static/tokens.css">
    <link rel="stylesheet" href="/static/styles.css">
    <link rel="stylesheet" href="/static/uno.css">
</head>
<body>
    <main><%== content %></main>
    %== $c->bf->scripts
</body>
</html>
`

const MOJO_CPANFILE = `# Required Perl deps. Install with: cpanm --installdeps .
requires 'Mojolicious', '>= 9.34';
`

const MOJO_TSCONFIG = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@barefootjs/jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["./components/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", "lib"]
}
`

export const MOJO_ADAPTER: AdapterTemplate = {
  label: 'Mojolicious (Perl, EP templates SSR)',
  port: 3002,
  files: {
    'app.pl': MOJO_APP_PL,
    'cpanfile': MOJO_CPANFILE,
    'lib/BarefootJS.pm': barefootPmSource,
    'lib/Mojolicious/Plugin/BarefootJS.pm': barefootPluginPmSource,
    'barefoot.config.ts': MOJO_BAREFOOT_CONFIG_TS,
    'tsconfig.json': MOJO_TSCONFIG,
    'uno.config.ts': unoConfigTs([
      'components/**/*.tsx',
      'dist/components/**/*.tsx',
    ]),
    'components/Counter.tsx': SHARED_COUNTER_TSX,
    'public/styles.css': STYLES_CSS,
    'public/tokens.css': TOKENS_CSS,
    'public/uno.css': UNO_CSS_PLACEHOLDER,
    'dist/components/manifest.json': COMPONENTS_MANIFEST_SEED,
  },
  scripts: {
    // Build everything once, then run the watchers + Mojolicious's morbo
    // (which auto-reloads on app.pl edits) side-by-side.
    dev: 'barefoot build && unocss && concurrently -k -n build,uno,server -c blue,magenta,green "barefoot build --watch" "unocss --watch" "morbo app.pl -l http://*:3002"',
    build: 'barefoot build && unocss',
    start: 'perl app.pl daemon -l http://*:3002',
  },
  dependencies: {
    '@barefootjs/cli': 'latest',
    '@barefootjs/client': 'latest',
    '@barefootjs/mojolicious': 'latest',
    '@barefootjs/jsx': 'latest',
    '@barefootjs/shared': 'latest',
  },
  devDependencies: {
    ...UNOCSS_DEV_DEPENDENCIES,
    concurrently: '^9.0.0',
    typescript: '^5.6.0',
  },
  prereqWarnings: () => perlPrereqs(),
}

function perlPrereqs(): string[] {
  const warnings: string[] = []
  try {
    execSync('perl --version', { stdio: 'ignore' })
  } catch {
    warnings.push('Perl not found on PATH. Install Perl 5.20+ before `bun run dev`.')
  }
  try {
    execSync('perl -MMojolicious -e1', { stdio: 'ignore' })
  } catch {
    warnings.push(
      'Mojolicious not installed. Run `cpanm --installdeps .` (or `cpan Mojolicious`) before `bun run dev`.',
    )
  }
  return warnings
}
