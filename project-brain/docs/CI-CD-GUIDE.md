# CI/CD Pipeline Guide

This document outlines the Continuous Integration and Continuous Deployment workflows for the ProjectBrain application.

## CI Pipeline

Our CI pipeline automatically runs when changes are pushed to the main branch or when a pull request is opened against the main branch. It performs the following tasks:

1. **Linting**: Ensures code follows our style guidelines
2. **Type checking**: Verifies TypeScript typings
3. **Format checking**: Ensures code is properly formatted
4. **Testing**: Runs all unit and integration tests
5. **Building**: Ensures the application builds successfully

### CI Configuration

The CI pipeline is defined in `.github/workflows/ci.yml`. The workflow uses GitHub Actions to automate the process.

## CD Pipeline

Our CD pipeline handles automatic deployments to different environments:

1. **Staging**: Automatically deployed when changes are pushed to the main branch
2. **Production**: Deployed manually through workflow dispatch

### CD Configuration

The CD pipeline is defined in `.github/workflows/cd.yml`. It depends on the CI process passing successfully before proceeding with deployment.

## Environment Setup

The application supports three environments:

- **Development**: Used for local development
- **Staging**: Used for testing before production
- **Production**: Live environment for end users

### Environment Configuration

Environment variables are managed through `.env.[environment].local` files. These files are not checked into version control for security reasons.

To set up environment variables:

```bash
# For development environment
npm run setup:dev

# For staging environment
npm run setup:staging

# For production environment
npm run setup:prod
```

Each command will prompt for the necessary variables with default values.

## Required Secrets

The following secrets need to be configured in your GitHub repository for the CI/CD pipelines to work:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL for the environment
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VERCEL_TOKEN`: API token for Vercel deployments

## Monitoring

Deployment statuses are reported back to GitHub and can be monitored through the Actions tab in the repository.

For production monitoring, we use:

- **Logs**: Available through the Vercel dashboard
- **Error tracking**: Integrated with Sentry
- **Performance monitoring**: Vercel Analytics

## Rollback Procedure

If issues are detected after deployment:

1. Visit the GitHub Actions tab
2. Find the most recent successful deployment
3. Use the "Re-run jobs" option to redeploy the previous version
4. Alternatively, manually revert the commit and push to trigger a new deployment 