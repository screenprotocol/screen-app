import React, { SVGProps, useEffect, useMemo } from 'react'
import {
    AppBar,
    Box,
    Button,
    CircularProgress,
    Container,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material'
import Logo from '../../assets/logo-long.svg'
import { useSafeConnector } from '../../contexts/safe'
import { useShowNotification } from '../../contexts/notification'

const svgProps: SVGProps<SVGSVGElement> = {
    height: 48,
    viewBox: '0 0 512 177',
}

const Header = () => {
    const [showNotification] = useShowNotification()
    const { savedSafe, disableSafe, completeState, loaderCallback } =
        useSafeConnector()

    const safeEnabled = useMemo(() => {
        return savedSafe && savedSafe.status === 'ENABLED'
    }, [savedSafe])

    useEffect(() => {
        if (!completeState || loaderCallback) return
        const { error, message } = completeState
        if (error) {
            showNotification({
                message: message || 'something went wrong',
                notificationSeverity: 'error',
            })
            return
        }
        showNotification({
            message: 'Your SAFE has been disabled.',
        })
    }, [completeState, loaderCallback, showNotification])

    return (
        <AppBar
            position="fixed"
            color="primary"
            enableColorOnDark
            component="nav"
            sx={{ backgroundImage: 'none' }}
        >
            <Container disableGutters={true}>
                <Toolbar>
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Logo {...svgProps} />
                    </Box>
                    {!safeEnabled ? (
                        <Button sx={{ color: 'text.primary' }}>
                            how it works?
                        </Button>
                    ) : (
                        <Button sx={{ color: 'text.primary' }}>help?</Button>
                    )}
                    {!safeEnabled ? (
                        <Button sx={{ color: 'text.primary' }}>
                            whitepaper
                        </Button>
                    ) : (
                        <Button
                            disabled={loaderCallback}
                            onClick={disableSafe}
                            sx={{ color: 'text.primary' }}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                            >
                                <Typography variant="body2">
                                    disable screen
                                </Typography>
                                {loaderCallback && (
                                    <CircularProgress
                                        color="secondary"
                                        size={18}
                                    />
                                )}
                            </Stack>
                        </Button>
                    )}
                    {/* <SvgIcon component={Logo} viewBox="0 0 600 476.6" /> */}
                </Toolbar>
            </Container>
        </AppBar>
    )
}

export default Header
