import {
  resolve
} from 'node:path'
import args from './args.mjs'
import {
  DEFAULT_DIRECTORY
} from './defaults.mjs'

export const HOST = args.get('host')

export const PORT = args.get('port')

export const DB = args.get('db')

export const DIRECTORY = (
  resolve(
    args.has('directory')
      ? args.get('directory')
      : DEFAULT_DIRECTORY
  )
)
