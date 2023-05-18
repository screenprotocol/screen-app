import { FirebaseApp, initializeApp } from 'firebase/app'
import {
    Functions,
    connectFunctionsEmulator,
    getFunctions,
} from 'firebase/functions'
import React, { ReactNode, createContext, useEffect, useState } from 'react'

const firebaseConfig = {
    apiKey: 'AIzaSyDKIQRCiF6Jg_adHFxZVfUwv_Ciak3zbd0',
    authDomain: 'screen-connect-b1444.firebaseapp.com',
    projectId: 'screen-connect-b1444',
    storageBucket: 'screen-connect-b1444.appspot.com',
    messagingSenderId: '569907646543',
    appId: '1:569907646543:web:f891640a6cd62138061a3a',
    measurementId: 'G-XKVVB2J1FT',
}

const firebaseApp = initializeApp(firebaseConfig)

interface FirebaseAppContextProps {
    firebaseApp: FirebaseApp
}

interface FirebaseAppProviderProps {
    children: ReactNode
}

const FirebaseAppContext = createContext<FirebaseAppContextProps | undefined>(
    undefined,
)

const FirebaseAppConnectorProvider = ({
    children,
}: FirebaseAppProviderProps) => {
    return (
        <FirebaseAppContext.Provider value={{ firebaseApp }}>
            {children}
        </FirebaseAppContext.Provider>
    )
}

const useFirebaseFunctions = () => {
    const firebaseApp = React.useContext(FirebaseAppContext)
    if (firebaseApp === undefined) {
        throw new Error(
            'useFirebaseFunctions must be used within a FirebaseAppConnectorProvider',
        )
    }

    const [functions, setFunctions] = useState<Functions | null>(null)

    useEffect(() => {
        if (!firebaseApp) return
        const firebaseFUnctions = getFunctions(firebaseApp.firebaseApp)

        if (process.env.REACT_APP_FIREBASE_EMULATOR === 'true')
            connectFunctionsEmulator(
                firebaseFUnctions,
                process.env.REACT_APP_FIREBASE_EMULATOR_HOST || 'localhost',
                Number(process.env.REACT_APP_FIREBASE_EMULATOR_PORT || '5001'),
            )

        setFunctions(firebaseFUnctions)
    }, [firebaseApp])

    return [functions]
}

export { useFirebaseFunctions, FirebaseAppConnectorProvider }
