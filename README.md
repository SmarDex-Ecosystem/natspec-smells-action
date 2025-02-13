# GitHub Action — Report natspec smells

This GitHub Action allows you to leverage GitHub Actions to report
[natspec smells](https://github.com/defi-wonderland/natspec-smells) findings in
Solidity files.

Created thanks to the template
[typescript-action](https://github.com/actions/typescript-action).

## Usage

### Pre-requisites

Create a workflow `.yml` file in your `.github/workflows` directory. An
[example workflow](#common-workflow) is available below. For more information,
reference the GitHub Help Documentation for
[Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Inputs

For more information on these inputs, see the
[Workflow syntax for GitHub Actions](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepswith)

- `github-token`: Set the `${{ secrets.GITHUB_TOKEN }}` token to have the action
  comment the natspec smells findings summary in the pull request. This token is
  provided by Actions, you do not need to create your own token. Optional.
  Default: ``
- `working-directory`: The working directory containing the source files
  referenced in the natspec-smells config file. Optional. Default: `./`
- `update-comment`: Set to `true` to update the previous natspec smells comment
  if such exists. When set to `false`, a new comment is always created.
  Optional. Default: `false`

### Outputs

- `total-smells`: The total smells founds by natspec-smells

### Common workflow

```yaml
on: pull_request

name: Continuous Integration

jobs:
  natspec-smells:
    name: Generate natspec-smells report
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Report natspec smells findings
        uses: SmarDex-Ecosystem/natspec-smells-action@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          working-directory: ./
          update-comment: true
```

_Note:_ Only the `pull_request` and `pull_request_target` events are supported.
This action does nothing when triggered by other event types.

### Example

An example of message appears in the pull request with 3 errors found in the
natspec3Problem.sol :

```text
HelloWorld:constructor
@param value is missing

fileExample/natspec3Problems.sol:11
HelloWorld:get
@inheritdoc is missing

fileExample/natspec3Problems.sol:5
HelloWorld:_value
@inheritdoc is missing

```

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE.md)
