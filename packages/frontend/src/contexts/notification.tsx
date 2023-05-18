import { Alert, Snackbar } from '@mui/material'
import { createContext, useCallback, useContext, useState } from 'react'

export type notificationSeverityType = 'error' | 'warning' | 'info' | 'success'
export type anchorOriginType = {
    vertical: 'top' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
}

export type notificationConfigurationType = {
    open: boolean
    message?: string
    notificationSeverity?: notificationSeverityType
    anchorOrigin?: anchorOriginType
    onNotificationClose?: () => void
}

export type useNotificationReturnType = [
    showNotification: ReturnType<
        typeof useCallback<
            (
                notificationConfiguration: Omit<
                    notificationConfigurationType,
                    'open'
                >,
            ) => void
        >
    >,
]

const ShowNotificationContext = createContext<
    useNotificationReturnType | undefined
>(undefined)

interface ShowNotificationProviderProps {
    children: React.ReactNode
}

const ShowNotificationProvider: React.FC<ShowNotificationProviderProps> = ({
    children,
}) => {
    const [notificationConfiguration, setsnackbarConfiguration] =
        useState<notificationConfigurationType>({
            open: false,
        })

    const handleSnackbarClose = useCallback(() => {
        setsnackbarConfiguration({
            open: false,
        })
        notificationConfiguration.onNotificationClose?.()
    }, [notificationConfiguration])

    const showNotification = useCallback(
        ({
            notificationSeverity,
            message,
            anchorOrigin = {
                vertical: 'top',
                horizontal: 'center',
            },
            onNotificationClose,
        }: Omit<notificationConfigurationType, 'open'>) => {
            setsnackbarConfiguration({
                open: true,
                message,
                notificationSeverity,
                onNotificationClose,
                anchorOrigin,
            })
        },
        [setsnackbarConfiguration],
    )

    return (
        <ShowNotificationContext.Provider value={[showNotification]}>
            {children}
            {notificationConfiguration.open ? (
                <Snackbar
                    anchorOrigin={notificationConfiguration.anchorOrigin}
                    open={notificationConfiguration.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        variant="filled"
                        severity={
                            notificationConfiguration.notificationSeverity
                        }
                        sx={{ width: '100%' }}
                    >
                        {notificationConfiguration.message ||
                            'Something went wrong'}
                    </Alert>
                </Snackbar>
            ) : null}
        </ShowNotificationContext.Provider>
    )
}

const useShowNotification = () => {
    const context = useContext(ShowNotificationContext)
    if (context === undefined) {
        throw new Error(
            'useShowNotification must be used within a ShowNotificationProvider',
        )
    }
    return context
}

export { useShowNotification }

export default ShowNotificationProvider
