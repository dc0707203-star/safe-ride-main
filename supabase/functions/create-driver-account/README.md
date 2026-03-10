# create-driver-account Edge Function

This function creates or updates a Supabase Auth user (driver) using the service role key.

Deploy

1. Ensure you have the Supabase CLI configured and are in the project directory.
2. Deploy the function:

```bash
supabase functions deploy create-driver-account --project-ref <your-project-ref>
```

3. Ensure environment variables for the function are set (in Supabase UI or using the CLI):
- `SUPABASE_URL` (usually set automatically)
- `SUPABASE_SERVICE_ROLE_KEY` (service role key)
- `ALLOWED_ORIGINS` (comma-separated origins, e.g. `http://localhost:8080`)

Test

Use the included `test.sh` script or `test-client.js` to validate OPTIONS preflight and POST behavior.

Curl example:

```bash
# edit test.sh with your FUNC_HOST and ADMIN_JWT, then run:
./test.sh
```

Node example:

```bash
NODE_FUNC_HOST="https://<YOUR_FUNCS_HOST>" ADMIN_JWT="<ADMIN_JWT>" node test-client.js
```

Notes

- The function requires the caller to be an admin (it verifies the caller's token against `user_roles` table).
- For initial testing you can either call the function from your admin UI (which provides the admin token automatically) or supply an admin user's access token in the test scripts.
