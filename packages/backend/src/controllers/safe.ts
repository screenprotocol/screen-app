import { Request, Response } from 'express'
import {
    ValidationError,
    body,
    param,
    validationResult,
} from 'express-validator'
import { ethers } from 'ethers'
import { Safe, createSAFE, getSAFE, updateSAFE } from '@/models/safe'
import { SafeApiKitWrapper } from '@/safe-kit-wrapper'
import {
    AllTransactionsListResponse,
    SafeMultisigTransactionWithTransfersResponse,
} from '@safe-global/api-kit'
import { getExecutedTransactions } from '@/models/executed-transactions'
import { ExecutedTransactions } from '@/models/executed-transactions'

export const get = () => [
    param('address')
        .notEmpty()
        .withMessage('address is required')
        .trim()
        .custom((address) => ethers.utils.isAddress(address))
        .withMessage('Invalid address'),
    async (
        req: Request<{ address: string }>,
        res: Response<{
            errors?: Array<ValidationError>
            data?: Safe
        }>,
    ) => {
        if (!process.env.SPONSOR_GAS_MODULE_ADDRESS)
            throw new Error('SPONSOR_GAS_MODULE_ADDRESS not set')
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.send({ errors: result.array() })
        }

        const { address } = req.params

        const safe = await getSAFE(address)

        res.json({
            data: safe,
        })
    },
]

export const create = () => [
    param('address')
        .notEmpty()
        .withMessage('address is required')
        .trim()
        .custom((address) => ethers.utils.isAddress(address))
        .withMessage('Invalid address'),
    body('chainId')
        .notEmpty()
        .withMessage('chainId is required')
        .isNumeric()
        .withMessage('Invalid chainId'),
    body('trxn')
        .notEmpty()
        .withMessage('trxn is required')
        .isString()
        .withMessage('Invalid trxn'),
    async (
        req: Request<{ address: string }, { chainId: number }>,
        res: Response<{
            errors?: Array<ValidationError>
            data?: Safe
        }>,
    ) => {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.send({ errors: result.array() })
        }
        const { address } = req.params
        const { chainId, trxn } = req.body

        await createSAFE({ address, chainId, trxn })

        res.json({
            data: await getSAFE(address),
        })
    },
]

export const getTransactions = () => [
    param('address')
        .notEmpty()
        .withMessage('address is required')
        .trim()
        .custom((address) => ethers.utils.isAddress(address))
        .withMessage('Invalid address'),
    async (
        req: Request<{ address: string }>,
        res: Response<{
            errors?: Array<ValidationError>
            data?: {
                safe: Safe
                transactions: Omit<AllTransactionsListResponse, 'results'> & {
                    results: Array<
                        AllTransactionsListResponse['results'][number] & {
                            isScreenForwardedTrxn: boolean
                            screenStatus: ExecutedTransactions['status'] | 'NA'
                        }
                    >
                }
            }
        }>,
    ) => {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.send({ errors: result.array() })
        }
        const { address } = req.params

        const safe = await getSAFE(address)

        const safeService = new SafeApiKitWrapper(safe.chainId)

        const transactions = await safeService.getAllTransactions(safe.address)

        const screenForwardedTransactions = (
            await getExecutedTransactions(
                transactions.results.reduce<string[]>(
                    (r, tx) => [
                        ...r,
                        ...(tx.txType === 'MULTISIG_TRANSACTION'
                            ? [tx.safeTxHash]
                            : []),
                    ],
                    [],
                ),
            )
        ).reduce<{ [key: string]: ExecutedTransactions['status'] }>(
            (r, tx) => ({ ...r, [tx.safeTxHash]: tx.status }),
            {},
        )

        res.json({
            data: {
                safe,
                transactions: {
                    ...transactions,
                    results: transactions.results.reduce(
                        (
                            result: Array<
                                AllTransactionsListResponse['results'][number] & {
                                    isScreenForwardedTrxn: boolean
                                    screenStatus:
                                        | ExecutedTransactions['status']
                                        | 'NA'
                                }
                            >,
                            tx,
                        ) => {
                            const prev = result.length - 1
                            if (
                                prev < 0 ||
                                result[prev].txType !==
                                    'MULTISIG_TRANSACTION' ||
                                tx.txType !== 'MULTISIG_TRANSACTION' ||
                                (
                                    result[
                                        prev
                                    ] as SafeMultisigTransactionWithTransfersResponse
                                ).nonce !== tx.nonce
                            ) {
                                if (tx.transfers && tx.transfers.length > 1) {
                                    tx.transfers.map((transfer) => {
                                        result.push({
                                            ...tx,
                                            transfers: [transfer],
                                            screenStatus:
                                                tx.txType ===
                                                'MULTISIG_TRANSACTION'
                                                    ? screenForwardedTransactions[
                                                          tx.safeTxHash
                                                      ]
                                                    : 'NA',
                                            isScreenForwardedTrxn: Boolean(
                                                tx.txType ===
                                                    'MULTISIG_TRANSACTION' &&
                                                    screenForwardedTransactions[
                                                        tx.safeTxHash
                                                    ],
                                            ),
                                        })
                                    })
                                } else {
                                    result.push({
                                        ...tx,
                                        screenStatus:
                                            tx.txType === 'MULTISIG_TRANSACTION'
                                                ? screenForwardedTransactions[
                                                      tx.safeTxHash
                                                  ]
                                                : 'NA',
                                        isScreenForwardedTrxn: Boolean(
                                            tx.txType ===
                                                'MULTISIG_TRANSACTION' &&
                                                screenForwardedTransactions[
                                                    tx.safeTxHash
                                                ],
                                        ),
                                    })
                                }
                            }

                            return result
                        },
                        [],
                    ),
                },
            },
        })
    },
]
