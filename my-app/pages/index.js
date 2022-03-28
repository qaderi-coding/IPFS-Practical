import {Contract, providers, utils} from 'ethers'
import Web3Modal from 'web3modal'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { abi, NFT_CONTRACT_ADDRESS } from '../constants'
import styles from '../styles/Home.module.css'


export default function Home() {
  //walletConnected keep track of wether the wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false)
  // loading is used when we are waiting for transaction to get mined
  const [loading, setLoading] = useState(false)
  //tokenIdsMinted keep track of the number of tokens that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState(0)
  // Create a reference to the web3 Modal (used for connecting to metamask) which persists as long as the page is open
  const web3ModalRef = useRef()

  /**
   * publicMint: Mint an NFT
   */
  const publicMint = async () =>{
    try {
      console.log('Public Mint')
      // We need a Signer here since this is a 'write' transaction
      const signer = await getProviderOrSigner(true)
      // Create a new instance of the Contract with a Signer, Which allows
      // update method 
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      const tx = await nftContract.mint({
        // Value signifies the const of one LW3punks which is "0.01" eth.
        // We are parsing `0.01` string to eth using the utils library from ether.js 
        value: utils.parseEther("0.01")
      })

      setLoading(true)
      // wait for transaction to get mined
      await tx.wait()
      setLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * connectWallet: Connects the Metamask wallet
   */
  const connectWallet = async () =>{
    try {
      // Get the provider from the web3modal, which in our case is Metamask
      // When used it for the time, it prompts the user to connect the wallet
      await getProviderOrSigner();
      setWalletConnected(true)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async() => {
    try {
      // Get the provider from web3modal, which in our case is Metamask
      // No need for the signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the contract using Provider, so we will only
      // have read-only access from the contract 
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      console.log('token ids', _tokenIds)
      // _tokenIds is a `Big Number`. We need to convert the big number to a string
      setTokenIdsMinted(_tokenIds.toString())
    } catch (error) {
      console.error(error)
    }
  }
  
  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without
   * the signing capabilities of metamask attached 
   * A `Provider` is needed to interact with blockchain - reading transaction, reading balances, reading state, etc.
   * 
   * A `Signer` is a special type of provider used in a case that `write` transaction is needed
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to metamask
    // Since we store `web3modal` as a reference, we need to access the `current` value t get access to the underlying object
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)
    // if user is not connected to mumbai network, let them know and throw an error
    const {chainId} = await web3Provider.getNetwork()
    if(chainId !== 80001){
      window.alert("Please, change the network to mumbai")
      throw new Error('Please, change the network to mumbai')
    } 
    
    if(needSigner){
      const signer = web3Provider.getSigner()
      return signer
    }

    return web3Provider
  }

  // useEffect is used to react to changes in the website

  useEffect(()=>{
    // if the wallet is not connected, create a new instance of web3modal and connect the metamask
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOption: {},
        disableInjectedProvider: false,
      })

      connectWallet();
      getTokenIdsMinted();
  
      // set an interval to get the numbers of token Ids minted every 5 seconds
      setInterval(async function(){
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected])

  /**
   * renderButton: Returns a button based on the state of the dapp
   */
  const renderButton = () => {
    // if wallet is not connected, return a button which allows them to connect a wallet
    if(!walletConnected){
      return(
        <button onClick = {connectWallet} className = {styles.button}>
          Connect your wallet
        </button>
      )
    }

    // if we are currently waiting for something, return a loading button
    if(loading){
      return <button className = {styles.button}>Loading ...</button>
    }

    return (
      <button className = {styles.button} onClick = {publicMint}>
        Public Mint 🚀
      </button>
    )
  }

 return(
   <div>
     <Head>
       <title>LW3Punks</title>
       <meta name = "description" content = "LW3Punks-Dapp"></meta>
       <link rel = "icon" here = "/favicon.ico" ></link>
     </Head>
     <div className = {styles.main}>
       <div>
         <h1 className = {styles.title} > Welcome to LW3Punks</h1>
         <div className = {styles.description}>
           Its an NFT collection for LearnWeb3 students.
         </div>
         <div>
           {tokenIdsMinted}/10 have been minted.
         </div>
          {renderButton()}
       </div>
       <div>
         <img className = {styles.image} src = "./LW3Punks/1.png" />
       </div>
     </div>
     <footer className = {styles.footer}>Made with &#10084; by LW3Punks</footer>
   </div>
 )
}
