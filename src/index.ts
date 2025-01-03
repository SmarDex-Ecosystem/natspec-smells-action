/**
 * The entrypoint for the action.
 */
import { run } from './main'
import { runPost } from './post'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
// eslint-disable-next-line @typescript-eslint/no-floating-promises
runPost()
