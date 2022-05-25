#! /usr/bin/env node
import * as unlode from '../lib/index.js'
import { summariseMetrics } from '../lib/metrics.js'
import { inspect } from 'node:util'

// figure out the arguments
if(process.argv.length < 3) {
    console.log('usage: unlode <script>')
    process.exit(1)
}

// try and load the scirpt
let script = process.argv[2]
console.log(`running with ${script}`)

// import the script

let { phases, test } = await import(process.cwd() + '/' + script)

function printStatus(m) {
    let s = {
        'vu.started': m.counters['vu.started'] || 0,
        'vu.completed': m.counters['vu.completed'] || 0,
        'vu.failed': m.counters['vu.failed'] || 0,
        'vu.running': m.gauges['vu.running']?.value || 0
    }

    for (const [key, value] of Object.entries(m.counters)) {
        if(key.match(/\.error\./)) {
            s[key] = value
        }
    }

    console.log(s)
}

unlode.on('phase.start', (name, phase) => {
    console.log('phase.start %s %s', name, inspect(phase, { depth: null, colors: true}))
})

unlode.on('phase.end', (name, metrics) => {
    console.log('phase.end %s', name)
    printStatus(metrics)
})
//unlode.on('error', (name, msg) => console.error(name, msg))
unlode.on('error', () => {})
unlode.on('sample', (metrics) => {
    console.log('sample:')
    printStatus(metrics)
})

function summarise(metrics) {
    let { counters, gauges } = summariseMetrics(metrics)
    // go through all the gauges making the values look a bit better
    for(let g of Object.values(gauges)) {
        g.min = Number(g.min).toFixed(3)
        g.max = Number(g.max).toFixed(3)
        g.avg = Number(g.avg).toFixed(3)
    }
    console.log('-- totals --------------------')
    console.log(inspect({ counters, gauges }, { depth: null, colors: true}))
}

// figure out what test to run
if(phases[0].vu) {
    unlode.runLoadTest({ phases, test }).then(summarise)
} else {
    unlode.runArrivalTest({ phases, test }).then(summarise)
}
