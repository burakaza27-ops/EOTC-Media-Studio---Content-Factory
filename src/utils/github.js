/**
 * EOTC Media Studio — GitHub Actions Cloud Integration Engine
 * ══════════════════════════════════════════════════════════════
 * Provides bidirectional control over GitHub Actions workflows,
 * allowing the Telegram Bot, CLI, and Web Studio to:
 *  - Trigger workflow dispatches with custom inputs
 *  - Monitor live workflow run status and logs
 *  - Cancel or re-run workflows remotely
 *  - Inspect recent CI/CD artifacts and execution history
 */

import https from 'https';
import { execSync } from 'child_process';

const getEnv = (key) => process.env[key];

export function getGitHubToken() {
  return getEnv('GITHUB_TOKEN') || getEnv('GH_TOKEN') || getEnv('GITHUB_PAT') || null;
}

export function getRepoInfo() {
  // 1. Explicit env var (standard in GitHub Actions)
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    if (owner && repo) return { owner, repo, full: `${owner}/${repo}` };
  }

  // 2. Derive from local git remote
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (remoteUrl) {
      // Matches https://github.com/owner/repo.git or git@github.com:owner/repo.git
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/i);
      if (match) {
        return { owner: match[1], repo: match[2], full: `${match[1]}/${match[2]}` };
      }
    }
  } catch {}

  // 3. Project default fallback
  return {
    owner: 'burakaza27-ops',
    repo: 'EOTC-Media-Studio---Content-Factory',
    full: 'burakaza27-ops/EOTC-Media-Studio---Content-Factory'
  };
}

function ghRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const token = getGitHubToken();
    const payload = body ? JSON.stringify(body) : null;
    
    const headers = {
      'User-Agent': 'EOTC-Media-Studio-Bot',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Status 204 No Content (e.g. successful dispatch)
        if (res.statusCode === 204) {
          return resolve({ ok: true, status: 204 });
        }

        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, data: parsed });
          } else {
            const errorMsg = parsed.message || `GitHub API error (HTTP ${res.statusCode})`;
            reject(new Error(errorMsg));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, raw: data });
          } else {
            reject(new Error(`GitHub HTTP ${res.statusCode}: ${data.substring(0, 150)}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('GitHub API request timed out after 25s'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Trigger GitHub Actions workflow dispatch.
 * @param {string} workflowFile e.g. 'generate-media.yml'
 * @param {object} inputs e.g. { content_type: 'quote', generate_video: 'true' }
 * @param {string} ref branch or tag, default 'main'
 */
export async function dispatchWorkflow(workflowFile = 'generate-media.yml', inputs = {}, ref = 'main') {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured. Please add GITHUB_TOKEN or GH_TOKEN to your .env file or environment.');
  }

  const { owner, repo } = getRepoInfo();
  const endpoint = `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;

  const stringInputs = {};
  for (const [k, v] of Object.entries(inputs)) {
    stringInputs[k] = String(v);
  }

  console.log(`🚀 Dispatching GitHub workflow "${workflowFile}" on ${owner}/${repo} (${ref})...`);
  await ghRequest('POST', endpoint, {
    ref,
    inputs: stringInputs
  });

  return {
    success: true,
    workflow: workflowFile,
    ref,
    inputs: stringInputs,
    dispatchedAt: new Date().toISOString()
  };
}

/**
 * List recent workflow runs for a workflow or the whole repository.
 */
export async function listWorkflowRuns(workflowFile = 'generate-media.yml', limit = 5) {
  const { owner, repo } = getRepoInfo();
  let endpoint = `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=${limit}`;

  const res = await ghRequest('GET', endpoint);
  const runs = res.data?.workflow_runs || [];

  return runs.map(run => ({
    id: run.id,
    name: run.name,
    status: run.status,           // 'queued', 'in_progress', 'completed'
    conclusion: run.conclusion,   // 'success', 'failure', 'cancelled', etc.
    event: run.event,             // 'workflow_dispatch', 'schedule', 'push'
    branch: run.head_branch,
    commitTitle: run.head_commit?.message?.split('\n')[0] || '',
    author: run.triggering_actor?.login || 'unknown',
    authorAvatar: run.triggering_actor?.avatar_url || '',
    htmlUrl: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    durationSeconds: run.updated_at && run.created_at
      ? Math.round((new Date(run.updated_at) - new Date(run.created_at)) / 1000)
      : null
  }));
}

/**
 * Get details of the latest workflow run.
 */
export async function getLatestWorkflowRun(workflowFile = 'generate-media.yml') {
  const runs = await listWorkflowRuns(workflowFile, 1);
  return runs.length > 0 ? runs[0] : null;
}

/**
 * Cancel a running workflow.
 */
export async function cancelWorkflowRun(runId) {
  const token = getGitHubToken();
  if (!token) throw new Error('GITHUB_TOKEN is required to cancel workflows.');

  const { owner, repo } = getRepoInfo();
  const endpoint = `/repos/${owner}/${repo}/actions/runs/${runId}/cancel`;
  await ghRequest('POST', endpoint);
  return { success: true, runId };
}

/**
 * Re-run a failed workflow run.
 */
export async function rerunWorkflow(runId) {
  const token = getGitHubToken();
  if (!token) throw new Error('GITHUB_TOKEN is required to re-run workflows.');

  const { owner, repo } = getRepoInfo();
  const endpoint = `/repos/${owner}/${repo}/actions/runs/${runId}/rerun`;
  await ghRequest('POST', endpoint);
  return { success: true, runId };
}

/**
 * Test GitHub API connection and token permissions.
 */
export async function testGitHubConnection() {
  const token = getGitHubToken();
  const repoInfo = getRepoInfo();

  const result = {
    configured: !!token,
    repo: repoInfo.full,
    authenticated: false,
    username: null,
    rateLimitRemaining: null
  };

  try {
    const endpoint = token ? '/user' : `/repos/${repoInfo.owner}/${repoInfo.repo}`;
    const res = await ghRequest('GET', endpoint);

    result.authenticated = !!token;
    result.username = res.data?.login || (token ? 'authenticated' : 'public-read');
    result.status = 'connected';
    return result;
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
    return result;
  }
}
