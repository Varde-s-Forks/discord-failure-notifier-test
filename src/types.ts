export interface GitHubStep {
  name: string;
  conclusion: string;
}

export interface GitHubJob {
  name: string;
  steps: GitHubStep[];
}

export interface GitHubJobsResponse {
  jobs: GitHubJob[];
}
