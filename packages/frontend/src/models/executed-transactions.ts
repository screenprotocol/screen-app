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
