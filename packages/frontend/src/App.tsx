import React, { useEffect } from 'react'
import {
    Toolbar,
    Theme,
    ThemeProvider,
    createTheme,
    CssBaseline,
} from '@mui/material'
import Home from './pages/home'
import GilroyBold from './assets/fonts/gilroy-bold.ttf'
import GilroyRegular from './assets/fonts/gilroy-regular.ttf'
import { FirebaseAppConnectorProvider } from './contexts/firebase'
import {
    RouterProvider,
    createBrowserRouter,
    useNavigate,
} from 'react-router-dom'
import Dashboard from './pages/dashboard'
import SafeConnectorProvider, { useSafeConnector } from './contexts/safe'
import ShowNotificationProvider from './contexts/notification'
import Root from './pages/root'
import Header from './components/header'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}): React.ReactElement => {
    const navigate = useNavigate()
    const { safe } = useSafeConnector()

    useEffect(() => {
        console.log(safe, 'savedSafe - app protected route')
        if (!safe) {
            console.log('REDIRECTING')
            navigate('/')
        }
    }, [navigate, safe])

    return <>{children}</>
}

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <>
                <CssBaseline />
                <Header />
                <Toolbar />
                <Root />
            </>
        ),
    },
    {
        path: '/home',
        element: (
            <ProtectedRoute>
                <CssBaseline />
                <Header />
                <Toolbar />
                <Home />
            </ProtectedRoute>
        ),
    },
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <CssBaseline />
                <Header />
                <Toolbar />
                <Dashboard />
            </ProtectedRoute>
        ),
    },
])

export const customTheme: Theme = createTheme({
    typography: {
        fontFamily: [
            'Gilroy',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
        @font-face {
            font-family: 'Gilroy';
            src: url(${GilroyBold}) format('truetype');
            font-weight: 600;
            font-style: normal;
        }
        @font-face {
            font-family: 'Gilroy';
            src: url(${GilroyRegular}) format('truetype');
            font-weight: 500;
            font-style: normal;
        }
        `,
        },
    },
    palette: {
        mode: 'dark',
        primary: {
            main: '#0F172A',
            light: 'rgb(63, 69, 84)',
            dark: 'rgb(10, 16, 29)',
        },
        secondary: {
            main: '#F8FAFC',
            contrastText: '#3874CB',
        },

        background: {
            default: '#0F172A',
            paper: '#1F2839',
        },
        text: {
            primary: '#F8FAFC',
            secondary: 'rgba(248,250,252,0.8)',
        },
    },
})

const SafeApp = (): React.ReactElement => {
    return (
        <FirebaseAppConnectorProvider>
            <ThemeProvider theme={customTheme}>
                <SafeConnectorProvider>
                    <ShowNotificationProvider>
                        <RouterProvider router={router} />
                    </ShowNotificationProvider>
                </SafeConnectorProvider>
            </ThemeProvider>
        </FirebaseAppConnectorProvider>
    )
}

export default SafeApp
