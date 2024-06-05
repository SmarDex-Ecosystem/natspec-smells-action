import * as core from '@actions/core'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as os from 'os'
import * as path from 'path'

export async function runPost(): Promise<void> {
  try {
    const tmpPath: string = path.resolve(os.tmpdir(), github.context.action)

    await io.rmRF(tmpPath)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}
