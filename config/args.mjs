import nconf from 'nconf'
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_DB
} from './defaults.mjs'

const args = nconf.argv().env().defaults({
  host: DEFAULT_HOST,
  port: DEFAULT_PORT,
  db: DEFAULT_DB
}).get()

export default new Map(Object.entries(args))
