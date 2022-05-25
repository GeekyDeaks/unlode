export function createMetrics(ee, phaseName) {

    let counters = {}
    let gauges = {}
    let samples = []

    let metric = {
        counter(name) {
            if(!counters[name]) counters[name] = 0
            counters[name] += 1
        },
        gauge(name, value) {
            let g = gauges[name]
            if(!g) {
                gauges[name] = { value, min: value, max: value, avg: value, sum: value, count: 1 }
            } else {
                g.value = value
                g.sum += value
                g.count += 1
                g.avg = g.sum / g.count
                g.min = Math.min(g.min, value)
                g.max = Math.max(g.max, value)
            }
        },
        sample() {
            // create the sample
            let state = {
                timestamp: Date.now(),
                phase: phaseName,
                counters,
                gauges
            }

            counters = {}
            gauges = {}

            samples.push(state)
            ee.emit('sample', state)
        },
        dump() {
            return {
                phase: phaseName, counters, gauges, samples
            }
        }
    }

    return {
        ...metric, 
        prefix(prefix) {
            return {
                ...metric,
                counter: name => metric.counter(prefix + '.' + name),
                gauge: (name, value) => metric.gauge(prefix + '.' + name, value)
            }
        }
    }
}

export function summariseMetrics(metrics) {

    let counters = {}
    let gauges = {}
    let samples = []
    // summarise the metrics

    function addCounters(c) {
        for( let [key, value] of Object.entries(c)) {
            if(!counters[key]) counters[key] = 0
            counters[key] += value
        }
    }

    function addGauges(g) {
        for( let [key, value] of Object.entries(g)) {
            let g = gauges[key]
            if(!g) {
                gauges[key] = value
            } else {
                g.value = value.value
                g.sum += value.sum
                g.count += value.count
                g.avg = g.sum / g.count
                g.min = Math.min(g.min, value.min)
                g.max = Math.max(g.max, value.max)
            }
        }
    }

    metrics.forEach( p => {
        addCounters(p.counters)
        addGauges(p.gauges)
        samples.push(...p.samples)
        p.samples.forEach(s => {
            addCounters(s.counters)
            addGauges(s.gauges)
        })
    })

    for( let g of Object.values(gauges)) {
        delete g.value
        delete g.sum
        delete g.count
    }

    return {
        counters,
        gauges,
        samples
    }

}