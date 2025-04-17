# Deployment Instructions for Music Genre Classifier

This document provides detailed instructions for deploying the enhanced Music Genre Classifier application to Netlify.

## What's Included in This Package

The deployment package contains all necessary files for a successful Netlify deployment:

- **src/** - Next.js application source code
- **netlify/** - Serverless functions for audio analysis and rating system
- **public/** - Static assets
- **package.json** - Dependencies and scripts
- **netlify.toml** - Netlify configuration including Python dependencies
- **next.config.js** - Next.js configuration
- **tsconfig.json** - TypeScript configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **postcss.config.mjs** - PostCSS configuration

## Deployment Steps

### 1. Set Up Netlify Account

1. Go to [netlify.com](https://www.netlify.com/) and sign up or log in
2. Create a new team if you don't have one already

### 2. Deploy from Git Repository (Recommended)

1. Push the deployment package to a Git repository (GitHub, GitLab, or Bitbucket)
2. In Netlify dashboard, click "Add new site" → "Import an existing project"
3. Connect to your Git provider and select the repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `out`
5. Click "Deploy site"

### 3. Deploy from Local Files (Alternative)

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Navigate to the deployment directory
3. Run `netlify login` to authenticate
4. Run `netlify deploy` and follow the prompts
5. After testing the draft URL, deploy to production with `netlify deploy --prod`

## Environment Variables

No environment variables are required for basic functionality. However, you can customize the following:

- `NEXT_PUBLIC_API_URL` - URL for the API (defaults to serverless functions)

## Python Dependencies

The Python dependencies are automatically installed by Netlify during deployment as specified in the netlify.toml file:

```
numpy==1.24.3
librosa==0.10.1
matplotlib==3.7.2
```

## Testing After Deployment

1. Visit your deployed site URL
2. Upload an audio file to test the genre classification
3. Verify that the rating system works by submitting feedback
4. Test sharing functionality

## Troubleshooting

### Common Issues

1. **Python Dependencies Fail to Install**
   - Check Netlify build logs
   - Ensure Python version is set to 3.10 in netlify.toml

2. **Serverless Functions Timeout**
   - Audio processing may take longer than the default 10s timeout
   - Increase function timeout in Netlify dashboard: Site settings → Functions → Serverless functions

3. **File Upload Issues**
   - Check file size limits (default 10MB)
   - Verify supported file formats (MP3, WAV, OGG, M4A)

### Netlify Function Logs

To view logs for debugging:
1. Go to Netlify dashboard → Your site → Functions
2. Click on the function name to view logs

## Maintenance and Updates

### Updating the Model

To update the Python model:
1. Modify the `analyze_audio.py` script in the `netlify/functions/python` directory
2. Redeploy the site

### Adding New Features

1. Develop and test locally
2. Update the deployment package
3. Redeploy to Netlify

## Rating System Data

User ratings are stored in the `netlify/functions/data/ratings.json` file. This data persists across function invocations but may be lost if the function is redeployed. For a production environment, consider using a database service like Netlify's integrated FaunaDB or another external database.

## Integration with eidcoin.online

To integrate this application with eidcoin.online, add the following iframe to your website:

```html
<div style="width: 100%; max-width: 800px; margin: 0 auto;">
    <iframe src="https://your-netlify-site-url.netlify.app" 
            width="100%" 
            height="800px" 
            frameborder="0"
            style="border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    </iframe>
</div>
```

Replace `your-netlify-site-url.netlify.app` with your actual Netlify domain.
