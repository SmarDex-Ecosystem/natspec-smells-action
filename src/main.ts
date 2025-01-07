import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import type * as githubType from "@actions/github/lib/utils";

const events: string[] = ["pull_request", "pull_request_target"];

export async function run() {
	try {
		const updateComment = core.getInput("update-comment") === "true";
		const findingsAmount = await runNatspecSmells();
		const gitHubToken = core.getInput("github-token").trim();

		const hasGithubToken = gitHubToken !== "";
		const isPR = events.includes(github.context.eventName);

		if (hasGithubToken && isPR) {
			const octokit: InstanceType<typeof githubType.GitHub> =
				github.getOctokit(gitHubToken);
			const sha = github.context.payload.pull_request?.head.sha ?? "";
			const shaShort = sha.substr(0, 7);
			const commentHeaderPrefix =
				"### [Natspec smells](https://github.com/defi-wonderland/natspec-smells) of commit";

			const body = generateCommentBody(
				commentHeaderPrefix,
				shaShort,
				sha,
				findingsAmount,
			);

			if (updateComment) {
				await upsertComment(body, commentHeaderPrefix, octokit);
			} else {
				await createComment(body, octokit);
			}
		} else if (!hasGithubToken) {
			core.info(
				"github-token received is empty. Skipping writing a comment in the PR.",
			);
			core.info(
				"Note: This could happen even if github-token was provided in workflow file. It could be because your github token does not have permissions for commenting in target repo.",
			);
		} else if (!isPR) {
			core.info("The event is not a pull request. Skipping writing a comment.");
			core.info(`The event type is: ${github.context.eventName}`);
		}

		core.setOutput("total-smells", findingsAmount);
	} catch (error) {
		core.setFailed((error as Error).message);
	}
}

async function createComment(
	body: string,
	octokit: InstanceType<typeof githubType.GitHub>,
) {
	core.debug("Creating a comment in the PR.");

	await octokit.rest.issues.createComment({
		repo: github.context.repo.repo,
		owner: github.context.repo.owner,
		issue_number: github.context.payload.pull_request?.number ?? 0,
		body,
	});
}

async function upsertComment(
	body: string,
	commentHeaderPrefix: string,
	octokit: InstanceType<typeof githubType.GitHub>,
) {
	const issueComments = await octokit.rest.issues.listComments({
		repo: github.context.repo.repo,
		owner: github.context.repo.owner,
		issue_number: github.context.payload.pull_request?.number ?? 0,
	});

	const existingComment = issueComments.data.find((comment) =>
		comment.body?.includes(commentHeaderPrefix),
	);

	if (existingComment) {
		core.debug(`Updating comment, id: ${existingComment.id}.`);

		await octokit.rest.issues.updateComment({
			repo: github.context.repo.repo,
			owner: github.context.repo.owner,
			comment_id: existingComment.id,
			body,
		});
	} else {
		core.debug("Comment does not exist, a new comment will be created.");
		await createComment(body, octokit);
	}
}

async function runNatspecSmells() {
	let findingsAmount = 0;
	const options = {
		listeners: {
			stderr: (data: Buffer) => {
				const matches = data.toString().match(/.sol:/g);
				if (matches) {
					findingsAmount += matches.length;
				}
			},
		},
	};

	try {
		await exec.exec("npx -y @defi-wonderland/natspec-smells", [], options);
		core.info(`Total smells found: ${findingsAmount}`);
	} catch (error) {
		core.error(`Error running natspec-smells: ${(error as Error).message}`);
	}

	return findingsAmount;
}

function generateCommentBody(
	commentHeaderPrefix: string,
	shaShort: string,
	sha: string,
	findingsAmount: number,
) {
	if (findingsAmount > 0) {
		return `${commentHeaderPrefix} [<code>${shaShort}</code>](${github.context.payload.pull_request?.number}/commits/${sha}) during [${github.context.workflow} #${github.context.runNumber}](../actions/runs/${github.context.runId})
> [!WARNING]
> Natspec smells has found **${findingsAmount} problems** in the code.`;
	}
	return `${commentHeaderPrefix} [<code>${shaShort}</code>](${github.context.payload.pull_request?.number}/commits/${sha}) during [${github.context.workflow} #${github.context.runNumber}](../actions/runs/${github.context.runId})
> [!TIP]
> Natspec smells has not found any problems in the code.`;
}
