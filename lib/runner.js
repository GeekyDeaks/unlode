import { arrivals } from './arrivals.js'
import { createMetrics } from './metrics.js'
import { ee } from './events.js'

export async function runTest({ test, phases, samplePeriod = 10 }) {
    let tests = []
    let stats = []
    let vu = 0

    for(let [index, phase] of phases.entries()){
        let phaseName = phase.name || index
        ee.emit('phase.start', phaseName, phase)
        let metrics = createMetrics(ee, phaseName)
        stats.push(metrics)

        let timer = setInterval(metrics.sample,  samplePeriod * 1000)

        await arrivals({ ...phase, fn: () => {
            metrics.counter('vu.started')
            vu += 1
            metrics.gauge('vu.running', vu)
            let t = test({ metrics })
            tests.push(t)
            t.then(() => {
                metrics.counter('vu.completed')
            }).catch((err) => {
                metrics.counter('vu.failed')
            }).finally(() => {
                vu -= 1
                metrics.gauge('vu.running', vu)
            })
        } })
        clearInterval(timer)
        ee.emit('phase.end', phaseName, metrics.dump())

    }
    await Promise.allSettled(tests)

    // we have to wait until all the tests are finished before dumping the metrics
    return stats.map( m => m.dump() )
}