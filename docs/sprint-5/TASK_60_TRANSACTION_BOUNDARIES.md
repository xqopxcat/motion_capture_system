# Task 60 — Transaction Boundaries

## Request transaction

`get_db_session()` creates one SQLAlchemy Session for an API request.

- dependency entry: open Session;
- repository operations: use the same Session and may `flush`;
- successful response construction: commit once;
- any exception: rollback once;
- always: close Session.

Repositories do not commit. This keeps a service operation atomic and prevents one adapter from committing another adapter's partial work.

## Error semantics

Database integrity failures are translated to repository-layer persistence errors where the service can make a domain/API decision. Unexpected failures propagate to the request boundary and trigger rollback.

The existing failed-finalization path changes status and then raises an HTTP error. Under the request transaction, that status change is rolled back. Task 63 owns the final lifecycle/failure-state rule and must choose an explicit atomic design; Task 60 does not silently invent one.

## Tests

Unit tests explicitly inject in-memory repositories and never enter the runtime PostgreSQL dependency.

PostgreSQL integration tests open a real connection, begin an outer transaction, bind a Session to it and roll the outer transaction back. This provides isolation without runtime/demo seed data or persistent test residue.

