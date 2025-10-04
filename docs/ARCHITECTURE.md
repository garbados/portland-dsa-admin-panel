# Architecture

The frontend contained in this repo interacts with a backend server that manages state and operations. *In this way, the frontend should be stateless.* It should not interact with any other National or Portland DSA assets.

## Goal

The panel should allows chapter leadership to easily manage how members exist in the organization *internally*. Which is to say, this doesn't directly manage member rolls or member status, but it does allow us to keep track of and update chapter leadership, and chapter leadership to add and remove people as "members" of their Working Groups. This is to simplify a lot of administrative tasks - in particular, permissions on Google Drive folders by using Google Groups (provided the proposal to switch to Google Workspace is accepted). However, in the future it can be used to automate some things like Vaultwarden permissions or Discord invites as well, and potentially serve as a way to "force" certain updates (such as manually trigger a member roll sync, or temporarily adding a member).

In the future, an important feature known as `Pull the Plug` will be implemented. This is an emergency procedure that will attempt to shut down all automated tasks we've implemented in the case our technological infrastructure is severely malfunctioning or ceases working properly and either it must be stopped quickly, or nobody is around that remembers how this works.

## Backend Endpoints

Collated from [API_SPEC.md](./API_SPEC.md):

- `POST   /v1/auth/create`: Create a user.
- `POST   /v1/auth/login`: Login as an existing user.
- `PUT    /v1/auth/update`: Modify a user, including their password.
- `GET    /v1/auth/alive`: Check the current user's session, such as to check if a user is already logged in.
- `GET    /v1/bodies`: Return chapter body IDs. ("Bodies" include committees, working groups, projects, branches, campaigns, etc.)
- `GET    /v1/bodies/info/{id}`: Returns information about a specific chapter body.
- `POST   /v1/bodies/create`: Create a chapter body, including initial membership.
- `PUT    /v1/bodies/update`: Update a chapter body's information, including membership.
- `DELETE /v1/bodies/update`: Delete a chapter body.
- `GET    /v1/members/{id}`: Retrieve information about a member.
- `GET    /v1/members/search`: Find all members matching a given query.
- `PUT    /v1/members/groups/update`: Update an individual member's inclusion in chapter bodies.
- `GET    /v1/members/admins`: List all admin users.

## Client Architecture

- No React. Use [html-alchemist](https://www.npmjs.com/package/html-alchemist) instead.
- `src/constants.js`: Constants and defaults, to centralize them (especially for use in testing).
- `src/api.js`: The backend API adapter. Maps endpoints to methods that use vanilla JS `fetch`.
- `src/templates/`: Directory with files corresponding to static client templates.
- `src/views/`: Directory with files corresponding to interactive client views.
- Testing:
    - [fast-check](https://fast-check.dev/) for function testing.
    - [webdriver](https://webdriver.io/) for browser integration testing.
    - [mocha](https://mochajs.org/) for writing BDD-style tests.
    - [c8](https://github.com/bcoe/c8) for determining test coverage.
    - *N.B.: test coverage is not proof of functionality, but code that is never run in testing is never tested.*
- Deployment:
    - The frontend requires a build step to produce a static artifact.
    - This static artifact can be deployed using Github Actions.
