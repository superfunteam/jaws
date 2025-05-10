const fetch = require('node-fetch');

const GITHUB_PAT = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'superfunteam';
const GITHUB_REPO = 'jaws';
const WORKFLOW_FILENAME = 'advance_image.yml';
const GIT_BRANCH = 'main';

const PING_URL = 'https://usetrmnl.com/api/custom_plugins/5d32e6f3-d257-4103-b039-5451b61d86c7';

const IMAGE_LIST_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GIT_BRANCH}/_data/image_list.txt`;
const IMAGE_COUNTER_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GIT_BRANCH}/_data/image_counter.txt`;

async function getCurrentFrameDetails() {
  try {
    const headers = {
      'Authorization': `Bearer ${GITHUB_PAT}`,
      'Accept': 'application/vnd.github.v3.raw', // Ensure raw content
    };

    console.log('Fetching image list from:', IMAGE_LIST_URL);
    const imageListResponse = await fetch(IMAGE_LIST_URL, { headers });
    if (!imageListResponse.ok) throw new Error(`Failed to fetch image_list.txt: ${imageListResponse.status}`);
    const imageListText = await imageListResponse.text();
    const allFrames = imageListText.trim().split('\n').map(line => line.substring(line.lastIndexOf('/') + 1)); // Get basenames

    console.log('Fetching image counter from:', IMAGE_COUNTER_URL);
    const imageCounterResponse = await fetch(IMAGE_COUNTER_URL, { headers });
    if (!imageCounterResponse.ok) throw new Error(`Failed to fetch image_counter.txt: ${imageCounterResponse.status}`);
    const counterText = await imageCounterResponse.text();
    let currentIndex = parseInt(counterText.trim(), 10);

    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= allFrames.length) {
      console.warn(`Invalid counter value (${counterText.trim()}). Defaulting to 0.`);
      currentIndex = 0;
    }

    const currentFrameFilename = allFrames.length > 0 ? allFrames[currentIndex] : null;
    return { currentFrameFilename, currentIndex, totalFrames: allFrames.length };

  } catch (error) {
    console.error('Error fetching frame details:', error.message);
    return { currentFrameFilename: null, currentIndex: null, totalFrames: null, error: error.message };
  }
}

exports.handler = async function(event, context) {
  let githubActionTriggeredSuccessfully = false;
  let githubActionStatusMessage = "GitHub Action dispatch status unknown";
  let frameDetails = { currentFrameFilename: null, currentIndex: null, totalFrames: null, error: null };

  if (!GITHUB_PAT) {
    const errorMsg = 'GITHUB_TOKEN environment variable is not set.';
    console.error(errorMsg);
    // Try to get frame details even if PAT is missing for dispatch, for ping completeness, but it might fail.
    frameDetails = await getCurrentFrameDetails(); 
    await pingWebhook(githubActionTriggeredSuccessfully, errorMsg, frameDetails);
    return { statusCode: 500, body: `Server configuration error: ${errorMsg}` };
  }

  // Get frame details before trying to dispatch or ping
  frameDetails = await getCurrentFrameDetails();

  try {
    console.log(`Attempting to dispatch workflow: ${WORKFLOW_FILENAME} on branch ${GIT_BRANCH}`);
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILENAME}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: GIT_BRANCH }),
    });

    if (response.status === 204) {
      console.log('Successfully triggered GitHub Action workflow.');
      githubActionTriggeredSuccessfully = true;
      githubActionStatusMessage = "Successfully triggered GitHub Action workflow.";
    } else {
      const responseBody = await response.text();
      githubActionStatusMessage = `Failed to trigger GitHub Action. Status: ${response.status}, Body: ${responseBody}`;
      console.error(githubActionStatusMessage);
    }
  } catch (error) {
    githubActionStatusMessage = `Error triggering GitHub Action: ${error.message}`;
    console.error(githubActionStatusMessage);
  }
  
  await pingWebhook(githubActionTriggeredSuccessfully, githubActionStatusMessage, frameDetails);

  return {
    statusCode: githubActionTriggeredSuccessfully ? 200 : 500, // Reflect dispatch success
    body: githubActionStatusMessage
  };
};

async function pingWebhook(githubSuccess, githubMessage, frameDetails) {
  if (!PING_URL) return;

  const timestamp = new Date().toISOString();
  const payload = {
    triggerEvent: "Netlify Function Execution",
    workflowTargeted: WORKFLOW_FILENAME,
    branchTargeted: GIT_BRANCH,
    githubDispatchStatus: githubSuccess ? "Success" : "Failure/Error",
    githubDispatchMessage: githubMessage,
    currentFrame: frameDetails.currentFrameFilename,
    currentIndex: frameDetails.currentIndex,
    totalFrames: frameDetails.totalFrames,
    frameDetailsError: frameDetails.error, // Include any error from fetching frame details
    netlifyFunctionTimestamp: timestamp
  };

  try {
    console.log(`Pinging webhook URL: ${PING_URL} with POST data (including frame details)`);
    const pingResponse = await fetch(PING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (pingResponse.ok) {
      console.log(`Webhook POST successful. Status: ${pingResponse.status}`);
    } else {
      const pingResponseBody = await pingResponse.text();
      console.warn(`Webhook POST failed. Status: ${pingResponse.status}, Body: ${pingResponseBody}`);
    }
  } catch (pingError) {
    console.warn(`Error pinging webhook: ${pingError.message}`);
  }
} 