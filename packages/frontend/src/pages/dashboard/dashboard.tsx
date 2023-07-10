import {
    Alert,
    Button,
    ButtonProps,
    CircularProgress,
    Container,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    styled,
} from '@mui/material'
import React, { useEffect, useMemo } from 'react'
import { useSafeConnector } from '../../contexts/safe'
import { useAPis } from '../../hooks/apis'
import { getSafeTransactions } from '../../apis'
import { AllTransactionsListResponse } from '@safe-global/api-kit'
import moment from 'moment'
import SettingsIcon from '../../assets/settings.svg'
import ArrowIn from '../../assets/diagonal-arrow-in.svg'
import ArrowOut from '../../assets/diagonal-arrow-out.svg'
import { ethers } from 'ethers'
import { SVGProps } from 'react'
import { ExecutedTransactions } from '../../models/executed-transactions'
import { useShowNotification } from '../../contexts/notification'

// const svgProps: SVGProps<SVGSVGElement> = {
//     height: 48,
//     viewBox: '0 0 512 177',
// }

type cellWithIcon = {
    Icon: React.FC
    name: string
}

const getDataDecoded = (
    row: AllTransactionsListResponse['results'][number] & { uid: string },
): string => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (row.dataDecoded && row.dataDecoded.method) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return row.dataDecoded.method
    }
    return ''
}

function parseDecimalString(value: number) {
    const roundedValue = value.toFixed(5).replace(/\.?0+$/, '')
    return roundedValue
}

function formatEther(wei: string) {
    const parsedEth = parseFloat(ethers.utils.formatEther(wei))

    if (parsedEth < 0.00001) return '< 0.00001'

    return parseDecimalString(parsedEth)
}

function generateURL(baseURL: string, path: string) {
    const url = new URL(baseURL)
    url.pathname = url.pathname.endsWith('/')
        ? url.pathname + path
        : url.pathname + '/' + path
    return url.href
}

const convertToCellWithIcon = (name: string, url?: string): cellWithIcon => {
    let Icon = SettingsIcon

    if (url) {
        url = generateURL(url, 'favicon.png')
    }

    const svgProps: SVGProps<SVGSVGElement> = {
        height: 20,
        fill: '#f8fafc',
    }
    if (url) {
        return {
            Icon: () => <img src={url} alt={name} height={20} />,
            name,
        }
    }

    switch (name) {
        case 'Contract Interaction':
            Icon = SettingsIcon
            break
        case 'Sent':
            svgProps.height = 18
            svgProps.fill = 'red'
            Icon = ArrowOut
            break
        case 'Received':
            svgProps.fill = '#40eebd'
            Icon = ArrowIn
            break
    }

    return {
        Icon: () => <Icon {...svgProps} />,
        name,
    }
}

const formatRowTransfer = (
    row: AllTransactionsListResponse['results'][number] & {
        uid: string
        safeAddress: string
    },
): [cellWithIcon, cellWithIcon] => {
    let interaction = '',
        functionCall = ''
    if (!row.transfers || !row.transfers[0]) {
        interaction = getDataDecoded(row)
        functionCall = ''
        return [
            convertToCellWithIcon(interaction),
            convertToCellWithIcon(functionCall),
        ]
    }
    if (row.transfers[0].from === row.safeAddress) {
        interaction = 'Sent'
        functionCall =
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            row.transfers[0].type === 'ETHER_TRANSFER'
                ? 'ETH'
                : row.transfers[0].tokenInfo.symbol
        functionCall = formatEther(row.transfers[0].value) + ' ' + functionCall
        return [
            convertToCellWithIcon(interaction),
            convertToCellWithIcon(functionCall),
        ]
    }
    if (row.transfers[0].to === row.safeAddress) {
        interaction = 'Received'
        functionCall =
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            row.transfers[0].type === 'ETHER_TRANSFER'
                ? 'ETH'
                : row.transfers[0].tokenInfo.symbol
        functionCall = formatEther(row.transfers[0].value) + ' ' + functionCall
        return [
            convertToCellWithIcon(interaction),
            convertToCellWithIcon(functionCall),
        ]
    }
    return [convertToCellWithIcon(''), convertToCellWithIcon('')]
}

const getTransactionInteraction = (
    row: AllTransactionsListResponse['results'][number] & {
        uid: string
        safeAddress: string
    },
): [cellWithIcon, cellWithIcon] => {
    let interaction = '',
        functionCall = ''
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (row.origin && JSON.parse(row.origin).name) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        interaction = JSON.parse(row.origin).name

        if (getDataDecoded(row)) functionCall = getDataDecoded(row)

        return [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            convertToCellWithIcon(interaction, JSON.parse(row.origin).url),
            convertToCellWithIcon(functionCall),
        ]
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!row.nonce) {
        if (getDataDecoded(row)) {
            interaction = 'Contract Interaction'
            functionCall = getDataDecoded(row)
            return [
                convertToCellWithIcon(interaction),
                convertToCellWithIcon(functionCall),
            ]
        }
        if (row.transfers) {
            return formatRowTransfer(row)
        }
    }

    if (getDataDecoded(row)) {
        interaction = getDataDecoded(row)
        functionCall = ''
        if (interaction === 'transfer') {
            return formatRowTransfer(row)
        }
        return [
            convertToCellWithIcon(interaction),
            convertToCellWithIcon(functionCall),
        ]
    }

    if (row.data === null)
        return [
            convertToCellWithIcon('On-chain rejection'),
            convertToCellWithIcon(''),
        ]
    if (row.txType === 'MULTISIG_TRANSACTION') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return row.dataDecoded && row.dataDecoded.method
            ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              row.dataDecoded.method
            : '-'
    }
    return [convertToCellWithIcon(''), convertToCellWithIcon('')]
}

function Row({
    row,
}: {
    row: AllTransactionsListResponse['results'][number] & {
        uid: string
        safeAddress: string
        isScreenForwardedTrxn: boolean
        screenStatus: ExecutedTransactions['status']
    }
}) {
    const [dataDecoded, functionCall] = useMemo<
        [cellWithIcon, cellWithIcon]
    >(() => {
        return getTransactionInteraction(row)
    }, [row])

    const time = useMemo(() => {
        return moment(row.executionDate).format('h:mm A')
    }, [row])

    const statusColor = useMemo(() => {
        if (row.screenStatus === 'EXECUTED') return '#40eebd'
        if (row.screenStatus === 'FAILED') return 'red'
        if (row.screenStatus === 'PENDING') return 'yellow'
        return 'GrayText'
    }, [row])

    return (
        <React.Fragment>
            <TableRow>
                <TableCell>
                    <Typography variant="body1">
                        {row.txType === 'MULTISIG_TRANSACTION' ? row.nonce : ''}
                    </Typography>
                </TableCell>
                <TableCell component="th" scope="row">
                    <Stack direction="row" spacing={2} alignItems="center">
                        {dataDecoded.Icon && <dataDecoded.Icon />}
                        <Typography variant="body1">
                            {dataDecoded.name}
                        </Typography>
                    </Stack>
                </TableCell>
                <TableCell>
                    <Typography variant="body1">{functionCall.name}</Typography>
                </TableCell>
                <TableCell align="center">
                    <Typography variant="body1">{time}</Typography>
                </TableCell>
                <TableCell align="right">
                    <Stack
                        direction="row"
                        justifyContent="flex-end"
                        alignItems="center"
                        sx={{ cursor: 'pointer' }}
                    >
                        <Typography variant="body1" color={statusColor}>
                            {row.screenStatus ? row.screenStatus : 'NA'}
                        </Typography>
                    </Stack>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}

const ColorButton = styled(Button)<ButtonProps>(({ theme }) => ({
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.text.primary,
    '&:hover': {
        backgroundColor: theme.palette.text.secondary,
    },
}))

const Dashboard = () => {
    const { safe, savedSafe, enableSafe, loaderCallback, completeState } =
        useSafeConnector()

    const [showNotification] = useShowNotification()

    const [loader, setLoader] = React.useState<boolean>(false)

    const { loading, response } = useAPis<typeof getSafeTransactions>({
        api: getSafeTransactions,
        args: [safe.safeAddress],
        instantCall: true,
    })

    const safeStatus = useMemo(() => {
        if (!savedSafe) return 'PENDING'
        return savedSafe.status
    }, [savedSafe])

    const handleEnableScreenClick = () => {
        setLoader(true)
        enableSafe()
    }

    useEffect(() => {
        if (!loader) return
        if (!completeState || loaderCallback) return
        const { error, message } = completeState
        if (error) {
            showNotification({
                message: message || 'something went wrong',
                notificationSeverity: 'error',
            })
            setLoader(false)
            return
        }
        showNotification({
            message: "Congrats! You've enabled your Safe",
        })
        setLoader(false)
    }, [loader, completeState, loaderCallback, showNotification, setLoader])

    const rows = useMemo(() => {
        return (
            response?.transactions.results.map((tx) => {
                let uid = ''

                if (tx.txType === 'ETHEREUM_TRANSACTION') {
                    uid = `${tx.txHash}`
                }

                if (tx.txType === 'MODULE_TRANSACTION') {
                    uid = `${tx.transactionHash}-${tx.data}`
                }

                if (tx.txType === 'MULTISIG_TRANSACTION') {
                    uid = tx.safeTxHash
                }
                if (tx.transfers && tx.transfers.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    uid = uid + tx.transfers[0].transferId
                }

                return {
                    ...tx,
                    uid: uid,
                    safeAddress: safe.safeAddress,
                }
            }) || []
        )
    }, [response])

    return (
        <Container sx={{ pt: 12, pb: 16 }}>
            {safeStatus === 'PENDING' && (
                <Alert severity="warning">
                    <Typography variant="body1">
                        We are still initializing your Safe. Your safe will be
                        enabled once we have confirmation from the blockchain.
                    </Typography>
                </Alert>
            )}

            {safeStatus === 'DISABLED' && (
                <Alert severity="error">
                    <Stack spacing={2} direction="row" alignItems="center">
                        <Typography variant="body1">
                            Your Safe is disabled. Please enable it to continue.
                        </Typography>
                        <ColorButton
                            onClick={handleEnableScreenClick}
                            variant="contained"
                            disabled={loader}
                        >
                            Enable Screen
                            {loader && (
                                <CircularProgress
                                    size={24}
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        marginTop: '-12px',
                                        marginLeft: '-12px',
                                    }}
                                />
                            )}
                        </ColorButton>
                    </Stack>
                </Alert>
            )}

            {safeStatus === 'ENABLED' && (
                <Alert severity="info">
                    <Typography variant="body1">
                        Your Safe is enabled.
                    </Typography>
                </Alert>
            )}

            <Typography variant="h4" sx={{ mb: 4, mt: 2 }}>
                Transactions
            </Typography>
            <TableContainer component={Paper} sx={{ p: 4 }}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="body1">Nonce</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body1">
                                    Interaction
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body1">
                                    Function call
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="body1">Time</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="body1">
                                    Screen transaction status
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <Stack
                                        mt={5}
                                        direction="column"
                                        justifyContent="center"
                                        alignItems="center"
                                    >
                                        <CircularProgress color="secondary" />
                                        <Typography
                                            color="text.secondary"
                                            variant="subtitle2"
                                            sx={{ mt: 4 }}
                                        >
                                            Loading...
                                        </Typography>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading &&
                            rows.map((row) => <Row key={row.uid} row={row} />)}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    )
}

export default Dashboard
