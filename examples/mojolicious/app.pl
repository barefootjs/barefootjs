#!/usr/bin/env perl
use Mojolicious::Lite -signatures;
use lib '../../packages/mojolicious/lib';

# Load BarefootJS plugin
plugin 'BarefootJS';

# Serve static files (client JS, barefoot.js)
app->static->paths->[0] = app->home->child('dist');

# Serve shared styles
push @{app->static->paths}, app->home->child('../shared');

# Template directory
app->renderer->paths->[0] = app->home->child('dist/templates');

# Routes
get '/' => sub ($c) {
    $c->render(inline => <<~'HTML');
    <!DOCTYPE html>
    <html>
    <head>
        <title>BarefootJS + Mojolicious Example</title>
        <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        </style>
    </head>
    <body>
        <h1>BarefootJS + Mojolicious Example</h1>
        <p>This example demonstrates server-side rendering with Mojolicious and BarefootJS.</p>
        <ul>
            <li><a href="/counter">Counter</a></li>
        </ul>
    </body>
    </html>
    HTML
};

get '/counter' => sub ($c) {
    # Set up component props
    $c->stash(
        count   => 0,
        initial => 0,
        doubled => 0,
    );

    # Configure BarefootJS
    my $bf = $c->bf;
    $bf->_scope_id('Counter_' . substr(rand() =~ s/^0\.//r, 0, 6));

    $c->render(
        template => 'Counter',
        layout   => 'default',
    );
};

# Default layout
app->renderer->add_helper(layout => sub { 'default' });

app->start;

__DATA__

@@ layouts/default.html.ep
<!DOCTYPE html>
<html>
<head>
    <title>BarefootJS + Mojolicious</title>
    <link rel="stylesheet" href="/styles/components.css">
</head>
<body>
    <h1>Counter Component</h1>
    <div id="app"><%= content %></div>
    <p><a href="/">← Back</a></p>
    <%== $c->bf->scripts %>
</body>
</html>
