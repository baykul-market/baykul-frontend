# Deployment Guide: Baykul Frontend

This guide explains how to set up and deploy the Baykul Frontend application to a Beget VPS using the automated GitHub Actions pipeline.

## 1. Server Prerequisites (Beget VPS)

- **Operating System**: Ubuntu 22.04 or newer is recommended.
- **Docker**: Must be installed on the server.
  - *Tip*: You can choose a Beget VPS image that comes with Docker pre-installed.
- **SSH Access**: You must have root or sudo access to the server.

## 2. Security Setup (SSH Keys)

GitHub Actions needs a secure way to talk to your server.

1.  **Generate a Key Pair** (on your local machine):
    ```bash
    ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"
    ```
2.  **Add Public Key to Server**:
    - Copy the contents of the generated `.pub` file.
    - On your Beget VPS, append it to `/root/.ssh/authorized_keys`.
3.  **Save Private Key**: You will need the private key content for GitHub Secrets (Step 4).

## 3. GitHub Personal Access Token (PAT)

Required to push/pull Docker images from the GitHub Container Registry (GHCR).

1.  Go to **GitHub Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2.  Click **Generate new token (classic)**.
3.  **Note**: "GHCR Deploy Token".
4.  **Scopes**: Check `write:packages` (this automatically includes `repo` and `read:packages`).
5.  **Copy the token** immediately.

## 4. Configure GitHub Secrets

In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions** and add these **Repository secrets**:

| Secret Name | Description |
| :--- | :--- |
| `HOST_PROD` | The IP address or domain of your Beget VPS. |
| `USERNAME` | Your SSH username (usually `root`). |
| `SSH_KEY` | The **Private** SSH key content from Step 2. |
| `GHCR_PAT` | The GitHub Personal Access Token from Step 3. |

## 5. Deployment Workflow

The deployment is fully automated via `.github/workflows/deploy.yml`.

### How to trigger a deploy:
1.  Commit your changes.
2.  Push to the `main` branch:
    ```bash
    git push origin main
    ```

### What happens in the pipeline:
1.  **Quality Checks**: Runs `npm ci`, `npm run build`, and `npm run test`.
2.  **Build & Push**: Creates a Docker image and pushes it to GitHub Container Registry.
3.  **Deploy**: 
    - SSHs into your Beget VPS.
    - Pulls the new image.
    - Restarts the container (named `baykul-frontend-prod`) on **port 80**.
    - Cleans up old Docker images to save space.

## Troubleshooting

- **Check Logs**: If a deploy fails, check the "Actions" tab in GitHub for specific error messages.
- **Manual Container Check**: On your server, run `docker ps` to see if the container is running or `docker logs baykul-frontend-prod` to see application logs.
