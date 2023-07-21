import debug from 'debug'
import {
  extname,
  join
} from 'node:path'
import mongoose from 'mongoose'
import chokidar from 'chokidar'
import crypto from 'node:crypto'
import {
  readFile,
  access
} from 'node:fs/promises'
import {
  constants
} from 'node:fs'
import {
  HOST,
  PORT,
  DB,
  DIRECTORY
} from '#config'
import getTifModel from '#models/tif'

const log = debug('@sequencemedia/tif')
const info = debug('@sequencemedia/tif:info')
const warn = debug('@sequencemedia/tif:warn')
const error = debug('@sequencemedia/tif:error')

async function hasTif (filePath) {
  try {
    await access(filePath, constants.R_OK)
    return true
  } catch {
    return false
  }
}

const isTif = (filePath) => /\.(?:tif|tiff)$/i.test(extname(filePath))

async function getHashFor (filePath) {
  const fileBuffer = await readFile(join(DIRECTORY, filePath))
  const uint8Array = new Uint8Array(fileBuffer)
  return (
    crypto
      .createHash('md5')
      .update(uint8Array)
      .digest('hex')
  )
}

async function handleChange (filePath) {
  log('change')

  if (!isTif(filePath)) return

  await tifModel.updateOne({ directory: DIRECTORY, filePath }, { removed: false, hash: await getHashFor(filePath), $setOnInsert: { added: new Date() } }, { upsert: true })
}

async function handleRemove (filePath) {
  log('remove')

  if (!isTif(filePath)) return

  await tifModel.updateOne({ directory: DIRECTORY, filePath }, { removed: true, $setOnInsert: { added: new Date() } }, { upsert: true })
}

async function handleReady () {
  log('ready')

  const tifs = await tifModel.find({})
  await Promise.all(
    tifs
      .map(async ({ _id, directory, filePath }) => {
        const has = await hasTif(join(directory, filePath))
        await tifModel.updateOne({ _id }, { removed: !has })
      })
  )
}

async function connect () {
  const {
    readyState = DISCONNECTED
  } = connection

  if (readyState < CONNECTED) await mongoose.connect(`mongodb://${HOST}:${PORT}/${DB}`)
}

async function disconnect () {
  const {
    readyState = DISCONNECTED
  } = connection

  if (readyState > DISCONNECTED) await mongoose.disconnect()
}

const tifModel = getTifModel()

const DISCONNECTED = 0
const CONNECTED = 1

/*
 *  const DISCONNECTED = 0
 *  const CONNECTED = 1
 *  const CONNECTING = 2
 *  const DISCONNECTING = 3
 */

const {
  connection = {}
} = mongoose

connection
  .on('open', () => {
    info('open')
  })
  .on('connected', () => {
    info('connected')
  })
  .on('connecting', () => {
    info('connecting')
  })
  .on('reconnected', () => {
    warn('reconnected')
  })
  .on('error', ({ message }) => {
    error(`errror - "${message}"`)
  })
  .on('disconnected', () => {
    warn('disconnected')
  })

process
  .on('SIGHUP', async (signal) => {
    const {
      stdout
    } = process

    if ('clearLine' in stdout) {
      stdout.clearLine()
      stdout.cursorTo(0)
    }

    log(signal)

    await disconnect()

    process.exit(0)
  })
  .on('SIGINT', async (signal) => {
    const {
      stdout
    } = process

    if ('clearLine' in stdout) {
      stdout.clearLine()
      stdout.cursorTo(0)
    }

    log(signal)

    await disconnect()

    process.exit(0)
  })
  .on('SIGBREAK', async (signal) => {
    log(signal)

    await disconnect()

    process.exit(0)
  })
  .on('SIGQUIT', async (signal) => {
    log(signal)

    await disconnect()

    process.exit(0)
  })
  .on('SIGTERM', async (signal) => {
    log(signal)

    await disconnect()

    process.exit(0)
  })
  .on('SIGPIPE', async (signal) => {
    log(signal)

    await disconnect()
  })
  .on('beforeExit', async (code) => {
    log('beforeExit', code)

    await disconnect()
  })
  .on('exit', async (code) => {
    log('exit', code)

    await disconnect()
  })
  .on('uncaughtException', async ({ message }) => {
    log('uncaughtException', message)

    await disconnect()

    process.exit(1)
  })
  .on('unhandledRejection', async (reason, promise) => {
    log('unhandledRejection', reason, promise)

    await disconnect()

    process.exit(1)
  })

connect()
  .then(() => {
    chokidar
      .watch(DIRECTORY, {
        cwd: DIRECTORY,
        ignored: '!*.(tif|TIF|tiff|TIFF)',
        awaitWriteFinish: true
      })
      .on('add', handleChange)
      .on('change', handleChange)
      .on('unlink', handleRemove)
      .on('ready', handleReady)
  })
  .catch(error)
