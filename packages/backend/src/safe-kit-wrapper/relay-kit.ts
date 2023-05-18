import Safe, { EthersAdapter, getSafeContract } from '@safe-global/protocol-kit'
import { InfuraProvider, Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import {
    RelayTransaction,
    SafeMultisigTransactionResponse,
    SafeTransaction,
} from '@safe-global/safe-core-sdk-types'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import { SponsorGasModule__factory } from '@/typechain-types'
import {
    GelatoRelay as GelatoNetworkRelay,
    CallWithSyncFeeRequest,
    RelayRequestOptions,
} from '@gelatonetwork/relay-sdk'
import {
    GELATO_FEE_COLLECTOR,
    GELATO_NATIVE_TOKEN_ADDRESS,
    ZERO_ADDRESS,
} from '@safe-global/relay-kit/dist/src/constants'

export class RelayKitWrapper extends GelatoRelayPack {
    #gelatoRelay: GelatoNetworkRelay

    constructor() {
        super()
        this.#gelatoRelay = new GelatoNetworkRelay()
    }

    _getFeeTokenForGelato(gasToken?: string): string {
        return !gasToken || gasToken === ZERO_ADDRESS
            ? GELATO_NATIVE_TOKEN_ADDRESS
            : gasToken
    }

    relayTransactionWithContext = async ({
        target,
        encodedTransaction,
        chainId,
        options,
    }: RelayTransaction): Promise<any> => {
        const { gasLimit, gasToken } = options
        const feeToken = this._getFeeTokenForGelato(gasToken)
        const request: CallWithSyncFeeRequest = {
            chainId,
            target,
            data: encodedTransaction,
            feeToken,
            isRelayContext: true,
        }
        const relayRequestOptions: RelayRequestOptions = {
            gasLimit,
        }
        const response = await this.#gelatoRelay.callWithSyncFee(
            request,
            relayRequestOptions,
        )
        return response
    }

    getRelayTransaction = async (
        chainId: number,
        serviceTransactionResponse: SafeMultisigTransactionResponse,
        provider?: Provider,
    ): Promise<RelayTransaction> => {
        if (!process.env.SPONSOR_GAS_MODULE_ADDRESS)
            throw new Error('SPONSOR_GAS_MODULE_ADDRESS not set')

        chainId = chainId
        provider =
            provider ?? new InfuraProvider(chainId, process.env.INFURA_API_KEY)

        const safeAddress = serviceTransactionResponse.safe
        const ethAdapter = new EthersAdapter({
            ethers: ethers,
            signerOrProvider: provider,
        })
        const safeSDK = await Safe.create({
            ethAdapter,
            safeAddress,
        })
        const safeSingletonContract = await getSafeContract({
            ethAdapter,
            safeVersion: await safeSDK.getContractVersion(),
        })
        const safeTransaction = await safeSDK.toSafeTransactionType(
            serviceTransactionResponse,
        )

        const encodedTx = safeSingletonContract.encode('execTransaction', [
            safeTransaction.data.to,
            safeTransaction.data.value,
            safeTransaction.data.data,
            safeTransaction.data.operation,
            safeTransaction.data.safeTxGas,
            safeTransaction.data.baseGas,
            safeTransaction.data.gasPrice,
            safeTransaction.data.gasToken,
            safeTransaction.data.refundReceiver,
            safeTransaction.encodedSignatures(),
        ])

        const sponsorGasModule = new ethers.Contract(
            process.env.SPONSOR_GAS_MODULE_ADDRESS,
            SponsorGasModule__factory.abi,
        )

        return {
            // target: safeAddress,
            // encodedTransaction: encodedTx,
            target: process.env.SPONSOR_GAS_MODULE_ADDRESS,
            encodedTransaction: sponsorGasModule.interface.encodeFunctionData(
                'execTransaction',
                [
                    safeAddress,
                    [
                        safeTransaction.data.to,
                        safeTransaction.data.value,
                        safeTransaction.data.data,
                        safeTransaction.data.operation,
                        safeTransaction.data.safeTxGas,
                        safeTransaction.data.baseGas,
                        safeTransaction.data.gasPrice,
                        safeTransaction.data.gasToken,
                        safeTransaction.data.refundReceiver,
                        safeTransaction.encodedSignatures(),
                    ],
                ],
            ),
            chainId: chainId,
            options: {
                gasLimit: '1000000',
                gasToken: ethers.constants.AddressZero,
                isSponsored: false,
            },
        }
    }
}
