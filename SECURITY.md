# Security Policy

## Scope

DPG v2 is a deterministic password generator. Security-relevant issues may include:

- incorrect password derivation
- unintended non-determinism
- context collisions
- weak or biased character generation
- incorrect Argon2id integration
- accidental secret exposure in logs, UI, or storage

## Reporting a vulnerability

Please do not open a public issue for suspected security vulnerabilities.

Instead, report the issue privately to the repository owner first.

Include:
- a description of the problem
- impact assessment
- reproduction steps
- affected files or functions
- any proposed fix, if available

## Notes

This project is under active development.

Until the browser UI and packaging model are complete and reviewed, users should treat the project as experimental.
