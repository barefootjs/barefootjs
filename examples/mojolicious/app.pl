#!/usr/bin/env perl
use Mojolicious::Lite -signatures;
use lib '../../packages/mojolicious/lib';
use Mojo::JSON qw(true false);

# Load BarefootJS plugin
plugin 'BarefootJS';

# Serve static files (client JS, barefoot.js)
app->static->paths->[0] = app->home->child('dist');

# Serve shared styles
push @{app->static->paths}, app->home->child('../shared');

# Template directory
app->renderer->paths->[0] = app->home->child('dist/templates');

# ---------------------------------------------------------------------------
# In-memory todo storage
# ---------------------------------------------------------------------------

my @todos = (
    { id => 1, text => 'Setup project',     done => false, editing => false },
    { id => 2, text => 'Create components', done => false, editing => false },
    { id => 3, text => 'Write tests',       done => true,  editing => false },
);
my $next_id = 4;

sub reset_todos {
    @todos = (
        { id => 1, text => 'Setup project',     done => false, editing => false },
        { id => 2, text => 'Create components', done => false, editing => false },
        { id => 3, text => 'Write tests',       done => true,  editing => false },
    );
    $next_id = 4;
}

# ---------------------------------------------------------------------------
# Helper: set up bf and render a component
# ---------------------------------------------------------------------------

helper render_component => sub ($c, $component, %opts) {
    my $title    = $opts{title}    // "$component - BarefootJS";
    my $heading  = $opts{heading}  // '';
    my $stash    = $opts{stash}    // {};
    my $children = $opts{children} // {};
    my $props    = $opts{props};     # JSON-serializable props for bf-p attribute

    for my $key (keys %$stash) {
        $c->stash($key => $stash->{$key});
    }

    my $bf = $c->bf;
    my $scope_id = $component . '_' . substr(rand() =~ s/^0\.//r, 0, 6);
    $bf->_scope_id($scope_id);

    # Set props for bf-p attribute (used by client JS for hydration)
    $bf->_props($props) if $props;

    # Register child component renderers
    my $signal_inits = $opts{signal_init} // {};
    for my $child_name (keys %$children) {
        my $child_template = $children->{$child_name};
        my $child_init = $signal_inits->{$child_name};
        $bf->register_child_renderer($child_name, sub {
            my ($props) = @_;
            my $parent_bf = $c->stash->{'bf.instance'};
            my $child_bf = BarefootJS->new($c, {});
            # Use slot ID from IR for scope (client JS uses $c(__scope, 'sN') to find children)
            # Falls back to child component name + random suffix for loop children
            my $slot_id = delete $props->{_bf_slot};
            my $child_scope = $slot_id
                ? $scope_id . '_' . $slot_id
                : $child_template . '_' . substr(rand() =~ s/^0\.//r, 0, 6);
            $child_bf->_scope_id($child_scope);
            $child_bf->_is_child(1);
            # Share script collector with parent
            $child_bf->_scripts($parent_bf->_scripts);
            $child_bf->_script_seen($parent_bf->_script_seen);

            # Compute signal/memo initial values from props
            my %extra;
            %extra = $child_init->($props) if $child_init;

            $c->stash->{'bf.instance'} = $child_bf;
            my $html = $c->render_to_string(
                template => $child_template, %$props, %extra,
            );
            $c->stash->{'bf.instance'} = $parent_bf;
            chomp $html;
            return $html;
        });
    }

    $c->stash(title => $title, heading => $heading);
    $c->render(template => $component, layout => 'default');
};

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

get '/' => sub ($c) {
    $c->render(inline => <<~'HTML');
    <!DOCTYPE html>
    <html>
    <head>
        <title>BarefootJS + Mojolicious Example</title>
        <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
            h1 { color: #333; }
            a { color: #0066cc; }
        </style>
    </head>
    <body>
        <h1>BarefootJS + Mojolicious Example</h1>
        <p>This example demonstrates server-side rendering with Mojolicious and BarefootJS.</p>
        <ul>
            <li><a href="/counter">Counter</a></li>
            <li><a href="/toggle">Toggle</a></li>
            <li><a href="/todos">Todo (@client)</a></li>
            <li><a href="/todos-ssr">Todo (no @client markers)</a></li>
            <li><a href="/ai-chat">AI Chat (Streaming SSR)</a></li>
        </ul>
    </body>
    </html>
    HTML
};

get '/counter' => sub ($c) {
    $c->render_component('Counter',
        props => { initial => 0 },
        stash => {
            count   => 0,
            initial => 0,
            doubled => 0,
        },
        heading => 'Counter Component',
    );
};

get '/toggle' => sub ($c) {
    my $items = [
        { label => 'Setting 1', defaultOn => \1 },
        { label => 'Setting 2', defaultOn => \0 },
        { label => 'Setting 3', defaultOn => \0 },
    ];
    $c->render_component('Toggle',
        children    => { toggle_item => 'ToggleItem' },
        signal_init => {
            toggle_item => sub {
                my ($props) = @_;
                return (on => ($props->{defaultOn} // 0));
            },
        },
        props => { toggleItems => $items },
        stash => { toggleItems => $items },
        heading => 'Toggle Component',
    );
};

get '/form' => sub ($c) {
    $c->render_component('Form',
        props   => {},
        stash   => { accepted => 0 },
        heading => 'Form Example',
    );
};

get '/reactive-props' => sub ($c) {
    $c->render_component('ReactiveProps',
        children => { reactive_child => 'ReactiveChild' },
        props    => {},
        stash    => { count => 0, doubled => 0 },
        heading  => 'Reactive Props Test',
    );
};

get '/conditional-return' => sub ($c) {
    $c->render_component('ConditionalReturn',
        props => { variant => '' },
        stash => { variant => '', count => 0 },
        heading => 'Conditional Return Example',
    );
};

get '/conditional-return-link' => sub ($c) {
    $c->render_component('ConditionalReturn',
        props => { variant => 'link' },
        stash => { variant => 'link', count => 0 },
        heading => 'Conditional Return Example (Link)',
    );
};

get '/todos' => sub ($c) {
    my @current_todos = map { {%$_} } @todos;  # shallow copy
    my $done_count = scalar grep { $_->{done} } @current_todos;

    $c->render_component('TodoApp',
        children => { todo_item => 'TodoItem' },
        props    => { initialTodos => \@current_todos },
        stash    => {
            todos     => \@current_todos,
            newText   => '',
            filter    => 'all',
            doneCount => $done_count,
        },
    );
};

get '/todos-ssr' => sub ($c) {
    my @current_todos = map { {%$_} } @todos;
    my $done_count = scalar grep { $_->{done} } @current_todos;

    $c->render_component('TodoAppSSR',
        children => { todo_item => 'TodoItem' },
        props    => { initialTodos => \@current_todos },
        stash    => {
            todos     => \@current_todos,
            newText   => '',
            filter    => 'all',
            doneCount => $done_count,
        },
    );
};

get '/props-reactivity' => sub ($c) {
    $c->render_component('PropsReactivityComparison',
        children => {
            props_style_child        => 'PropsStyleChild',
            destructured_style_child => 'DestructuredStyleChild',
        },
        signal_init => {
            props_style_child => sub {
                my ($props) = @_;
                return (displayValue => ($props->{value} // 0) * 10);
            },
            destructured_style_child => sub {
                my ($props) = @_;
                return (displayValue => ($props->{value} // 0) * 10);
            },
        },
        props   => {},
        stash   => { count => 1 },
        heading => 'Props Reactivity Comparison',
    );
};

get '/portal' => sub ($c) {
    $c->render_component('PortalExample',
        props   => {},
        stash   => { open => 0 },
        heading => 'Portal Example',
    );
};

# ---------------------------------------------------------------------------
# AI Chat — Streaming SSR Example
# ---------------------------------------------------------------------------

my @mock_chat = (
    { role => 'user',      content => 'BarefootJSとは何ですか？',                                                                          timestamp => '14:01' },
    { role => 'assistant', content => 'BarefootJSは、JSXをMarked Template + Client JSにコンパイルするフレームワークです。Signal-based reactivityをどのバックエンドでも使えるようにします。', timestamp => '14:01' },
    { role => 'user',      content => 'Streaming SSRはどう動きますか？',                                                                     timestamp => '14:02' },
    { role => 'assistant', content => 'Out-of-Order Streamingプロトコルを使います。サーバーはまずfallback UIを送信し、データが準備できたら&lt;template&gt;チャンクを追記します。',              timestamp => '14:02' },
    { role => 'user',      content => 'どのバックエンドで使えますか？',                                                                       timestamp => '14:03' },
    { role => 'assistant', content => 'HTTP chunked transfer encodingをサポートするすべてのバックエンドで動作します。Hono、Go (Echo)、Perl (Mojolicious) などのアダプタが用意されています。',   timestamp => '14:03' },
);

my @mock_suggestions = (
    'コンポーネントの作り方を教えて',
    'Signalの仕組みは？',
    'テストはどう書く？',
);

get '/ai-chat' => sub ($c) {
    my $bf = $c->bf;

    my $skeleton_chat = '<div class="chat-skeleton"><div class="skeleton-msg skeleton-user"><div class="skeleton-line" style="width:60%"></div></div><div class="skeleton-msg skeleton-bot"><div class="skeleton-line" style="width:90%"></div><div class="skeleton-line" style="width:70%"></div></div><div class="skeleton-msg skeleton-user"><div class="skeleton-line" style="width:50%"></div></div><div class="skeleton-msg skeleton-bot"><div class="skeleton-line" style="width:85%"></div><div class="skeleton-line" style="width:60%"></div></div></div>';

    my $skeleton_suggestions = '<div class="suggestions-skeleton"><div class="skeleton-chip"></div><div class="skeleton-chip"></div><div class="skeleton-chip"></div></div>';

    # Send initial page with fallback skeletons (fast TTFB)
    my $initial_html = <<"HTML";
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Chat — Streaming SSR (Mojolicious)</title>
    <link rel="stylesheet" href="/styles/components.css">
    <link rel="stylesheet" href="/styles/ai-chat.css">
    @{[ $bf->streaming_bootstrap ]}
    <style>body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }</style>
</head>
<body>
    <h1>AI Chat — Streaming SSR (Mojolicious)</h1>
    <div class="chat-container">
        @{[ $bf->async_boundary('a0', $skeleton_chat) ]}
        @{[ $bf->async_boundary('a1', $skeleton_suggestions) ]}
        <div class="chat-input-area">
            <input type="text" class="chat-input" placeholder="メッセージを入力..." disabled />
            <button class="chat-send" disabled>送信</button>
        </div>
    </div>
    <p><a href="/">← Back</a></p>
HTML

    $c->write_chunk($initial_html);

    # Resolve suggestions (faster: 0.8s delay)
    Mojo::IOLoop->timer(0.8 => sub {
        my $chips = join '', map { qq{<button class="suggestion-chip">$_</button>} } @mock_suggestions;
        my $suggestions_html = qq{<div class="chat-suggestions">$chips</div>};
        $c->write_chunk($bf->async_resolve('a1', $suggestions_html));
    });

    # Resolve chat history (slower: 1.5s delay)
    Mojo::IOLoop->timer(1.5 => sub {
        my $msgs = join '', map {
            my $role = $_->{role};
            qq{<div class="chat-msg chat-$role"><div class="chat-bubble"><p>$_->{content}</p><time>$_->{timestamp}</time></div></div>};
        } @mock_chat;
        my $chat_html = qq{<div class="chat-messages">$msgs</div>};
        $c->write_chunk($bf->async_resolve('a0', $chat_html));

        # Close the response after all boundaries resolve
        $c->write_chunk('</body></html>' => sub { shift->finish });
    });
};

# ---------------------------------------------------------------------------
# Todo API
# ---------------------------------------------------------------------------

get '/api/todos' => sub ($c) {
    $c->render(json => \@todos);
};

post '/api/todos' => sub ($c) {
    my $input = $c->req->json;
    my $todo = {
        id      => $next_id++,
        text    => $input->{text},
        done    => false,
        editing => false,
    };
    push @todos, $todo;
    $c->render(json => $todo, status => 201);
};

put '/api/todos/:id' => sub ($c) {
    my $id = $c->param('id');
    my $input = $c->req->json;
    for my $todo (@todos) {
        if ($todo->{id} == $id) {
            $todo->{text} = $input->{text} if exists $input->{text};
            $todo->{done} = $input->{done} ? true : false if exists $input->{done};
            return $c->render(json => $todo);
        }
    }
    $c->render(json => { error => 'not found' }, status => 404);
};

del '/api/todos/:id' => sub ($c) {
    my $id = $c->param('id');
    @todos = grep { $_->{id} != $id } @todos;
    $c->rendered(204);
};

post '/api/todos/reset' => sub ($c) {
    reset_todos();
    $c->rendered(200);
};

app->start;

__DATA__

@@ layouts/default.html.ep
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title><%= $title %></title>
    <link rel="stylesheet" href="/styles/components.css">
    <link rel="stylesheet" href="/styles/todo-app.css">
    % if ($heading) {
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    </style>
    % }
</head>
<body>
    % if ($heading) {
    <h1><%= $heading %></h1>
    % }
    <div id="app"><%= content %></div>
    <p><a href="/">← Back</a></p>
    <%== bf->scripts %>
</body>
</html>
