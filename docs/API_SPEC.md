# Admin Panel Client Spec

**E: After 2025-07-29 I don't think using Bearer header authorization is good because it pulls the token from localStorage, probably going to use secret (httponly+secure flag) cookies instead**

This is a specification for the web API for our admin panel. This is a *minimal* spec, and new features will be added later

- [Admin Panel Client Spec](#admin-panel-client-spec)
  - [If doing all this is too much](#if-doing-all-this-is-too-much)
  - [API Endpoint](#api-endpoint)
    - [Staging mode](#staging-mode)
  - [What exactly does this do?](#what-exactly-does-this-do)
    - [How should this look?](#how-should-this-look)
      - [Member Search Tab](#member-search-tab)
      - [Group Management Tab](#group-management-tab)
      - [Future](#future)
  - [Authentication](#authentication)
    - [JWT](#jwt)
    - [Initial User](#initial-user)
    - [Registration](#registration)
    - [Initial Authorization](#initial-authorization)
    - [Scopes](#scopes)
    - [Changing Passwords](#changing-passwords)
    - [Login Expired](#login-expired)
  - [Managing Groups](#managing-groups)
    - [Requesting Group IDs](#requesting-group-ids)
    - [Requesting Group Info](#requesting-group-info)
    - [Group Roles](#group-roles)
    - [Creating a Group](#creating-a-group)
    - [Updating Group Membership and Info](#updating-group-membership-and-info)
    - [Deleting a Group](#deleting-a-group)
    - [Future Updates](#future-updates)
  - [Managing Users](#managing-users)
    - [Find a specific member](#find-a-specific-member)
    - [Search](#search)
    - [Update Group Membership](#update-group-membership)
    - [Get Admins](#get-admins)
    - [Future Work](#future-work)

All requests can be assumed to be responded to with the proper response codes for the situation (e.g. 200, 403, 503, etc). All requests must happen over TLS/SSL. Finally, all connections will be done via `HTTP/2`, but this may be changed if this cannot be accomplished from the client (or ends up too complex on the server side for some reason).

All bodies are JSON unless specified otherwise.



## If doing all this is too much

Implement in the following order of priority:

- [Initial Authorization](#initial-authorization)
- [JWT](#jwt)
- [Search](#search)
- [Scopes](#scopes)
- [Requesting Group IDs](#requesting-group-ids)
- [Update Group Membership](#update-group-membership)

That's the *absolute* minimum for some level of functionality.

The next priorities should be:

- [Find a specific member](#find-a-specific-member)
- [Requesting Group Info](#requesting-group-info)
- [Updating Group Membership and Info](#updating-group-membership-and-info)

Finally, implement:

- [Registration](#registration)
- [Changing Passwords](#changing-passwords)
- [Creating a Group](#creating-a-group)
- [Deleting a Group](#deleting-a-group)
- [Get Admins](#get-admins)

The reasoning here is managing individual members is the most common usecase, and creating/removing things can be done by manually putting it in the database if it's just for a proof of concept.

## API Endpoint

The base URL is `api.portlanddsa.org/` a direct IP or other handle may be used in the initial staging phase.

### Staging mode

The panel should be able to be put in "staging mode", in this case, all API calls will be send to `staging.api.portlanddsa.org`. This allows us to test things on non-live entities easily. For the initial test period, both endpoints will be staging, but it will matter after it hits production. For redundancy, all JSON bodies, except `auth` endpoints, should also have a `"staging": true` or `"staging": false` entry. Any request sent without a `staging: <true|false>` payload will be interpreted as if `staging: true` were sent (may be changed later in production).

## What exactly does this do?

At a high level, this allows chapter leadership to easily manage how members exist in the organization *internally*. Which is to say, this doesn't directly manage member rolls or member status, but it does allow us to keep track of and update chapter leadership, and chapter leadership to add and remove people as "members" of their Working Groups. This is to simplify a lot of administrative tasks - in particular, permissions on Google Drive folders by using Google Groups (provided the proposal to switch to Google Workspace is accepted). However, in the future it can be used to automate some things like Vaultwarden permissions or Discord invites as well, and potentially serve as a way to "force" certain updates (such as manually trigger a member roll sync, or temporarily adding a member).

In the future, an important feature known as `Pull the Plug` will be implemented. This is an emergency procedure that will attempt to shut down all automated tasks we've implemented in the case our technological infrastructure is severely malfunctioning or ceases working properly and either it must be stopped quickly, or nobody is around that remembers how this works.

### How should this look?

Up to the implementer, but if I may offer a suggestion: have a separate tab for managing groups vs searching users. It's also up to you how to allow admins to grant other leaders admin panel access (as it requires a wordpress role and adding an additional account via the [new user request](#registration)).

I'll describe how each should work below:

#### Member Search Tab

This will allow [searching](#search) for individual members, there should be two search boxes: "Name Search" and "Email Search", make it clear only one needs to be filled out.

After the results are returned, a list of possible candidates will be displayed.

If the user is a **regular group leader**:
- Under each returned member, display a list of all groups that leader manages, with a checkbox that's checked if the member is/is not a member of that group. Clicking that checkbox and hitting "submit" will update that person's membership to that group.

If the user is an **admin**:

- Display a list of *all* groups (we can implement filtering later) with some way to select between "Not a Member", "Member", "Secretary", "Chair", or "Leader" for each.

If the user is a **superadmin**:

- Display their admin and superadmin status, and allow adding/removing with a checkbox.

#### Group Management Tab

Since you can get all groups with [Requesting Group IDs](#requesting-group-ids), you can display this as a dropdown or some other way of selecting them. You're welcome to implement a fuzzy search on local group names (and aliases like "HJWG" for "Health Justice Working Group"), but as a first pass, the simplest method is best. Only display groups that the logged in member has the [Scope](#scopes) to manage.

After you get [Group Info](#requesting-group-info), display a list of all members of the group.

If the user is a **regular group leader**:

- Display the other leaders in some way that they can't be modified, but with their leadership indicated
- Display other members with checkboxes next to their name, leaders may uncheck these boxes and hit "submit" to remove members from the group

If the user is an **admin**:

- Display all members, including leaders with some way to allow them to select between "Not a Member", "Member", "Secretary", "Chair", or "Leader"

#### Future

In the future, it'd be good to merge the concepts and search and add multiple members to the group at once, but as a minimum concept we should do: member tab, group tab, then worry about that later.

## Authentication

Users shouldn't be able to see the admin panel unless they have a given wordpress group. This group should be uniform for all leadership that is authorized to access the panel, the permissions levels themselves will he handled by the panel itself. In addition, if possible to check, a user should not be able to access the console without 2FA enabled.

### JWT

After authenticating for the first time, the client will be passed a JWT token as in [Initial Authorization](#initial-authorization), this is put in a secure+httponly cookie that will be automatically sent by the browser alongside requests, so client handling is not needed (aside from potentially checking cookie expiry).

For simplicity, the JWT `header.payload.signature` body structure will be represented *as only the decoded payload as raw JSON*. Client and server must both encode/sign all bodies (except the initial auth request) with the token. All JWT tokens should be handled with an appropriate middleware library and not hand-coded.

For posterity, the header will always be of the form:

```
{
    "alg:" "<in-use JWT signing algorithm>",
    "typ: "JWT"
}
```

### Initial User

The database will be populated with a couple default users for the developers at `superadmin` permissions. These users can add other users as needed.

### Registration

To register a new user, send the following request:

```
POST /auth/create HTTP/2

{
    "id": "<member id>",
    "username": base64encode(username), 
    "password": base64encode(password)
}
```

This will be given a 401 unless the token sent is that of an `admin` or `superadmin`. For more information on the member ID, please see the [Managing Users](#managing-users) section.

Afterwards the client should proceed to [Initial Authorization](#initial-authorization).

### Initial Authorization

The user will have a username and password to the admin panel. If feasible, this may be their Wordpress username and some associated authentication token to prevent double login friction.

A `Basic Authentication` to the request `/auth/` endpoint will be submitted as such:

```
GET /auth/login HTTP/2
Authorization Basic: base64encode(username:password)
```

In response, the client will receive a response with a [JWT Payload] that may be stored in a browser secret cookie (but should not be stored on the server).

```
HTTP/2 200 OK

{
    "roles": ["scope1", "scope2", {"scope3": "subrole"}] as defined in [scopes](#scopes)"
}
```

[JWT Payload]: https://jwt.io/introduction

### Scopes

Users will have the following potential scopes, all groups can be assumed to not have management permissions of itself or groups above it unless otherwise specified:

`superadmin`: This user may change access to all groups, including leadership roles, admins, *and other superadmins*.
`admin`: This user may change access to all groups, except admins and superadmins.
`chapter:<wg|campaign|project>`: This person is a leader of the given chapter body, and may change access to the groups they control by regular members.

Users may have multiple of these, represented as either a JSON object (in case of nested groups), or just a string (for things like admins).

`[{ "chapter": "Family Agenda"}, {"chapter": "Immigrant Justice"}`

Note that scopes may include bodies in addition to `admin` or `superadmin`:

`["admin", {"chapter": "Immigrant Justice"}, {"chapter": IOC}]"`

In this case, the `chapter` entries may be ignored for permissions purposes, as they already have greater access. The information is included for posterity in case the client wants to use it to display the information in some capacity.

For simplicity, all bodies are considered under `chapter`, WGs, projects, branches, etc. The client should not assume it knows the list of all chapter bodies, to remain flexible in cases where this list may change without having to update both ends.

### Changing Passwords

A password may be changed by submitting a Request of the form:

```
PUT /auth/update HTTP/2

{"old_password": base64encode(old password), "password": base64encode(new password)}
```

This may either be an administrator or the user themself. Further things (password resets, etc) may be implemented at a later date. This may be omitted for the initial proof of concept.

### Login Expired

The client should check for cookie expiry as returned in the `iat` claim of the [initial auth](#initial-authorization) payload, but also may ask the server at any time if a user's token is valid with

```
GET /auth/alive /HTTP/2
```

This will always return a `200` (barring an internal server error or malformed request), with:

```
/HTTP/2 200 OK

{"alive": <true|false>}
```

Accessing any other endpoint with an expired JWT will result in a `403` and require a reauth.

## Managing Groups

This is a minimal implementation of adding and removing people from chapter bodies, and will be added to later. The other half of this is [Managing Users](#managing-users).

### Requesting Group IDs

You may request IDs for various chapter bodies with:

```GET /bodies/ HTTP/2
```

Which will yield:
```
HTTP/2 200 OK

{
    "id-map": {"body1":"id1","body2":id2", ..., "bodyn":"idn"}
}
```

This will always return a full list of IDs, even if the user doesn't have access to them (since it's not sensitive info). It's recommended to cache this as it is unlikely to frequently change.

IDs may always be assumed to be unique - which is to say if the Health Justice Working Group is decommissioned, and then another one is created later, they will have separate IDs.

### Requesting Group Info

Send the following request to get info on a chapter group:

```
GET /bodies/info HTTP/2

{
    "chapter-body": "<id>"
}
```

Assuming the ID is valid, and the user's `scope` includes the ability to manage this group, this will return:

```
HTTP/2 200 OK

{
    "name": "<the group name>",
    "id": "<the group ID - for posterity>
    "members": "[{"<id>": {"name": "<name>", "role": "<role>"}, "<id>": {"name": "<name>", "role": "<role>"}, ..., "<id>": {"name": "<name>", "role": "<role>"}}]"
}
```

See the [Managing Users](#managing-users) section for more info on the User specification and IDs (although they're very similar to Groups), and the [Group Roles](#group-roles) sections for more info on that field.

### Group Roles

Group roles specify what level of access the member has. At the moment the only four values are `chair`, `secretary`, `leader`, and `member`. The `chair`, `secretary`, and `leader`, can manage `member`s, and `(super)admin`s can manage all three.

The data is structured the way it is instead of as dedicated `members:` and `leaders:` lists, in order to provide flexibility if in the future we want different more fine-grained behavior.

### Creating a Group

Send the following request to create a chapter group:

```
POST /bodies/create HTTP/2

{
    "name": "<body name>",
    "members": "[{"<id>": {"name": "<name>", "role": "<role>"}, "<id>": {"name": "<name>", "role": "<role>"}, ..., "<id>": {"name": "<name>", "role": "<role>"}}]"
}
```

The `members` field is **optional**, and only needed if seeding a group with initial members is desired, otherwise members may be added in additional ways.

If there's a success, the response will be:

```
HTTP/2 201 Created

{
    "id": "<group ID>"
}
```

If the group exists, a `403: Conflict` will be returned, in the case where some members could not be added for various reasons, a `207: Multi-Status` will be returned like so:

```
HTTP/2 207 Multi-Status

{
    "id": "<group ID>",
    failed_members: "[{"<id>": {"name": "<name>", "role": "<role>", "reason": "<message>"}, ...}]"
}
```

### Updating Group Membership and Info

The following request modifies a group:

```
PUT /bodies/update HTTP/2

{
    "id": "<group ID>",
    
    "new_name": "<new group name>",

    update_members: [{"<id>": {"name": "<name>", "role": "<role>"}}, ...]
}
```

All fields except `id` are optional and only need to be submitted if an actual change needs to be processed.

In the case that some operations cannot be completed, a response like so will be given:

```
HTTP/2 207 Multi-Status

{
    "id": "<group ID>",

    "rename_failed": "<message>",

    failed_update: "<message>" OR [
        {
            "<id>": {
                "name": "<name>", 
                "current_role": "<role>", 
                "attempted_role": "<role>",
                "not_role_updated": "<err message>",
                "not_removed": "<err message>",
                "not_added": "<err message>"
                }, 
            ...
        }
    ],
}
```

Fields will be **omitted** if they succeeded without error. The `current_role` field is the role the user has if an update to an invalid role was attempted, while `attempted_role` is the malformed or restricted role. The `message`

Note that, for UI purposes, only **(super)admins** may update a group's name, or change roles between membership and leadership.

While this may be used to add a single user, in some contexts managing a single user may be simpler with [Directly adding a single user to a group](#update-group-membership).

### Deleting a Group

To delete a group

```
DELETE /bodies/update HTTP/2

{
    "id": "<group ID>"
}
```

Note that only **(super)admins** may delete a group.

### Future Updates

Future updates to the groups API may include:

1. Micromanaging individual permissions (e.g. Google Drive Edit vs Comment, Vaultwarden, etc)
2. "Mothballing" and "Reviving" a group
3. Allowing the ability to search and add users to the selected group *from the groups tab*, instead of just removing them.

## Managing Users

This is the flipside to [Group Management](#managing-groups), and is used to search for and manage individual members.

### Find a specific member

To get a specific member's info, use:

```
GET /members HTTP/2

{
    "id": "<member ID>",
    "scope": ["<group ID>","<group ID", ...],
}
```

Where `scope` is a filter on the groups the user is looking for. Note that the server will *not* return any membership info that the user does not control (so a WG leader can only see if the returned person is a member of *their* group, an admin can see everything, etc). The `scope` is meant to be an extra check on top of that. 

This will yield:

```
HTTP/2 200 OK

{
    "id": "<member ID>",
    "name": "<member name>",
    "groups": [{"id": "<group ID>", "role": "<role>"}, ...],
    "email": "<email>",
    "admin_level": "<none|admin|superadmin>",
}
```

Directly retrieving multiple users is not supported at this time, but may be added later.

Note that `email` will only be returned if the person performing the search is an `admin` or `superadmin` (because otherwise a WG leader, which is a somewhat low bar, could get the email address of any chapter member). The `admin_level`, despite having a `none` option, will generally be omitted if the user has no admin permissions.

### Search

Sending the following will attempt to find members and all groups they belong to.

```
GET /members/search

{
    "name_fragment": "<any string>",
    "email": "<email>>"
}
```

Both `name_fragment` and `email` are optional, but at least one must be present. This will perform a *fuzzy search* on the name fragment, returning the closest options.

```
HTTP/2 200 OK

{
    "matches": [
        {
            "id": "<id>", 
            "name": "<name>", 
            "groups": [{"id": "<group ID>", "role": "<role>"},...], 
            "email": "<email>",
            "admin_level": "<none|admin|superadmin>"
        },
        ...
    ],

    "expired_matches": <integer>
}
```

The `expired_matches` field will show how many matches were in our database with expired dues, in case someone was searched with an inactive membership.

Note that `email` will only be returned if the person performing the search is an `admin` or `superadmin` (because otherwise a WG leader, which is a somewhat low bar, could get the email address of any chapter member).

### Update Group Membership

You may update an individual member to several groups with:

```
PUT /members/groups/update

{
    "id": "<member ID>",

    groups: [{"id": "<group id>", "role": "<role>", "remove": <true|false>}, ...],
    admin: "<none|admin|superadmin>"
}
```

In the case where one or more failed, a `207`, `403`, or other appropriate value will be returned as necessary as follows:

```
HTTP/2 207 Multi-Status

{
    "id": "<member ID>",

    "rename_failed": "message",

    failed_update: "message" OR [
        {
            "<id>": {
                "name": "<group name>", 
                "current_role": "<role>", 
                "attempted_role": "<role>",
                "not_role_updated": "<err message>",
                "not_removed": "<err message>",
                "not_added": "<err message>"
            }, 
            ...
        }
    ],

    admin: {"former_status": "<none|admin|superadmin>", "attempted_status": "<none|admin|superadmin>", message: "<err message>"}
}
```

Fields will be **omitted** if they succeeded without error. The `current_role` field is the role the user has if an update to an invalid role was attempted, while `attempted_role` is the malformed or restricted role.

If you want to add users to a single group in bulk, use the [Updating Groups](#updating-group-membership-and-info) request.

### Get Admins

You may get all `admin` users with

```
GET /members/admins HTTP/2
```

Which will yield

```
HTTP/2 200 OK

{
    "admins": [{"id": "<id>", "name": "<name>", "admin_type": "<admin|superadmin>", "contact": "<email or discord or>"}]
}
```

This may be requested by all people who can access the admin panel, and will give the best method to contact that person in case of an error, question, or something they need that they can't do themselves. This may also be used by **superadmin**s to manage other admin permissions.

### Future Work

Future member operations past the MVP include: 

1. Temporarily add a member (adds a member until the next member roll update can confirm their membership)
2. Banning a member entirely (removing a member from access to everything - extremely low priority since expulsions rarely happen and members that cancel their dues are removed automatically after the next roll sync)
