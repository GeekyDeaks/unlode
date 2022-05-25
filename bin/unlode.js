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
        'vu.running': m.measures['vu.running']?.p50
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
    printStatus(summarise(metrics))
})
//unlode.on('error', (name, msg) => console.error(name, msg))
unlode.on('error', () => {})
unlode.on('sample', (metrics) => {
    console.log('sample:')
    printStatus(summarise(metrics))
})

function summarise(metrics) {
    let { counters, measures, rates } = summariseMetrics(metrics)
    // go through all the gauges making the values look a bit better
    ;[ measures, rates ].forEach(collection => {
        for(let c of Object.values(collection)) {
            for( let [k, v] of Object.entries(c)) {
                c[k] = Number(v).toFixed(3)
            }
        }
    })

    return { counters, measures, rates }
}

let stats = await unlode.runTest({ phases, test })

console.log('-- totals --------------------')
console.log(inspect(summarise(stats), { depth: null, colors: true}))
