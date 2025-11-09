import * as core from "@actions/core";
import * as github from "@actions/github";
import { getCurrentJob } from "./action";

async function run(): Promise<void> {
  try {
    const inputs = {
      webhookUrl: core.getInput("webhook-url", { required: true }),
      token: core.getInput("token", { required: true }),
    };
    const octokit = github.getOctokit(inputs.token);

    const jobHtmlUrl = await getCurrentJob(octokit);

    const repo = process.env.GITHUB_REPOSITORY || "";
    const workflow = process.env.GITHUB_WORKFLOW;
    const jobName = process.env.GITHUB_JOB;
    const ref = process.env.GITHUB_REF || "";
    const headRef = process.env.GITHUB_HEAD_REF;
    const branch = headRef || ref.replace("refs/heads/", "");

    const title = `"[${jobName}]" failed on ${branch} branch`;
    const description =
      `**Workflow:** ${workflow}\n` +
      `**Job:** ${jobName}\n` +
      `[View run in GitHub Actions](${jobHtmlUrl})`;

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
        `Failed to send Discord webhook: ` +
          `${res.status} ${res.statusText} - ${text}`,
      );
    }

    core.info("Discord notification sent.");
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}

run();
