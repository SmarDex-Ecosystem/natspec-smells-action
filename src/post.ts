import * as os from 'node:os'
import * as path from 'node:path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as io from '@actions/io'

export async function runPost() {
  try {
    const tmpPath: string = path.resolve(os.tmpdir(), github.context.action)

    await io.rmRF(tmpPath)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
