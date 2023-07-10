import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Safe } from '../models/safes'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { useAPis } from '../hooks/apis'
import { createSafe, getSafe } from '../apis'
import { ethers } from 'ethers'
import GnosisSafeBuildInfo from '@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json'
import SponsorGasModule from './SponsorGasModule.json'

const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

function getProviderUrl(chainId: number): string {
    let name = ''

    /**
     * Supported networks:
     * Optimism
     *
     */
    switch (chainId) {
        case 1:
            // Ethereum Mainnet
            name = 'mainnet'
            break
        case 5:
            // goerli
            name = 'goerli'
            break

        case 42161:
            // Arbitrum
            name = 'arbitrum-mainnet'
            break

        case 43114:
            // Avalanche
            name = 'avalanche-mainnet'
            break
        case 56:
            // Binance Smart Chain
            name = 'bsc'
            break
        case 137:
            // Polygon
            name = 'polygon-mainnet'
            break

        case 10:
            // Optimism
            name = 'optimism-mainnet'
            break
    }

    return `https://${name}.infura.io/v3/${process.env.REACT_APP_INFURA_ID}`
}

export type completeState = {
    error: boolean
    message?: string
}

type SafeConnectorContextType = {
    enableSafe: () => Promise<void>
    disableSafe: () => Promise<void>
    loaderCallback: boolean
    completeState: completeState | undefined
    savedSafe: Safe | undefined
    loadingSavedState: boolean
    safe: ReturnType<typeof useSafeAppsSDK>['safe']
    sdk: ReturnType<typeof useSafeAppsSDK>['sdk']
}

const SafeConnectorContext = createContext<
    SafeConnectorContextType | undefined
>(undefined)

interface SafeConnectorProviderProps {
    children: React.ReactNode
}

const SafeConnectorProvider: React.FC<SafeConnectorProviderProps> = ({
    children,
}) => {
    const { sdk, safe } = useSafeAppsSDK()

    const [savedSafe, setSavedSafe] = useState<Safe | undefined>(undefined)

    const { loading: loadingSavedState, response: getSafeResponse } = useAPis<
        typeof getSafe
    >({
        api: getSafe,
        args: [safe.safeAddress],
        instantCall: true,
    })

    useEffect(() => {
        if (!getSafeResponse) return
        setSavedSafe(getSafeResponse)
    }, [getSafeResponse])

    const gnosisSafe = useMemo(() => {
        return new ethers.Contract(safe.safeAddress, GnosisSafeBuildInfo.abi)
    }, [safe])

    const [trxn, setTrxn] = useState<string>('')

    const {
        loading: loaderApi,
        errors: createSafeErrors,
        response: createSafeResponse,
        request: createSafeRequest,
    } = useAPis<typeof createSafe>({
        api: createSafe,
    })

    useEffect(() => {
        if (!trxn) return
        createSafeRequest(safe.safeAddress, safe.chainId, trxn)
    }, [trxn])

    const [loaderCallback, setLoaderCallback] = useState<boolean>(loaderApi)

    const [completeState, setCompleteState] = useState<
        completeState | undefined
    >(undefined)

    useEffect(() => {
        if (!trxn) return
        if (loaderApi) return
        if (createSafeErrors) {
            return setCompleteState({
                error: true,
                message: "Something went wrong, coudn't enable your Safe",
            })
        }
        if (!createSafeErrors && createSafeResponse)
            setCompleteState({
                error: false,
                message: '',
            })
        setLoaderCallback(false)
        setSavedSafe(createSafeResponse)
    }, [createSafeResponse, createSafeErrors, trxn, loaderApi])

    const enableSafe = useCallback(async () => {
        setLoaderCallback(true)
        if (!process.env.REACT_APP_SPONSOR_GAS_MODULE_ADDRESS)
            throw new Error('No sponsor gas module address provided')

        const SponsorGasModuleContract = new ethers.Contract(
            process.env.REACT_APP_SPONSOR_GAS_MODULE_ADDRESS,
            SponsorGasModule.abi,
        )

        const txs = await sdk.txs
            .send({
                txs: [
                    {
                        to: safe.safeAddress,
                        value: '0',
                        data: gnosisSafe.interface.encodeFunctionData(
                            'enableModule',
                            [process.env.REACT_APP_SPONSOR_GAS_MODULE_ADDRESS],
                        ),
                    },
                    {
                        to: process.env.REACT_APP_SPONSOR_GAS_MODULE_ADDRESS,
                        value: '0',
                        data: SponsorGasModuleContract.interface.encodeFunctionData(
                            'setApprovedGasLimit',
                            [NATIVE_TOKEN, ethers.utils.parseEther('1')],
                        ),
                    },
                ],
            })
            .catch((e) => {
                console.log(e)
                setCompleteState({
                    error: true,
                    message: "Transaction rejected, couldn't enable your Safe",
                })
                setLoaderCallback(false)
                return { safeTxHash: '' }
            })
        if (!txs.safeTxHash) return
        setTrxn(txs.safeTxHash)
        setCompleteState(undefined)
    }, [sdk, safe, gnosisSafe, setCompleteState, setTrxn])

    const disableSafe = useCallback(async () => {
        setLoaderCallback(true)
        setTrxn('')
        const provider = new ethers.providers.JsonRpcProvider(
            getProviderUrl(safe.chainId),
        )

        const safeContract = new ethers.Contract(
            safe.safeAddress,
            GnosisSafeBuildInfo.abi,
            provider,
        )

        const response = await safeContract.getModulesPaginated(
            ethers.utils.getAddress(
                '0x0000000000000000000000000000000000000001',
            ),
            100,
        )

        const { prevModuole } = response[0].reduce(
            (
                result: { found: boolean; prevModuole: string },
                module: string,
            ) => {
                if (result.found) return result

                if (module === process.env.REACT_APP_SPONSOR_GAS_MODULE_ADDRESS)
                    return {
                        ...result,
                        found: true,
                    }

                return module
            },
            {
                found: false,
                prevModuole: ethers.utils.getAddress(
                    '0x0000000000000000000000000000000000000001',
                ),
            },
        )

        const txs = await sdk.txs
            .send({
                txs: [
                    {
                        to: safe.safeAddress,
                        value: '0',
                        data: gnosisSafe.interface.encodeFunctionData(
                            'disableModule',
                            [
                                prevModuole,
                                process.env
                                    .REACT_APP_SPONSOR_GAS_MODULE_ADDRESS,
                            ],
                        ),
                    },
                ],
            })
            .catch((e) => {
                console.error(e)
                setLoaderCallback(false)
                setCompleteState({
                    error: true,
                    message: "Transaction rejected, couldn't disable your Safe",
                })

                return { safeTxHash: '' }
            })
        if (!txs.safeTxHash) return
        setTrxn(txs.safeTxHash)
        setCompleteState(undefined)
    }, [sdk, safe, gnosisSafe, setCompleteState, setTrxn])

    return (
        <SafeConnectorContext.Provider
            value={{
                enableSafe,
                loaderCallback,
                completeState,
                disableSafe,
                savedSafe,
                safe,
                sdk,
                loadingSavedState,
            }}
        >
            {children}
        </SafeConnectorContext.Provider>
    )
}

const useSafeConnector = () => {
    const context = useContext(SafeConnectorContext)
    if (context === undefined) {
        throw new Error(
            'useSafeConnector must be used within a SafeConnectorProvider',
        )
    }
    return context
}

export { useSafeConnector }

export default SafeConnectorProvider
