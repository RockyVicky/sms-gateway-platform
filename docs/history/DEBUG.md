# DEBUG.md

When a build, runtime, test, lint, Docker, Android, React Native, NestJS, MongoDB, Redis, or deployment error occurs:

Follow this workflow.

## Step 1 - Investigate

Collect:

* Error message
* Stack trace
* Logs
* Related files
* Related dependencies

Determine:

* Root cause
* Impact
* Affected modules

Do not guess.

## Step 2 - Reproduce

Create a reproducible scenario.

Verify:

* Error occurs consistently
* Reproduction steps documented

## Step 3 - Fix

Implement the smallest safe fix.

Avoid:

* Workarounds
* Temporary patches
* Commenting code out

## Step 4 - Validate

Run:

* Build
* Lint
* Tests

Verify:

* Original bug fixed
* No regressions introduced

## Step 5 - Document

Create:

bug_report.md

Include:

* Root cause
* Files changed
* Fix applied
* Validation results

## Step 6 - Continue

Resume project execution automatically.
