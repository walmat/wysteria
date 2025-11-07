/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  async app(input) {
    const pkg = await import('./package.json')
    return {
      name: pkg.name,
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    }
  },
  async run() {
    const domain = $app.stage === 'production' ? 'wysteria.io' : `${$app.stage}.wysteria.io`

    const bucket = new sst.aws.Bucket(`Bucket`)
    const vpc = new sst.aws.Vpc(`Vpc`, { bastion: true })
    const rds = new sst.aws.Postgres(`Postgres`, { vpc, proxy: true })

    // Authentication secrets
    const googleClientId = new sst.Secret('GoogleClientId')
    const googleClientSecret = new sst.Secret('GoogleClientSecret')
    const appleClientId = new sst.Secret('AppleClientId')
    const appleClientSecret = new sst.Secret('AppleClientSecret')
    const axiomToken = new sst.Secret('AxiomToken')
    const axiomDataset = new sst.Secret('AxiomDataset')

    const cluster = new sst.aws.Cluster(`Cluster`, { vpc })
    new sst.aws.Service(`Service`, {
      cluster,
      loadBalancer: {
        ports: [
          { listen: '443/https', forward: '3000/http' },
          { listen: '80/http', forward: '3000/http' },
        ],
        domain,
      },
      dev: {
        command: 'bun dev',
      },
      link: [
        bucket,
        rds,
        googleClientId,
        googleClientSecret,
        appleClientId,
        appleClientSecret,
        axiomToken,
        axiomDataset,
      ],
    })
  },
})
