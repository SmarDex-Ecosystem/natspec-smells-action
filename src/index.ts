/**
 * The entrypoint for the action.
 */
import { run } from './main.ts'
import { runPost } from './post.ts'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
runPost()
