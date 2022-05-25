import { arrivals } from './arrivals.js'
import { createMetrics } from './metrics.js'
import { ee } from './events.js'

export async function runTest({ test, phases, samplePeriod = 10 }) {
    if(phases[0].vu) {
        return runLoadTest({ test, phases, samplePeriod })
    } else {
        return runArrivalTest({ test, phases, samplePeriod })
    }
}

export async function runArrivalTest({ test, phases, samplePeriod }) {
    let tests = []
    let stats = []
    let vu = 0

    for(let [index, phase] of phases.entries()){
        let phaseName = phase.name || index
        ee.emit('phase.start', phaseName, phase)
        let metrics = createMetrics(ee, phaseName)

        let timer = setInterval(metrics.sample,  samplePeriod * 1000)

        await arrivals({ ...phase, fn: () => {

            if(phase.maxConcurrent && vu >= phase.maxConcurrent) {
                metrics.counter('vu.skipped')
                return
            }

            metrics.counter('vu.started')
            vu += 1
            metrics.measure('vu.running', vu)
            let t = test({ metrics })
            tests.push(t)
            t.then(() => {
                metrics.counter('vu.completed')
            }).catch((err) => {
                metrics.counter('vu.failed')
            }).finally(() => {
                vu -= 1
                metrics.measure('vu.running', vu)
            })
        } })
        await Promise.allSettled(tests)
        clearInterval(timer)
        let m = metrics.dump()
        ee.emit('phase.end', phaseName, m)
        stats.push(...m)
    }
    
    // we have to wait until all the tests are finished before dumping the metrics
    return stats
}

export async function runLoadTest( { test, phases, samplePeriod = 10 }) {
    let tests = []
    let stats = []

    for(let [index, phase] of phases.entries()){
        let phaseName = phase.name || index

        let startTime = performance.now()
        let endTime = startTime + (phase.duration * 1000)

        ee.emit('phase.start', phaseName, phase)
        let metrics = createMetrics(ee, phaseName)

        let timer = setInterval(metrics.sample,  samplePeriod * 1000)

        // launch all the vus
        function launch(i) {
            metrics.counter('vu.started')
            tests[i] = test({ metrics }).then( () => {
                metrics.counter('vu.completed')
            }).catch( () => {
                metrics.counter('vu.failed')
            }).finally( () => {
                if(performance.now() < endTime) launch(i)
            })
        }

        for(let v = 0; v < phase.vu; v++) {
            launch(v)
        }

        // wait until the end of the duration
        await new Promise( r => setTimeout(r, phase.duration * 1000 ))
        await Promise.allSettled(tests)

        clearInterval(timer)
        let m = metrics.dump()
        ee.emit('phase.end', phaseName, m)
        stats.push(...m)

    }
    return stats

}