import React, { useEffect } from 'react'
import { useSafeConnector } from '../../contexts/safe'
import { useNavigate } from 'react-router-dom'
import { CircularProgress, Container, Stack, Typography } from '@mui/material'

const Root = () => {
    const navigate = useNavigate()

    const { loadingSavedState, savedSafe } = useSafeConnector()

    useEffect(() => {
        if (loadingSavedState) return
        console.log(savedSafe, 'savedSafe - root')
        if (savedSafe) {
            navigate('/dashboard')
        } else {
            navigate('/home')
        }
    }, [loadingSavedState, navigate, savedSafe])

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
            <Stack display="flex" justifyContent="center" alignItems="center">
                <CircularProgress color="secondary" size={38} />
                <Typography
                    color="text.secondary"
                    variant="subtitle2"
                    sx={{ mt: 4 }}
                >
                    Detecting safe...
                </Typography>
            </Stack>
        </Container>
    )
}

export default Root
