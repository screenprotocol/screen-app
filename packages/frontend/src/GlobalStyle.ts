import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
    html {
        height: 100%;
        font-family: 'DM Sans', sans-serif;
    }

    body {
       height: 100%;
       margin: 0px;
       padding: 0px;
       background: rgb(10, 16, 29);
    }

    #root {
        height: 100%;
    }
`

export default GlobalStyle
