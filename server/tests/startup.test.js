const assert = require('node:assert/strict')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

test('API does not accept requests when database initialization fails', () => {
  const result = spawnSync(process.execPath, ['src/server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: '5099',
      DB_HOST: '127.0.0.1',
      DB_PORT: '1',
    },
    timeout: 5000,
    encoding: 'utf8',
  })

  assert.equal(result.error, undefined)
  assert.equal(result.status, 1)
  assert.doesNotMatch(result.stdout, /API running/)
  assert.match(result.stderr, /Database schema could not be verified/)
})
