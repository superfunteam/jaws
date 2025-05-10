const fetch = require('node-fetch');

const GITHUB_PAT = process.env.GITHUB_TOKEN; // Changed to GITHUB_TOKEN
const GITHUB_OWNER = 'superfunteam'; // Your GitHub username or organization
const GITHUB_REPO = 'jaws';         // Your GitHub repository name
const WORKFLOW_FILENAME = 'advance_image.yml'; // The filename of your workflow
const GIT_BRANCH = 'main'; // The branch to run the workflow on

const PING_URL = 'https://usetrmnl.com/api/custom_plugins/5d32e6f3-d257-4103-b039-5451b61d86c7';

exports.handler = async function(event, context) {
  let githubActionTriggeredSuccessfully = false;
  let githubActionStatusMessage = "GitHub Action dispatch status unknown";

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
      githubActionTriggeredSuccessfully = true;
      githubActionStatusMessage = "Successfully triggered GitHub Action workflow.";
      // Call pingWebhook before returning success
      await pingWebhook(githubActionTriggeredSuccessfully, githubActionStatusMessage);
      return {
        statusCode: 200,
        body: 'Successfully triggered GitHub Action workflow.'
      };
    } else {
      const responseBody = await response.text();
      console.error(`Failed to trigger GitHub Action. Status: ${response.status}, Body: ${responseBody}`);
      githubActionStatusMessage = `Failed to trigger GitHub Action. Status: ${response.status}, Body: ${responseBody}`;
      // Call pingWebhook before returning failure
      await pingWebhook(githubActionTriggeredSuccessfully, githubActionStatusMessage);
      return {
        statusCode: response.status,
        body: `Failed to trigger GitHub Action: ${responseBody}`
      };
    }
  } catch (error) {
    console.error('Error triggering GitHub Action:', error);
    githubActionStatusMessage = `Error triggering GitHub Action: ${error.message}`;
    await pingWebhook(githubActionTriggeredSuccessfully, githubActionStatusMessage); 
    return {
      statusCode: 500,
      body: `Error triggering GitHub Action: ${error.message}`
    };
  }
};

async function pingWebhook(githubSuccess, githubMessage) {
  if (!PING_URL) return;

  const timestamp = new Date().toISOString();
  const payload = {
    triggerEvent: "Netlify Function Execution",
    workflowTargeted: WORKFLOW_FILENAME,
    branchTargeted: GIT_BRANCH,
    githubDispatchStatus: githubSuccess ? "Success" : "Failure/Error",
    githubDispatchMessage: githubMessage,
    netlifyFunctionTimestamp: timestamp
  };

  try {
    console.log(`Pinging webhook URL: ${PING_URL} with POST data`);
    const pingResponse = await fetch(PING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (pingResponse.ok) { // .ok checks for status 200-299
      console.log(`Webhook POST successful. Status: ${pingResponse.status}`);
    } else {
      const pingResponseBody = await pingResponse.text();
      console.warn(`Webhook ping failed. Status: ${pingResponse.status}, Body: ${pingResponseBody}`);
    }
  } catch (pingError) {
    console.warn(`Error pinging webhook: ${pingError.message}`);
  }
} 