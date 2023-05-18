import { getFirestore } from 'firebase-admin/firestore'

export const EXECUTED_TRANSACTIONS_COLLECTION = 'executed-transactions'

export type ExecutedTransactions = {
    safeTxHash: string
    taskId: string
    status: 'PENDING' | 'EXECUTED' | 'FAILED'
    createdAt: Date
    executedAt: Date
    transactionHash: string | null
    blockNumber: number | null
    executionDate: Date | null
    reason: string | null
    retry: number | null
}

export const updateExecutedTransaction = async (
    safeTxHash: string,
    executedTransaction: Partial<ExecutedTransactions>,
) => {
    const firestore = getFirestore()
    const executedTransactionsCollection = firestore.collection(
        EXECUTED_TRANSACTIONS_COLLECTION,
    )
    const executedTransactionsDoc =
        executedTransactionsCollection.doc(safeTxHash)

    return executedTransactionsDoc.update(executedTransaction)
}

export const getExecutedTransactions = async (
    safeTxHashes: string[],
): Promise<ExecutedTransactions[]> => {
    const firestore = getFirestore()

    const executedTransactionsCollection = firestore.collection(
        EXECUTED_TRANSACTIONS_COLLECTION,
    )

    const executedTransactionsDocs = (
        await executedTransactionsCollection
            .where('safeTxHash', 'in', safeTxHashes)
            .get()
    ).docs

    return executedTransactionsDocs.map(
        (doc) => doc.data() as ExecutedTransactions,
    )
}

export const getExecutedTransaction = async (
    safeTxHash: string,
): Promise<ExecutedTransactions> => {
    const firestore = getFirestore()
    const executedTransactionsCollection = firestore.collection(
        EXECUTED_TRANSACTIONS_COLLECTION,
    )
    const executedTransactionsDoc =
        executedTransactionsCollection.doc(safeTxHash)

    return (await executedTransactionsDoc.get()).data() as ExecutedTransactions
}

export const createExecutedTransaction = async ({
    safeTxHash,
    taskId,
}: Pick<ExecutedTransactions, 'safeTxHash' | 'taskId'>) => {
    const firestore = getFirestore()
    const executedTransactionsCollection = firestore.collection(
        EXECUTED_TRANSACTIONS_COLLECTION,
    )
    const executedTransactionsDoc =
        executedTransactionsCollection.doc(safeTxHash)
    const executedTransactionsDocData: ExecutedTransactions = {
        safeTxHash: safeTxHash,
        taskId: taskId,
        status: 'PENDING',
        createdAt: new Date(),
        transactionHash: null,
        blockNumber: null,
        executionDate: null,
        reason: null,
        executedAt: new Date(),
        retry: null,
    }

    return executedTransactionsDoc.set(executedTransactionsDocData)
}
