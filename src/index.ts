import * as core from "@actions/core";

async function run(): Promise<void> {
  try {
    const webhookUrl = core.getInput("webhook-url", { required: true });
    const repo = process.env.GITHUB_REPOSITORY;
    const runId = process.env.GITHUB_RUN_ID;
    const serverUrl = process.env.GITHUB_SERVER_URL;
    const runUrl = `${serverUrl}/${repo}/actions/runs/${runId}`;
    const workflow = process.env.GITHUB_WORKFLOW;
    const job = process.env.GITHUB_JOB;
    const ref = process.env.GITHUB_REF || "";
    const headRef = process.env.GITHUB_HEAD_REF;
    const branch = headRef || ref.replace("refs/heads/", "");

    const embed = {
      title: `[${repo}] ${workflow} failed on ${branch}`,
      description: `**Job:** ${job}\n**Workflow:** ${workflow}\n[View run in GitHub Actions](${runUrl})`,
      color: 16711680,
      timestamp: new Date().toISOString(),
    };

    const payload = {
      username: `GitHub Action (${repo})`,
      avatar_url: "https://github.githubassets.com/favicons/favicon.png",
      embeds: [embed],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send Discord webhook: ${res.status} ${res.statusText} - ${text}`);
    }

    core.info("Discord notification sent.");
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}

run();
