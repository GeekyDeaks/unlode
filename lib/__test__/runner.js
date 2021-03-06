import tap from 'tap'
import { runArrivalTest, runLoadTest } from '../runner.js'

function delay(ms) {
    return new Promise( resolve => {
        setTimeout(resolve, ms)
    })
}

tap.test('should run arrival tests for 1 second', async t => {

    let count = 0
    async function test() {
        t.pass('arrived')
        count++
    }

    let phases = [{ startRate: 1, endRate: 1, duration: 1 }]

    await runArrivalTest({ test, phases })

    t.equal( count, 1, 'expected one test ran')
    t.end()
})


tap.test('should complete all arrival tests', async t => {

    let completed = 0

    async function test() {
        t.pass('arrived')
        await delay(1000)
        completed++
    }

    let phases = [{ startRate: 10, endRate: 10, duration: 1 }]
    await runArrivalTest({ test, phases })
    t.equal( completed, 10, 'expected all tests to complete')
    t.end()
})


tap.test('should return the correct number of vu.started', async t => {

    let completed = 0
    async function test() {
        t.pass('arrived')
        await delay(1000)
        completed += 1
    }

    let phases = [{ startRate: 10, endRate: 10, duration: 1 }]

    let stats = await runArrivalTest({ test, phases })

    t.ok( stats.length == 1, `expected one set of stats, but got ${stats.length}` )
    let { counters } = stats[0]

    t.equal( completed, 10, 'expected all tests to complete')
    t.equal( counters['vu.completed'], completed)
    t.end()
})


tap.test('should not have more than maxConcurrent running', async t => {

    let completed = 0
    async function test() {
        t.pass('arrived')
        await delay(1000)
        completed += 1
    }

    let phases = [{ startRate: 10, endRate: 10, maxConcurrent: 5, duration: 1 }]

    let stats = await runArrivalTest({ test, phases })

    t.ok( stats.length == 1, `expected one set of stats, but got ${stats.length}` )
    let { counters } = stats[0]

    t.equal( completed, 5, 'expected all tests to complete')
    t.equal( counters['vu.completed'], completed)
    t.end()
})

tap.test('should run load tests for 1 second', async t => {

    let count = 0
    async function test() {
        t.pass('started')
        await delay(1000)
        count++
    }

    let phases = [{ vu: 1, duration: 1 }]

    await runLoadTest({ test, phases })

    t.equal( count, 1, 'expected one test ran')
    t.end()
})

tap.test('should run 10 load tests', async t => {

    let count = 0
    async function test() {
        t.pass('started')
        await delay(1000)
        count++
    }

    let phases = [{ vu: 10, duration: 1 }]

    await runLoadTest({ test, phases })

    t.equal( count, 10, 'expected all tests ran')
    t.end()
})
