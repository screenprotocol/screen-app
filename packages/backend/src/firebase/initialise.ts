import admin from 'firebase-admin'
import path from 'path'

const initialiseFirebase = () => {
    if (!process.env.SERVICE_ACCOUNT_KEY_PATH)
        throw new Error('SERVICE_ACCOUNT_KEY_PATH is not set')

    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')

    console.log('------ INITIALISING FIREBASE ------')
    admin.initializeApp({
        credential: admin.credential.cert(
            path.resolve(
                __dirname,
                '../../',
                process.env.SERVICE_ACCOUNT_KEY_PATH,
            ),
        ),
        databaseURL: process.env.DATABASE_URL,
    })
}

export default initialiseFirebase
