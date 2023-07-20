import path from 'node:path'
import args from './args.mjs'

export const DIR = path.resolve(
  args.has('dir')
    ? args.get('dir')
    : '.files'
)
