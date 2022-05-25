import { TDigest } from 'tdigest'

export function createMetrics(ee, phaseName) {

    let counters = {}
    let measures = {}
    let rates = {}
    let samples = []
    let startedAt = Date.now()

    let metric = {
        counter(name) {
            if(!counters[name]) counters[name] = 0
            counters[name] += 1
        },
        measure(name, value) {
            let m = measures[name]
            if(!m) m = measures[name] = new TDigest()
            m.push(value)
        },
        rate(name) {
            if(!rates[name]) rates[name] = 1
            rates[name] += 1
        },
        sample() {
            let endedAt = Date.now()
            // create the sample
            let state = {
                startedAt,
                endedAt,
                phase: phaseName,
                counters,
                measures,
                rates
            }

            counters = {}
            measures = {}
            rates = {}
            startedAt = endedAt

            samples.push(state)
            ee.emit('sample', state)
        },
        start() {
            startedAt = Date.now()
        },
        end() {
            metric.sample()
        },
        dump() {
            metric.end()
            return samples
        }
    }

    return {
        ...metric, 
        prefix(prefix) {
            return {
                ...metric,
                counter: name => metric.counter(prefix + '.' + name),
                measure: (name, value) => metric.measure(prefix + '.' + name, value),
                rate: (name) => metric.rate(prefix + '.' + name)
            }
        }
    }
}

export function summariseMetrics(metrics) {

    if(!Array.isArray(metrics)) metrics = [ metrics ]

    let counters = {}
    let measures = {}
    let rates = {}
    let samples = []
    // summarise the metrics

    function addCounters(c) {
        for( let [key, value] of Object.entries(c)) {
            if(!counters[key]) counters[key] = 0
            counters[key] += value
        }
    }

    function addmeasures(m) {
        for( let [key, value] of Object.entries(m)) {
            let m = measures[key]
            if(!m) {
                measures[key] = value
            } else {
                m.push_centroid(value.toArray())
            }
        }
    }

    function addRates(r, duration) {
        for( let [key, value] of Object.entries(r)) {
            let r = rates[key]
            if(!r) {
                r = rates[key] = new TDigest()
            }
            r.push(value * 1000 / duration)
        }
    }

    metrics.forEach( period => {
        addCounters(period.counters)
        addmeasures(period.measures)
        addRates(period.rates, period.endedAt - period.startedAt)
    })

    // summarise all the tdigests
    function dumpDigest(collection) {
        let rv = {}
        for( let [key, value] of Object.entries(collection)) {
            rv[key] = {
                min: value.percentile(0),
                p50: value.percentile(0.5),
                p90: value.percentile(0.9),
                p95: value.percentile(0.95),
                max: value.percentile(1.0)
            }
        }
        return rv
    }

    return {
        counters,
        measures: dumpDigest(measures),
        rates: dumpDigest(rates),
        samples
    }

}