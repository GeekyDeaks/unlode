
const protocols = {
    'http:': await import('node:http'),
    'https:': await import('node:https')
}

export function makeHttpTest(metrics) {
    function get(url) {

        let parse = new URL(url)
    
        return new Promise((resolve, reject) => {
            const options = {
                hostname: parse.hostname,
                port: parse.port,
                path: parse.path,
                method: 'GET',
            }

            const http = protocols[parse.protocol]

            const startTime = performance.now()

            const req = http.request(options, res => {

                metrics.counter(`http.status.${res.statusCode}`)
                metrics.gauge(`http.connect.ms`, performance.now() - startTime)
                res.on('data', d => {
                    //process.stdout.write(d)
                })
    
                res.on('end', () => {
                    metrics.gauge(`http.response.ms`, performance.now() - startTime)
                    resolve()
                })
            })

            req.on('error', err => {
                metrics.counter(`http.request.error.${err.message}`)
                reject(err)
            })    
            req.end()
    
        })
    }

    return {
        get
    }
}