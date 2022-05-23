'use strict'

import tap from 'tap'
import { arrivals } from '../arrivals.js'

tap.test('should arrive 2000 times in two seconds', async t => {

    let rate = 1000
    let duration = 2
    let total = rate * duration
    let arrived = 0

    await new Promise( resolve => {
        function fn() {
            t.pass('arrived')
            arrived++
            if(arrived >= total) resolve()
            if(arrived > total) t.fail('too many arrivals')
        }
    
        arrivals({ startRate: rate, endRate: rate, duration, fn })
    })

    t.equal(arrived, total, 'expected all arrivals')
    t.end()
})


tap.test('should arrive approximately 2000 times in one second', async t => {

    let rate = 2000
    let duration = 1
    let total = rate * duration
    let arrived = 0

    await new Promise( resolve => {
        function fn() {
            t.pass('arrived')
            arrived++
            if(arrived >= total) resolve()
            if(arrived > total) t.fail('too many arrivals')
        }
    
        arrivals({ startRate: rate, endRate: rate, duration, fn })
    })

    t.equal(arrived, total, 'expected all arrivals')
    t.end()
})