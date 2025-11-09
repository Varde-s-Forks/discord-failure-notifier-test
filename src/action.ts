import type { Endpoints } from "@octokit/types";
import { GitHub } from "@actions/github/lib/utils";
import { Context } from "@actions/github/lib/context";
import process from "node:process";

type GetJobResponse =
  Endpoints["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"]["response"]["data"];

// --- Enhanced GitHub Action Context --------------------------------------------------
class EnhancedContext extends Context {
  get jobCheckRunId() {
    return parseInt(
      process.env.JOB_CHECK_RUN_ID ??
        // WORKAROUND until https://github.com/actions/runner/pull/4053 is merged and released
        process.env.INPUT__JOB_CHECK_RUN_ID ??
        _throw(new Error("Missing environment variable: JOB_CHECK_RUN_ID")),
    );
  }
}
export const context = new EnhancedContext();

/**
 * Get the current job from the workflow run
 * @returns the current job
 */
export async function getCurrentJob(
  octokit: InstanceType<typeof GitHub>,
): Promise<GetJobResponse> {
  const currentJob = await octokit.rest.actions
    .getJobForWorkflowRun({
      ...context.repo,
      job_id: context.jobCheckRunId,
    })
    .catch((error) => {
      throw error;
    })
    .then((res) => res.data);

  return currentJob;
}

/**
 * Throws an error
 * @param error
 */
export function _throw(error: Error): never {
  throw error;
}
