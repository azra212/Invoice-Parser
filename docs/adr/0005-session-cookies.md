# 0005 Email, password, and a cookie

The API was open. Every caller saw every document.

Registration creates a user and a personal organisation. The password is hashed with bcryptjs at cost 12, the pure-JS bcrypt implementation, so CI and Windows do not need a native module. The session is a JWT in the httpOnly cookie `access_token`, valid for 7 days. The same token is accepted as `Authorization: Bearer` so tests and scripts do not need a browser. `JWT_SECRET` is required and must be at least 16 characters. The process refuses to boot without it.

Document queries filter on `organizationId`. Rows stored before this change have no organisation and stay hidden. There is no migration. Review actions append an audit event with the user, the action, and a field diff when the values changed.
