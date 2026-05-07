package BarefootJS;
use Mojo::Base -base, -signatures;

use Mojo::ByteStream qw(b);
use Mojo::JSON qw(encode_json to_json);
use POSIX ();
use Scalar::Util qw(looks_like_number);

has 'c';       # Mojolicious controller
has 'config';  # Plugin config

# Internal state
has '_scripts' => sub { [] };
has '_script_seen' => sub { {} };
has '_scope_id';
has '_is_child' => 0;
has '_props';

sub new ($class, $c, $config = {}) {
    return $class->SUPER::new(
        c      => $c,
        config => $config,
    );
}

# ---------------------------------------------------------------------------
# Scope & Props
# ---------------------------------------------------------------------------

sub scope_attr ($self) {
    my $scope_id = $self->_scope_id // '';
    return $self->_is_child ? "~$scope_id" : $scope_id;
}

sub props_attr ($self) {
    my $props = $self->_props;
    return '' unless $props && %$props;
    # to_json returns a character string (not bytes) for safe embedding in templates
    my $json = to_json($props);
    return qq{ bf-p='$json'};
}

# ---------------------------------------------------------------------------
# Comment Markers
# ---------------------------------------------------------------------------

sub comment ($self, $text) {
    return "<!--bf-$text-->";
}

sub text_start ($self, $slot_id) {
    return "<!--bf:$slot_id-->";
}

sub text_end ($self) {
    return "<!--/-->";
}

sub scope_comment ($self) {
    my $scope_id = $self->scope_attr;
    my $props_json = '';
    if ($self->_props && %{$self->_props}) {
        $props_json = '|' . to_json($self->_props);
    }
    return "<!--bf-scope:$scope_id$props_json-->";
}

# ---------------------------------------------------------------------------
# Script Registration
# ---------------------------------------------------------------------------

sub register_script ($self, $path) {
    return if $self->_script_seen->{$path};
    $self->_script_seen->{$path} = 1;
    push @{$self->_scripts}, $path;
}

# ---------------------------------------------------------------------------
# Child Component Rendering
# ---------------------------------------------------------------------------

has '_child_renderers' => sub { {} };

sub register_child_renderer ($self, $name, $renderer) {
    $self->_child_renderers->{$name} = $renderer;
}

sub render_child ($self, $name, %props) {
    my $renderer = $self->_child_renderers->{$name};
    die "No renderer registered for child component '$name'" unless $renderer;
    return $renderer->(\%props);
}

# ---------------------------------------------------------------------------
# Script Output
# ---------------------------------------------------------------------------

sub scripts ($self) {
    my @tags;
    for my $path (@{$self->_scripts}) {
        push @tags, qq{<script type="module" src="$path"></script>};
    }
    return join("\n", @tags);
}

# ---------------------------------------------------------------------------
# Streaming SSR (Out-of-Order)
# ---------------------------------------------------------------------------

sub streaming_bootstrap ($self) {
    return q{<script>(function(){function s(id){var a=document.querySelector('[bf-async="'+id+'"]');var t=document.querySelector('template[bf-async-resolve="'+id+'"]');if(!a||!t)return;a.replaceChildren(t.content.cloneNode(true));a.removeAttribute('bf-async');t.remove();requestAnimationFrame(function(){if(window.__bf_hydrate)window.__bf_hydrate()})};window.__bf_swap=s})()</script>};
}

sub async_boundary ($self, $id, $fallback_html) {
    return qq{<div bf-async="$id">$fallback_html</div>};
}

sub async_resolve ($self, $id, $content_html) {
    return qq{<template bf-async-resolve="$id">$content_html</template><script>__bf_swap("$id")</script>};
}

# ---------------------------------------------------------------------------
# JS-compat callees (#1189) — invoked from generated Mojo templates as
# <%= bf->json($val) %>, <%= bf->floor($val) %>, etc. The MojoAdapter's
# `templatePrimitives` registry emits these helper calls in place of the
# corresponding JS callees (`JSON.stringify`, `Math.floor`, …) so the SSR
# template can render value-equivalent output without a JS engine.
#
# Failure policy mirrors the Go adapter (#1188): user-data marshalling
# (json) bubbles errors so Mojolicious aborts loudly on cycles /
# unsupported values rather than silently producing an empty payload.
# Numeric coercion follows JS semantics (NaN propagates as the special
# string 'NaN'; non-numeric input returns 'NaN' rather than 0). Strings
# always coerce to a string representation.
# ---------------------------------------------------------------------------

sub json ($self, $value) {
    # Mojo::JSON::to_json returns a character string (not bytes), suitable
    # for embedding in HTML output via Mojo::ByteStream / `<%==`.
    #
    # Documented divergence from JS: JS distinguishes `null` (renders as
    # "null") from `undefined` (`JSON.stringify(undefined)` returns the
    # JS value `undefined`, not a string). Perl has no such distinction
    # — both map to `undef`. We choose the `null` rendering for SSR
    # ergonomics: an unset prop becomes the string "null" rather than
    # the literal text "undefined" or an empty attribute. Matches the
    # `null` case of JS exactly; diverges from the `undefined` case.
    return to_json($value);
}

sub string ($self, $value) {
    # JS `String(v)` mirror. `undef` renders as the empty string here so
    # an unset prop doesn't surface as a literal "undefined" / "null"
    # in user-facing HTML — same divergence the Go adapter documents
    # for `bf_string`.
    return defined $value ? "$value" : '';
}

sub number ($self, $value) {
    # JS `Number(v)` mirror. Non-numeric strings / undef → "NaN" so
    # downstream `floor`/`ceil`/`round` propagate the JS NaN semantics
    # (`Math.floor(NaN) === NaN`). Numeric strings coerce via Perl's
    # implicit numeric context.
    return 'NaN' unless defined $value;
    return $value + 0 if looks_like_number($value);
    return 'NaN';
}

sub floor ($self, $value) {
    my $n = $self->number($value);
    return 'NaN' if $n eq 'NaN';
    return POSIX::floor($n);
}

sub ceil ($self, $value) {
    my $n = $self->number($value);
    return 'NaN' if $n eq 'NaN';
    return POSIX::ceil($n);
}

sub round ($self, $value) {
    my $n = $self->number($value);
    return 'NaN' if $n eq 'NaN';
    # POSIX has no `round` (only `floor`/`ceil`). JS `Math.round`
    # rounds half toward +Infinity (so `Math.round(-1.5) === -1`,
    # not -2). `floor(n + 0.5)` reproduces that exact rule for both
    # positive and negative inputs:
    #   Math.round(1.5)   → floor(2.0)  = 2
    #   Math.round(-1.5)  → floor(-1.0) = -1   (JS-faithful tie-break)
    #   Math.round(-1.6)  → floor(-1.1) = -2
    return POSIX::floor($n + 0.5);
}

1;
