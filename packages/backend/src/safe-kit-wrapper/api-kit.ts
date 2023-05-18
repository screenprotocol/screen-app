import SafeApiKit, {
    SafeMultisigTransactionListResponse,
} from '@safe-global/api-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { InfuraProvider, Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types'

export class SafeApiKitWrapper extends SafeApiKit {
    ethAdapter: EthersAdapter

    constructor(chainId: number, provider?: Provider) {
        provider =
            provider ?? new InfuraProvider(chainId, process.env.INFURA_API_KEY)
        const txServiceUrl = SafeApiKitWrapper.getTxServiceUrl(chainId)
        const _ethAdapter = new EthersAdapter({
            ethers: ethers,
            signerOrProvider: provider,
        })
        super({ txServiceUrl, ethAdapter: _ethAdapter })
        this.ethAdapter = _ethAdapter
    }

    isModuleEnabled = async (
        safeAddress: string,
        moduleAddress: string,
    ): Promise<boolean> => {
        const safeSDK = await Safe.create({
            ethAdapter: this.ethAdapter,
            safeAddress,
        })
        return safeSDK.isModuleEnabled(moduleAddress)
    }

    _getTransactionToExecute = (
        txns: SafeMultisigTransactionListResponse['results'],
    ): SafeMultisigTransactionResponse | null => {
        if (txns.length === 0) return null

        const lastTransaction = txns[txns.length - 1]

        if (!lastTransaction.confirmations) return null

        if (
            lastTransaction.confirmations.length <
            lastTransaction.confirmationsRequired
        )
            return null

        const secondLastTransaction = this._getTransactionToExecute([
            ...txns.slice(0, txns.length - 1),
        ])

        if (
            secondLastTransaction &&
            lastTransaction.nonce === secondLastTransaction.nonce
        )
            return secondLastTransaction

        return lastTransaction
    }

    getTransactionToExecute = async (
        safeAddress: string,
    ): Promise<SafeMultisigTransactionResponse | null> => {
        const info = await this.getSafeInfo(safeAddress)

        const pendingTxsResult = await this.getPendingTransactions(
            safeAddress,
            info.nonce,
        )

        if (pendingTxsResult.count === 0) return null

        const txns = pendingTxsResult.results

        if (txns.length === 0) return null

        return this._getTransactionToExecute(txns)
    }

    static getTxServiceUrl = (chainId: number) => {
        switch (chainId) {
            case 1:
                // Ethereum Mainnet
                return 'https://safe-transaction-mainnet.safe.global/'
            case 5:
                // Ethereum Goerli
                return 'https://safe-transaction-goerli.safe.global/'
            case 10:
                // Optimism
                return 'https://safe-transaction-optimism.safe.global/'
            case 100:
                // Gnosis Chain (xDai)
                return 'https://safe-transaction-gnosis-chain.safe.global/'
            case 137:
                // Polygon
                return 'https://safe-transaction-polygon.safe.global/'
            case 42161:
                // Arbitrum One
                return 'https://safe-transaction-arbitrum.safe.global/'
            case 43114:
                // Avalanche C-Chain
                return 'https://safe-transaction-avalanche.safe.global/'
            case 1313161554:
                // Aurora chain
                return 'https://safe-transaction-aurora.safe.global/'
            case 56:
                // Binance Smart Chain
                return 'https://safe-transaction-bsc.safe.global/'
            default:
                return 'https://safe-transaction-goerli.gnosis.io/'
        }
    }
}
