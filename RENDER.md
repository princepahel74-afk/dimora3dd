# Deploy DIMORA privately on Render

1. Extract this ZIP. Push its contents to your private GitHub repository so `render.yaml`, `backend/`, and `frontend/` are at the repository root.
2. In Render, open **New > Blueprint** and select the repository. Render reads the included `render.yaml`.
3. Set `DIMORA_OWNER_PASSWORD` to a randomly generated password with at least 24 characters. Keep that password in Render and your password manager.
4. Apply the Blueprint. Once the deploy is live, open the service URL. Use `owner` as the username and the password from step 3. Append `/?preview=garage` to open the Defender preview directly.

The Flask backend runs at the same domain. Its authenticated status endpoint is `/api/health`, and Render checks startup with `/healthz`.

To enable Gemini features, add your `GEMINI_API_KEY` in the service's Render Environment settings. For persistent server-side accounts and projects, set `DATABASE_URL` to your Postgres connection string. The preview runs without either optional setting.
