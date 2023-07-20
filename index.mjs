import debug from 'debug'
import {
  extname,
  join
} from 'node:path'
import chokidar from 'chokidar'
import crypto from 'node:crypto'
import {
  readFile
} from 'node:fs/promises'
import {
  DIR
} from '#config'

const log = debug('@sequencemedia/tif')

const isTif = (fileName) => /\.(?:tif|tiff)$/i.test(extname(fileName))

async function getHashFor (fileName) {
  const filePath = join(DIR, fileName)
  const fileBuffer = await readFile(filePath)
  const uint8Array = new Uint8Array(fileBuffer)
  return (
    crypto
      .createHash('md5')
      .update(uint8Array)
      .digest('hex')
  )
}

const watcher = (
  chokidar
    .watch(DIR, {
      cwd: DIR,
      ignored: '!*.(tif|TIF|tiff|TIFF)',
      awaitWriteFinish: true
    })
)

watcher
  .on('add', async (fileName, stats) => {
    if (!isTif(fileName)) return

    log('add', { fileName, stats }, await getHashFor(fileName))
  })
  .on('addDir', (...args) => {
    log('addDir', ...args)
  })
  .on('change', async (fileName, stats) => {
    if (isTif(fileName)) log('change', { fileName, stats }, await getHashFor(fileName))
  })
  .on('changeDir', (...args) => {
    log('changeDir', ...args)
  })
  .on('unlink', (fileName) => {
    if (isTif(fileName)) log('unlink', { fileName })
  })
  .on('unlinkDir', (...args) => {
    log('unlinkDir', ...args)
  })
  .on('ready', () => {
    log('ready')
  })
