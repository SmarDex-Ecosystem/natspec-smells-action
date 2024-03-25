const artifact = require('@actions/artifact');
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const glob = require('@actions/glob');
const os = require('os');
const path = require('path');

const events = ['pull_request', 'pull_request_target'];

async function run() {
    try {
        const updateComment = core.getInput('update-comment') === 'true';
        const findingsAmount = await runNatspecSmells();
        const gitHubToken = core.getInput('github-token').trim();

        const hasGithubToken = gitHubToken !== '';
        const isPR = events.includes(github.context.eventName);

        if (hasGithubToken && isPR) {
            const octokit = await github.getOctokit(gitHubToken);
            const sha = github.context.payload.pull_request.head.sha;
            const shaShort = sha.substr(0, 7);
            const commentHeaderPrefix = `### [Natspec smells](https://github.com/defi-wonderland/natspec-smells) of commit`;
            let body = generateCommentBody(commentHeaderPrefix, shaShort, sha, findingsAmount);

            updateComment ? await upsertComment(body, commentHeaderPrefix, octokit) : await createComment(body, octokit);
        } else if (!hasGithubToken) {
            core.info("github-token received is empty. Skipping writing a comment in the PR.");
            core.info("Note: This could happen even if github-token was provided in workflow file. It could be because your github token does not have permissions for commenting in target repo.")
        } else if (!isPR) {
            core.info("The event is not a pull request. Skipping writing a comment.");
            core.info("The event type is: " + github.context.eventName);
        }

        core.setOutput("total-smells", findingsAmount);
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function createComment(body, octokit) {
    core.debug("Creating a comment in the PR.")

    await octokit.rest.issues.createComment({
        repo: github.context.repo.repo,
        owner: github.context.repo.owner,
        issue_number: github.context.payload.pull_request.number,
        body,
    });
}

async function upsertComment(body, commentHeaderPrefix, octokit) {
    const issueComments = await octokit.rest.issues.listComments({
        repo: github.context.repo.repo,
        owner: github.context.repo.owner,
        issue_number: github.context.payload.pull_request.number,
    });

    const existingComment = issueComments.data.find(comment =>
        comment.body.includes(commentHeaderPrefix),
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
        core.debug(`Comment does not exist, a new comment will be created.`);

        await createComment(body, octokit);
    }
}

async function runNatspecSmells() {
    return new Promise(async (resolve, reject) => {
        let findingsAmount = 0;
        const options = {
            listeners: {
                stderr: (data) => {
                    const matches = data.toString().match(/.sol:/g);
                    if (matches) {
                        findingsAmount += matches.length;
                    }
                }
            }
        };
    
        await exec.exec('npx natspec-smells', [], options);

        core.info(`Total smells found: ${findingsAmount}`);
        resolve(findingsAmount);
    })
}

function generateCommentBody(commentHeaderPrefix, shaShort, sha, findingsAmount) {
    if (findingsAmount > 0) {
        return `${commentHeaderPrefix} [<code>${shaShort}</code>](${github.context.payload.pull_request.number}/commits/${sha}) during [${github.context.workflow} #${github.context.runNumber}](../actions/runs/${github.context.runId})\n> [!WARNING]  \n> Natspec smells has found **${findingsAmount} problems** in the code.`;
    }
    else{
        return `${commentHeaderPrefix} [<code>${shaShort}</code>](${github.context.payload.pull_request.number}/commits/${sha}) during [${github.context.workflow} #${github.context.runNumber}](../actions/runs/${github.context.runId})\n> [!TIP]  \n> Natspec smells has not found any problems in the code.`;
    }
}

run();