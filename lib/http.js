import http from 'node:http'
import https from 'node:https'

const protocols = {
    'http:': http,
    'https:': https
}

const agent = new http.Agent({ keepAlive: true })

export function makeHttpTest(metrics) {
    function get(url) {

        let parse = new URL(url)
    
        return new Promise((resolve, reject) => {
            const http = protocols[parse.protocol]
            const startTime = performance.now()

            let options = {
                hostname: parse.hostname,
                port: parse.port,
                path: parse.path,
                agent
            }

            const req = http.request(options, res => {

                metrics.counter(`http.status.${res.statusCode}`)
                metrics.rate('http.requests/s')
                res.on('data', d => {
                    //process.stdout.write(d)
                })
    
                res.on('end', e => {
                    metrics.measure('http.response.ms', performance.now() - startTime)
                    resolve()
                })
            })
            
            req.on('socket', s => {
                metrics.measure('http.connect.ms', performance.now() - startTime)
            })

            req.on('error', err => {
                metrics.counter(`http.request.error.${err.message}`)
                metrics.rate('http.errors/s')
                reject(err)
            })    
            req.end()
    
        })
    }

    return {
        get
    }
}