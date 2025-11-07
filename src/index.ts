import cluster from 'node:cluster'
import os from 'node:os'
import process from 'node:process'

// Only use clustering in production (deployed environment)
// import.meta.env.NODE_ENV is set to 'production' only in actual deployments
const isProduction = import.meta.env.NODE_ENV === 'production'

if (isProduction) {
  // Production mode with clustering for multi-core utilization
  if (cluster.isPrimary) {
    const numCPUs = os.availableParallelism()
    console.log(`🔧 Primary process ${process.pid} is running`)
    console.log(`🔄 Forking ${numCPUs} workers...`)

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork()
    }

    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.process.pid} is online`)
    })

    cluster.on('exit', (worker, code, signal) => {
      console.log(`❌ Worker ${worker.process.pid} died (${signal || code}). Restarting...`)
      cluster.fork()
    })
  } else {
    await import('./server')
    console.log(`Worker ${process.pid} started`)
  }
} else {
  // Development mode - single process, no clustering
  await import('./server')
  console.log(`Development server started (single process)`)
}
