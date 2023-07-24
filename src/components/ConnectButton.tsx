import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import {
  Button,
  Box,
  Text,
  Input,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react"
import { useDisclosure, useToast } from "@chakra-ui/react"
import abi from "./abi.json"
import axios from "axios"

declare global {
  interface Window {
    ethereum: any
  }
}

export default function ConnectButton() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [connected, setConnected] = useState<boolean>(false)
  const [balance, setBalance] = useState<string>("0")
  const [account, setAccount] = useState<string | null>(null)
  const [babyBalance, setBabyBalance] = useState<string>("0")
  const [mode, setMode] = useState<string>("BNB")
  const [recieverAdd, setRecieverAdd] = useState<string>("")
  const [sendAmount, setSendAmount] = useState<number>(0)
  const [gasFee, setGasFee] = useState<string>("")
  const [gasLimit, setGasLimit] = useState<number>(0)
  const toast = useToast()

  useEffect(() => {
    if (account) {
      setConnected(true)
      console.log("account", account)
    } else {
      setConnected(false)
    }
  }, [account])

  async function handleConnectWallet() {
    if (!connected) {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        try {
          await window.ethereum.enable()
          const signer = await provider.getSigner()
          const account = await signer.getAddress()
          setAccount(account)
          setConnected(true)
        } catch (err) {
          console.error("Error connecting to wallet", err)
          setConnected(false)
        }
      } else {
        console.log("Please install MetaMask!")
      }
    } else {
      setConnected(false)
    }
  }

  function handleMode() {
    setMode(mode === "BNB" ? "BabyDoge" : "BNB")
  }

  function handleChangeAddress(event: any) {
    setRecieverAdd(event.target.value)
  }

  function handleChangeAmount(event: any) {
    setSendAmount(event.target.value)
  }

  async function handleOpenModal() {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    if (!recieverAdd) {
      return toast({
        description: "Please input Receiver Address",
        status: "error",
      })
    }
    if (!sendAmount || sendAmount === 0) {
      return toast({
        description: "Please input send amount",
        status: "error",
      })
    }

    const tx = {
      to: recieverAdd,
      value: sendAmount,
    }

    const estimatedGas = await signer.estimateGas(tx)
    setGasLimit(Number(ethers.formatUnits(estimatedGas, "gwei")))

    const feeData = await signer.provider.getFeeData()

    if (feeData && feeData.gasPrice) {
      const maxFeePerGas = ethers.formatUnits(feeData.gasPrice, "gwei")
      setGasFee(maxFeePerGas)
    }

    onOpen()
  }

  const sendBaby = useCallback(async () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const contract = new ethers.Contract(
      "0xc748673057861a797275CD8A068AbB95A902e8de",
      abi,
      signer
    )

    // Approve the contract to spend on your behalf
    let approveTx = await contract.approve(
      "0xc748673057861a797275CD8A068AbB95A902e8de",
      ethers.parseUnits(sendAmount.toString(), 18)
    )

    const approveReceipt = await approveTx.wait()

    if (approveReceipt.status) {
      let transferTx = await contract.transfer(
        recieverAdd,
        ethers.parseUnits(sendAmount.toString(), 18)
      )

      const transferReceipt = await transferTx.wait()
      const from = transferReceipt.from
      const to = transferReceipt.to
      const value = sendAmount
      const txnHash = transferReceipt.hash
      const blockNumber = transferReceipt.blockNumber
      const status = transferReceipt.status ? "Success" : "Failed"

      axios
        .post("http://localhost:4000/api/v1/blockchainTransaction", {
          from,
          to,
          value,
          txnHash,
          blockNumber,
          status,
        })
        .then((res) => console.log(res.data))
        .catch((err) => console.error(err))
    } else {
      console.log("Approval failed.")
    }
  }, [sendAmount, recieverAdd])

  function fromWei(
    web3: { utils: { fromWei: (arg0: any) => any } },
    val: { toString: () => any }
  ) {
    if (val) {
      val = val.toString()
      return web3.utils.fromWei(val)
    } else {
      return "0"
    }
  }

  function toGWei(web3: any, val: string) {
    if (val) {
      return web3.utils.fromWei(val, "gwei")
    } else {
      return "0"
    }
  }

  const valueload = useCallback(async () => {
    if (connected) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(
        "0xc748673057861a797275CD8A068AbB95A902e8de", // BabyDoge Contract Address
        abi, // ABI of BabyDoge
        await provider.getSigner()
      )

      if (account) {
        const value = await provider.getBalance(account)
        setBalance(ethers.formatEther(value))

        try {
          const babyDogeValue = await contract.balanceOf(account)
          setBabyBalance(ethers.formatUnits(babyDogeValue, 18))
        } catch (err) {
          console.error("Error retrieving balance", err)
        }
      }
    }
  }, [account, connected])

  const sendAction = useCallback(async () => {
    let from = account
    let to = recieverAdd
    let value = sendAmount
    let txnHash, blockNumber, status

    if (mode === "BNB") {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const txParams: any = {
        to: recieverAdd,
        value: ethers.parseEther(sendAmount.toString()),
      }

      const tx = await signer.sendTransaction(txParams)
      txnHash = tx.hash

      const receipt = await tx.wait()
      console.log(
        `Transaction has been mined in block: ${receipt?.blockNumber}`
      )
      blockNumber = receipt?.blockNumber
      status = receipt?.status ? "Success" : "Failed"
    } else if (mode === "BabyDoge") {
      await sendBaby()
    }

    axios
      .post("http://localhost:4000/api/v1/blockchainTransaction", {
        from,
        to,
        value,
        txnHash,
        blockNumber,
        status,
      })
      .then((res) => console.log(res.data))
      .catch((err) => console.error(err))

    onClose()
    valueload()
  }, [onClose, recieverAdd, sendAmount, valueload, mode, sendBaby, account])

  useEffect(() => {
    connected && valueload()
  }, [account, connected, valueload])

  return (
    <>
      <h1 className="title">Metamask login demo from Enva Division</h1>
      {account ? (
        <Box
          display="block"
          alignItems="center"
          background="white"
          borderRadius="xl"
          p="4"
          width="300px"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              Account:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {`${account.slice(0, 6)}...${account.slice(
                account.length - 4,
                account.length
              )}`}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BabyDoge Balance :
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {babyBalance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB Balance:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {balance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB / BabyDoge
            </Text>
            <Switch size="md" value={mode} onChange={handleMode} />
          </Box>
          <Box
            display="block"
            justifyContent="space-between"
            alignItems="center"
            mb="4"
          >
            <Text color="#158DE8" fontWeight="medium">
              Send {mode}:
            </Text>
            <Input
              bg="#EBEBEB"
              size="lg"
              value={recieverAdd}
              onChange={handleChangeAddress}
            />
          </Box>
          <Box display="flex" alignItems="center" mb="4">
            <Input
              bg="#EBEBEB"
              size="lg"
              value={sendAmount}
              onChange={handleChangeAmount}
            />
            <Button
              onClick={handleOpenModal}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              ml="2"
              border="1px solid transparent"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Send
            </Button>
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Button
              onClick={handleConnectWallet}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              border="1px solid transparent"
              width="300px"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Disconnect Wallet
            </Button>
          </Box>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Are you Sure?</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <div>
                  Are you sure {sendAmount} {mode} to {recieverAdd} user?
                </div>
                <div>Gas Limit: {gasLimit}</div>
                <div>Gas Price: {gasFee}</div>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button variant="ghost" onClick={sendAction}>
                  Send
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      ) : (
        <Box bg="white" p="4" borderRadius="xl">
          <Button
            onClick={handleConnectWallet}
            bg="#158DE8"
            color="white"
            fontWeight="medium"
            borderRadius="xl"
            border="1px solid transparent"
            width="300px"
            _hover={{
              borderColor: "blue.700",
              color: "gray.800",
            }}
            _active={{
              backgroundColor: "blue.800",
              borderColor: "blue.700",
            }}
          >
            Connect Wallet
          </Button>
        </Box>
      )}
    </>
  )
}
