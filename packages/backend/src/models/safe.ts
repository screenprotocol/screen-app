import { getFirestore } from 'firebase-admin/firestore'

export const SAFE_COLLECTION = 'safes'

export type Safe = {
    address: string
    chainId: number
    /**
     * ENABLED: Safe Module is enabled by the user
     * DISABLED: Safe Module is disabled by the user
     * PAUSED: Safe is paused by the system
     * PENDING: Safe is pending for the system to enable - awaiting module enable transactio
     */
    status: 'ENABLED' | 'DISABLED' | 'PAUSED' | 'PENDING'
    trxn: string
}

export const getAllSafe = async (): Promise<Safe[]> => {
    const firestore = getFirestore()
    const safeCollection = firestore.collection(SAFE_COLLECTION)

    return (await safeCollection.get()).docs.map((doc) => doc.data() as Safe)
}

export const getEnabledSafe = async (): Promise<Safe[]> => {
    const firestore = getFirestore()
    const safeCollection = firestore.collection(SAFE_COLLECTION)
    const query = safeCollection.where('status', '==', 'ENABLED')

    return (await query.get()).docs.map((doc) => doc.data() as Safe)
}

export const getSAFE = async (address: string): Promise<Safe> => {
    const firestore = getFirestore()
    const safeCollection = firestore.collection(SAFE_COLLECTION)
    const safeDoc = safeCollection.doc(address)

    return (await safeDoc.get()).data() as Safe
}

export const updateSAFE = async (address: string, safe: Partial<Safe>) => {
    const firestore = getFirestore()
    const safeCollection = firestore.collection(SAFE_COLLECTION)
    const safeDoc = safeCollection.doc(address)

    return safeDoc.update(safe)
}

export const createSAFE = async ({
    address,
    chainId,
    trxn,
}: {
    address: string
    chainId: number
    trxn: string
}) => {
    const firestore = getFirestore()
    const safeCollection = firestore.collection(SAFE_COLLECTION)
    const safeDoc = safeCollection.doc(address)
    const safeDocData: Safe = {
        address: address,
        chainId: chainId,
        status: 'PENDING',
        trxn: trxn,
    }

    return safeDoc.set(safeDocData)
}
