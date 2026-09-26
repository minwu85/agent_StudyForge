# Docker Desktop Setup (Windows)

StudyForge's only Docker dependency is PostgreSQL, defined in the root
[`docker-compose.yml`](../docker-compose.yml). You don't need Docker for the backend or frontend
themselves — just for the database container.

## 1. Install

Download and install Docker Desktop from https://www.docker.com/products/docker-desktop/. It
requires WSL2 on Windows; the installer sets this up for you if it's missing.

## 2. Start Docker Desktop

Docker Desktop is a background service — it must be **running** before `docker` or
`docker compose` commands will work. Launch it once from the Start menu (or
`C:\Users\<you>\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe`) and leave it running in
the background. It stays running across reboots if "Start Docker Desktop when you sign in" is
enabled in its settings (recommended).

**First launch on a new machine:** Docker Desktop may show a Terms of Service / welcome screen
that needs a manual click before its backend (the `com.docker.backend` process and the
`docker-desktop` WSL VM) actually starts — launching the `.exe` from a script isn't enough the
very first time. If `docker info` keeps failing right after installing, open the Docker Desktop
window itself and click through any first-run prompts, then retry.

## 3. Verify it's ready

```bash
docker info
```

If this returns connection info instead of an error like
`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`, Docker is
ready. It can take 30 seconds to a few minutes to fully start after launching, especially the
first time or after a Windows/WSL update.

## 4. Start Postgres for this project

From the repo root:

```bash
docker compose up -d
```

This pulls `pgvector/pgvector:pg16` (first run only — a Postgres 16 image with the pgvector
extension pre-installed, needed for Phase 3's document embeddings) and starts a container named
`studyforge-postgres`, publishing port `5432` on localhost with credentials matching
`backend/.env.example` (`studyforge` / `studyforge`, database `studyforge`). Data persists in a
named Docker volume (`postgres_data`) across restarts.

Check it's healthy:

```bash
docker compose ps
```

Look for `Up ... (healthy)`. If it's stuck on `(health: starting)` for more than ~15 seconds,
check its logs:

```bash
docker compose logs postgres
```

## 5. Stopping / resetting

```bash
docker compose stop        # stop the container, keep data
docker compose down        # remove the container, keep the data volume
docker compose down -v     # remove the container AND wipe all Postgres data
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `docker info` fails with `dockerDesktopLinuxEngine ... cannot find the file` | Docker Desktop isn't running — open it from the Start menu |
| Docker Desktop process starts but `docker info` still fails after a few minutes | Open the Docker Desktop window directly and check for a stuck welcome/update dialog needing a click |
| `wsl -l -v` shows `docker-desktop` as `Stopped` for several minutes after launching Docker Desktop, with no visible dialog to click through | Docker Desktop's own backend service is what's supposed to boot the `docker-desktop` WSL distro and start `dockerd` inside it — on this machine that startup sometimes stalls indefinitely with no error and no dialog. `wsl -d docker-desktop -- echo ready` will flip the distro's state to `Running`, but **this is a false positive**: it only spins the distro up transiently for that one command (no `dockerd` inside it), and `wsl -l -v` reports `Stopped` again seconds later. It is not a fix — don't be misled by it. The actual fix is restarting Docker Desktop's backend service: quit Docker Desktop completely (tray icon → Quit, not just closing the window) and relaunch it; if that doesn't help after a couple of minutes, restart Windows, since a wedged `com.docker.backend` process sometimes doesn't fully release the WSL VM state until reboot. |
| Port `5432` already in use | Another Postgres instance is running locally — stop it, or change the port mapping in `docker-compose.yml` (and `DATABASE_URL` in `backend/.env`) |
