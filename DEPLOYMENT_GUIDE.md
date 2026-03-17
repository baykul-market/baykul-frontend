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

## 3. GitHub Actions Permissions (GITHUB_TOKEN)

The workflow is configured to securely use the built-in `GITHUB_TOKEN` to push/pull Docker images from the GitHub Container Registry (GHCR). You do not need to create a custom Personal Access Token (PAT).

The necessary permissions are specified within the `.github/workflows/deploy.yml` file:
```yaml
permissions:
  contents: read
  packages: write
```

## 4. GitHub Secrets

In your GitHub repository (or Organization settings), go to **Settings** -> **Secrets and variables** -> **Actions** and add these **Secrets**:

| Secret Name | Description |
| :--- | :--- |
| `HOST_PROD` | The IP address or domain of your Beget VPS. |
| `USERNAME` | Your SSH username (usually `root`). |
| `SSH_KEY` | The **Private** SSH key content from Step 2. |

> [!NOTE]
> **Organization Secrets**: If you have multiple repositories in the same organization, you can add these secrets at the **Organization level** and select "All repositories" or specific ones to share them easily.

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
2.  **Build & Push**: Creates a Docker image and pushes it to GitHub Container Registry (`ghcr.io/your-org/baykul-frontend`).
3.  **Deploy**: 
    - SSHs into your Beget VPS.
    - Pulls the new image.
    - Restarts the container (named `baykul-frontend-prod`) on **port 80**.
    - Cleans up old Docker images to save space.

## 6. Organization Package Permissions

When using a GitHub Organization, you might need to verify package permissions:

1.  Go to the **Packages** tab of your Organization or the repository.
2.  Click on the `baykul-frontend` image.
3.  Go to **Package settings** -> **Manage Actions access**.
4.  Ensure the repository has at least **Write** access if the workflow is pushing images, or ensure the repo is correctly linked.

## Troubleshooting

- **Check Logs**: If a deploy fails, check the "Actions" tab in GitHub for specific error messages.
- **Permission Denied (GHCR)**: If you get "403 Forbidden" when pulling the image on the server, double-check that the `GITHUB_TOKEN` permissions are properly applied in the workflow file (`packages: write`) and review the Organization Package Permissions section to ensure the repository has Write access.
- **Manual Container Check**: On your server, run `docker ps` to see if the container is running or `docker logs baykul-frontend-prod` to see application logs.
