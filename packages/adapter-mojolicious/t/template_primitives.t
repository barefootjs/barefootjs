use strict;
use warnings;
use feature 'signatures';
no warnings 'experimental::signatures';

# JS-compat helper coverage (#1189). Mirrors the Go runtime test
# surface so cross-adapter regressions stay symmetric.

use Test::More;
use FindBin qw($Bin);
use lib "$Bin/../lib";

use BarefootJS;

# `BarefootJS->new` requires a controller for the helper plumbing,
# but the JS-compat helpers are pure functions of `$self` + args —
# they don't reach into the controller. A bare hash blessed into
# the package is enough for these unit tests.
my $bf = bless { c => undef, config => {} }, 'BarefootJS';

# ---------------------------------------------------------------------------
# json — mirrors JS JSON.stringify
# ---------------------------------------------------------------------------

is $bf->json({a => 1}),     '{"a":1}',  'json: hash';
is $bf->json([1, 2, 3]),    '[1,2,3]',  'json: array';
is $bf->json('hi'),         '"hi"',     'json: string';
is $bf->json(undef),        'null',     'json: undef → null (JS parity)';

# ---------------------------------------------------------------------------
# string — JS String(v) mirror
# ---------------------------------------------------------------------------

is $bf->string(42),    '42',   'string: int';
is $bf->string('hi'),  'hi',   'string: string passthrough';
is $bf->string(undef), '',     'string: undef → "" (intentional divergence from JS "null"; documented)';

# ---------------------------------------------------------------------------
# number — JS Number(v) mirror; NaN on parse failure
# ---------------------------------------------------------------------------

is $bf->number('3.14'),       3.14, 'number: numeric string';
is $bf->number(42),           42,   'number: integer passthrough';
is $bf->number('not a num'), 'NaN', 'number: non-numeric → NaN';
is $bf->number(undef),        'NaN', 'number: undef → NaN';

# ---------------------------------------------------------------------------
# floor / ceil / round — Math.* mirrors; propagate NaN
# ---------------------------------------------------------------------------

is $bf->floor(3.7),       3,    'floor: 3.7 → 3';
is $bf->floor(-3.2),     -4,    'floor: -3.2 → -4';
is $bf->floor('not'),    'NaN', 'floor: NaN propagates';

is $bf->ceil(3.1),        4,    'ceil: 3.1 → 4';
is $bf->ceil(-3.7),      -3,    'ceil: -3.7 → -3';
is $bf->ceil('not'),     'NaN', 'ceil: NaN propagates';

is $bf->round(3.5),       4,    'round: 3.5 → 4';
is $bf->round(3.4),       3,    'round: 3.4 → 3';
is $bf->round('not'),    'NaN', 'round: NaN propagates';

done_testing;
