const fetch = require('node-fetch');

const GITHUB_PAT = process.env.GITHUB_TOKEN; // Changed to GITHUB_TOKEN
const GITHUB_OWNER = 'superfunteam'; // Your GitHub username or organization
const GITHUB_REPO = 'jaws';         // Your GitHub repository name
const WORKFLOW_FILENAME = 'advance_image.yml'; // The filename of your workflow
const GIT_BRANCH = 'main'; // The branch to run the workflow on

exports.handler = async function(event, context) {
  if (!GITHUB_PAT) {
    console.error('GITHUB_TOKEN environment variable is not set.'); // Changed message
    return {
      statusCode: 500,
      body: 'Server configuration error: GITHUB_TOKEN missing.' // Changed message
    };
  }

  const dispatchUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILENAME}/dispatches`;

  try {
    console.log(`Attempting to dispatch workflow: ${WORKFLOW_FILENAME} on branch ${GIT_BRANCH}`);
    const response = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: GIT_BRANCH,
        // inputs: { // Add if your workflow_dispatch defines inputs and you want to send them
        //   reason: 'Triggered by Netlify scheduled function'
        // }
      }),
    });

    if (response.status === 204) {
      console.log('Successfully triggered GitHub Action workflow.');
      return {
        statusCode: 200,
        body: 'Successfully triggered GitHub Action workflow.'
      };
    } else {
      const responseBody = await response.text();
      console.error(`Failed to trigger GitHub Action. Status: ${response.status}, Body: ${responseBody}`);
      return {
        statusCode: response.status,
        body: `Failed to trigger GitHub Action: ${responseBody}`
      };
    }
  } catch (error) {
    console.error('Error triggering GitHub Action:', error);
    return {
      statusCode: 500,
      body: `Error triggering GitHub Action: ${error.message}`
    };
  }
}; 