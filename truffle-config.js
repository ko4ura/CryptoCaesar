const HDWalletProvider = require('truffle-hdwallet-provider')
const privkey = ''
module.exports = {
    networks: {
        test: {
            provider: new HDWalletProvider(privkey, 'https://ropsten.infura.io/v3/201c43abb6c64d4e88f44c387fcc8a4b'),
            network_id: 3,
            gas: 4700000,
            gasPrice: 1000000000,
        },
        develop: {
            port: 8545,
            network_id: 20,
            accounts: 5,
            defaultEtherBalance: 500,
            blockTime: 3
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 100
        }
    }
}
