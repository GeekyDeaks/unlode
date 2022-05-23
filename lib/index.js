'use strict'

export { runTest } from './runner.js'
import { ee } from './events.js'

export const on = ee.on.bind(ee)