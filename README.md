# JWKS Server by Taras Glushko

- `/jwks`: JWKS of non-expired keys
- `/auth` (POST): JWT with `kid`
- `/auth?expired=true`: JWT signed with an expired key and past `exp`

## Deliverables

### Test Client Output
![Test Client](screenshots/test-client.png)

### Test Coverage
![Coverage](screenshots/coverage.png)

## Run
npm i
npm start
