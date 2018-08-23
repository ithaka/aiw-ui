const pact = require('@pact-foundation/pact-node')
const path = require('path')

const opts = {
  pactFilesOrDirs: [path.resolve(__dirname, '../pacts')],
  pactBroker: 'http://pact-broker.apps.test.cirrostratus.org',
//   pactBrokerUsername: '',
//   pactBrokerPassword: '',
  tags: ['test'],
  consumerVersion: '2.0.2'
}

pact.publishPacts(opts)
  .then(() => {
    console.log('Pact contract publishing complete!')
    console.log('Published to:' + opts.pactBroker)
  })
  .catch((e) => {
    console.log('Pact contract publishing failed: ', e)
  })