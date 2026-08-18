# Tunisie Booking · Keycloak Professional Theme

Custom professional theme for the Keycloak login page, branded for **Tunisie Booking**.

## Brand colors
| Color | Hex |
|-------|-----|
| Green | `#85B919` |
| Blue  | `#0056B3` |
| Soft Green | `#C2DC8C` |

## Theme structure
```
keycloak-themes/tunisiebooking/
├── login/
│   ├── theme.properties
│   ├── login.ftl
│   └── resources/
│       ├── css/login.css
│       └── img/logo.svg
└── account/
    └── theme.properties
```

## How to activate
The theme is already mounted into the Keycloak container via `docker-compose.yml`
(`./keycloak-themes:/opt/keycloak/themes`).

### 1. Restart Keycloak to load the theme
```bash
docker compose up -d keycloak
```

### 2. Recreate the realm (if it was deleted)
Instead of reconfiguring everything manually, import the provided realm file.
It recreates the realm `tunisie-booking`, the client `nextjs-frontend`, the roles
`user`/`admin`, and automatically sets the `tunisiebooking` login theme.

**Option A — Auto-import via docker-compose (recommended):**
Add the following env var to the `keycloak` service in `docker-compose.yml`:
```yaml
keycloak:
  ...
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
    KEYCLOAK_IMPORT: /opt/keycloak/themes/tunisiebooking/realm-tunisie-booking.json
```
Then restart: `docker compose up -d keycloak`

**Option B — Manual import via Admin Console:**
1. Open `http://localhost:8080` → **Administration Console** (admin / admin)
2. In the top-left, open the realm dropdown → **Create Realm**
3. Click **Import** and select `keycloak-themes/tunisiebooking/realm-tunisie-booking.json`
4. Click **Create**

### 3. Verify the theme is applied
- The realm's **Login Theme** / **Account Theme** are already set to `tunisiebooking`
  (you can double-check in **Realm Settings → Themes**).
- Open the login page: `http://localhost:8080/realms/tunisie-booking/account`
- You should see the brand-new Tunisie Booking login page.

### 4. Recreate your user(s)
Since the realm was deleted, users are gone too. Create your users again:
- **Admin Console → Users → Add user** (and assign the `admin` role)
- Or enable **registration** (already enabled in the imported realm) so users can sign up.

## Customizing further
- **Logo**: replace `login/resources/img/logo.svg` with your own.
- **Colors**: edit `login/resources/css/login.css` (CSS variables at the top).
- **Texts**: edit the FreeMarker strings in `login.ftl`.
