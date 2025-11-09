import * as core from "@actions/core";
import type { GitHubJobsResponse } from "./types";

async function getFailedSteps(token: string): Promise<string> {
  // Fetch jobs for this run
  const url =
    `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}` +
    `/actions/runs/${process.env.GITHUB_RUN_ID}/jobs`;

  const jobsRes = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!jobsRes.ok) {
    const txt = await jobsRes.text();
    throw new Error(`Failed to fetch job data: ${jobsRes.status} ${txt}`);
  }

  const jobsData: GitHubJobsResponse = await jobsRes.json();

  // Find current job
  const job = jobsData.jobs.find((j) => j.name === process.env.GITHUB_JOB);

  // Get failed steps
  const failedSteps =
    job?.steps
      ?.filter((s) => s.conclusion === "failure")
      ?.map((s) => `❌ ${s.name}`)
      ?.join("\n") || "Unknown";

  return failedSteps;
}

async function run(): Promise<void> {
  try {
    const inputs = {
      webhookUrl: core.getInput("webhook-url", { required: true }),
      token: core.getInput("token", { required: true }),
    };
    const repo = process.env.GITHUB_REPOSITORY || "";
    const runId = process.env.GITHUB_RUN_ID;
    const serverUrl = process.env.GITHUB_SERVER_URL;
    const runUrl = `${serverUrl}/${repo}/actions/runs/${runId}`;
    const workflow = process.env.GITHUB_WORKFLOW;
    const jobName = process.env.GITHUB_JOB;
    const ref = process.env.GITHUB_REF || "";
    const headRef = process.env.GITHUB_HEAD_REF;
    const branch = headRef || ref.replace("refs/heads/", "");

    const failedSteps = await getFailedSteps(inputs.token);

    const title = `"${jobName}" failed on ${branch} branch`;
    const description =
      `**Workflow:** ${workflow}\n` +
      `**Job:** ${jobName}\n` +
      `**Failed steps:**\n${failedSteps}` +
      `\n\n` +
      `[View run in GitHub Actions](${runUrl})`;

    const embed = {
      title: title,
      description: description,
      color: 0xff0000,
      timestamp: new Date().toISOString(),
    };

    const payload = {
      username: `GitHub - ${repo?.replace(/discord/gi, "[redacted]")}`,
      avatar_url: "https://github.githubassets.com/favicons/favicon.png",
      embeds: [embed],
    };

    const res = await fetch(inputs.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to send Discord webhook: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    core.info("Discord notification sent.");
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}

run();
