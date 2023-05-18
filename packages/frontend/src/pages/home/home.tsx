import React, { useCallback, useEffect } from 'react'
import {
    Box,
    CircularProgress,
    Container,
    Typography,
    useTheme,
} from '@mui/material'
import styled, { keyframes } from 'styled-components'
import { useSafeConnector } from '../../contexts/safe'
import { useNavigate } from 'react-router-dom'
import { useShowNotification } from '../../contexts/notification'

const shine = keyframes`
    0% {
        background-position: -200% 0%;
        background-size: 200% 100%;
    }
    50% {
        background-position: 200% 0%;
        background-size: 50% 100%;
    }
    100% {
        background-position: -200% 0%;
        background-size: 200% 100%;
    }
`

const ShinyGoldTypography = styled(Typography)`
    background: linear-gradient(to right, #ffd700, #ffdf00, #ffea00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${shine} 2s linear infinite;
`

const Home: React.FC = () => {
    const theme = useTheme()
    const navigate = useNavigate()

    const [showNotification] = useShowNotification()

    const [loader, setLoader] = React.useState<boolean>(false)

    const { enableSafe, loaderCallback, completeState } = useSafeConnector()

    const handleEnableSafeClick = useCallback(async () => {
        setLoader(true)
        await enableSafe()
    }, [enableSafe])

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
            message: "Congrats! You've enabled your Safe",
        })
        navigate('/dashboard')
        setLoader(false)
    }, [completeState, loaderCallback, navigate, showNotification])

    return (
        <Container
            sx={{
                height: 'calc(100% - 64px)',
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
            }}
        >
            <Typography
                sx={{ textAlign: 'center', fontWeight: 600 }}
                variant="h1"
                color="text.primary"
            >
                enable paying gas for SAFE via SAFE.
            </Typography>

            <Typography
                sx={{ textAlign: 'center', mt: 2, fontWeight: 600 }}
                variant="h5"
                color="text.primary"
            >
                you don't need to keep funds in your EOA owner anymore, just
                sign and your SAFE will pay for gas
            </Typography>
            <ShinyGoldTypography
                sx={{ textAlign: 'center', mt: 2 }}
                variant="body1"
                color="secondary.contrastText"
            >
                paying in other erc20 tokens coming soon
            </ShinyGoldTypography>
            <Box
                component="button"
                sx={{
                    width: 320,
                    height: 74,
                    background: theme.palette.text.primary,
                    borderRadius: 50,
                    mt: 8,
                    cursor: 'pointer',
                }}
                display="flex"
                justifyContent="center"
                alignItems="center"
                onClick={handleEnableSafeClick}
            >
                {loader ? (
                    <CircularProgress size={32} color="primary" />
                ) : (
                    <Typography
                        sx={{ textAlign: 'center', fontWeight: 600 }}
                        variant="h5"
                        color="primary.main"
                    >
                        Enable Screen
                    </Typography>
                )}
            </Box>
        </Container>
    )
}

export default Home
