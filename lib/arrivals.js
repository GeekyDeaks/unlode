
const INTERVAL = 1000
/**
 * 
 * @param {*} rate number of arrivals per second
 */
export async function arrivals({ startRate, endRate, duration, fn }) {

    let elapsed = 0
    do {
        let rate = (elapsed / duration) * (endRate - startRate) + startRate
        let startArrivals = performance.now()

        // wait for all the arrivals to arrive
        await new Promise( resolve => {
            // launch all the arrivals distributed through the second
            let launched = 0
            let arrived = 0
            do {
                setTimeout(() => {
                    fn()
                    arrived++
                    if(arrived >= rate) resolve()
                }, Math.random() * INTERVAL)
                launched++
            } while(launched < rate)
        })

        let arrivalTime = (performance.now() - startArrivals)

        if(arrivalTime >= INTERVAL) {
            // overran
            let intervalsOverran = Math.floor(arrivalTime / INTERVAL)
            elapsed += intervalsOverran

        } else {
            let wait = Math.max(INTERVAL - arrivalTime, 0)
            // wait the rest of the second for the next salvo
            await new Promise( r => setTimeout(r, wait))
            elapsed += 1
        }

    } while(elapsed < duration)

}