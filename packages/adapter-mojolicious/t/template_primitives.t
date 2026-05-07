use Test2::V0;

# JS-compat helper coverage (#1189). Mirrors the Go runtime test
# surface so cross-adapter regressions stay symmetric.

use FindBin qw($Bin);
use lib "$Bin/../lib";

use BarefootJS;

# `BarefootJS->new` requires a controller for the helper plumbing,
# but the JS-compat helpers are pure functions of `$self` + args —
# they don't reach into the controller. A bare hash blessed into
# the package is enough for these unit tests.
my $bf = bless { c => undef, config => {} }, 'BarefootJS';

subtest 'json — mirrors JS JSON.stringify' => sub {
    is $bf->json({a => 1}),  '{"a":1}', 'hash';
    is $bf->json([1, 2, 3]), '[1,2,3]', 'array';
    is $bf->json('hi'),      '"hi"',    'string';
    is $bf->json(undef),     'null',    'undef → null (JS parity)';
};

subtest 'string — JS String(v) mirror' => sub {
    is $bf->string(42),    '42', 'int';
    is $bf->string('hi'),  'hi', 'string passthrough';
    # Documented divergence from JS String(null) === "null".
    is $bf->string(undef), '',   'undef → "" (intentional divergence)';
};

subtest 'number — JS Number(v) mirror; NaN on parse failure' => sub {
    is $bf->number('3.14'),      3.14,  'numeric string';
    is $bf->number(42),          42,    'integer passthrough';
    is $bf->number('not a num'), 'NaN', 'non-numeric → NaN';
    is $bf->number(undef),       'NaN', 'undef → NaN';
};

subtest 'floor / ceil / round — Math.* mirrors; propagate NaN' => sub {
    is $bf->floor(3.7),    3,     '3.7 → 3';
    is $bf->floor(-3.2),  -4,     '-3.2 → -4';
    is $bf->floor('not'), 'NaN',  'NaN propagates';

    is $bf->ceil(3.1),     4,     '3.1 → 4';
    is $bf->ceil(-3.7),   -3,     '-3.7 → -3';
    is $bf->ceil('not'),  'NaN',  'NaN propagates';

    is $bf->round(3.5),    4,     '3.5 → 4';
    is $bf->round(3.4),    3,     '3.4 → 3';
    is $bf->round('not'), 'NaN',  'NaN propagates';
};

done_testing;
