import nconf from 'nconf'

const args = nconf.argv().env().defaults({
  host: 'localhost',
  port: 27017,
  db: 'tag-tif'
}).get()

export default new Map(Object.entries(args))
