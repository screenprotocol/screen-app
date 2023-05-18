import axios from 'axios'
import { Safe } from '../models/safes'
import { AllTransactionsListResponse } from '@safe-global/api-kit'
import { ExecutedTransactions } from '../models/executed-transactions'

axios.defaults.baseURL = 'http://localhost:8000/api/v1'

type ValidationError = {
    /**
     * Indicates that the error occurred because a field had an invalid value
     */
    type: 'field'
    /**
     * The location within the request where this field is
     */
    location: Location
    /**
     * The path to the field which has a validation error
     */
    path: string
    /**
     * The value of the field
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
    /**
     * The error message
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg: any
}

export const createSafe = async (
    address: string,
    chainId: number,
    trxn: string,
) => {
    try {
        const response = await axios.post<{
            errors?: Array<ValidationError>
            data?: Safe
        }>(`/safe/${address}`, {
            chainId,
            trxn,
        })
        if (response.data.errors) {
            throw response.data.errors
        }
        return response.data.data
    } catch (error) {
        throw [error]
    }
}

export const getSafe = async (address: string) => {
    return axios
        .get<{
            errors?: Array<ValidationError>
            data?: Safe
        }>(`/safe/${address}`)
        .then((response) => {
            if (response.data.errors) {
                throw response.data.errors
            }

            return response.data.data
        })
        .catch((error) => {
            throw [error]
        })
}

export const getSafeTransactions = async (address: string) => {
    return axios
        .get<{
            errors?: Array<ValidationError>
            data?: {
                safe: Safe
                transactions: Omit<AllTransactionsListResponse, 'results'> & {
                    results: Array<
                        AllTransactionsListResponse['results'][number] & {
                            isScreenForwardedTrxn: boolean
                            screenStatus: ExecutedTransactions['status']
                        }
                    >
                }
            }
        }>(`/safe/${address}/transactions`)
        .then((response) => {
            if (response.data.errors) {
                throw response.data.errors
            }

            return response.data.data
        })
        .catch((error) => {
            throw [error]
        })
}
