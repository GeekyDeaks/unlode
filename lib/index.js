'use strict'

export { runArrivalTest, runLoadTest } from './runner.js'
import { ee } from './events.js'

export const on = ee.on.bind(ee)