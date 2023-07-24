import { ethers } from "ethers"
import { Web3ReactProvider } from "@web3-react/core"
import "./App.css"
import { ChakraProvider, extendTheme } from "@chakra-ui/react"
import Layout from "./components/Layout"
import ConnectButton from "./components/ConnectButton"

function App() {
  function getLibrary(provider: any) {
    const library = new ethers.BrowserProvider(provider)
    library.pollingInterval = 15_000
    return library
  }

  const theme = extendTheme({
    fonts: {
      body: `'Poppins', sans-serif`,
    },
    fontSizes: {
      md: "14px",
    },
  })

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ChakraProvider theme={theme}>
        <Layout>
          <ConnectButton />
        </Layout>
      </ChakraProvider>
    </Web3ReactProvider>
  )
}

export default App
