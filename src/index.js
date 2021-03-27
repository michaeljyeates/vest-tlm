import MetaMaskOnboarding from "@metamask/onboarding";
import { ethers } from "ethers";
import { getBalance } from "./contracts/vesting";

let provider, signer;

const currentUrl = new URL(window.location.href);
const forwarderOrigin =
  currentUrl.hostname === "localhost" ? "http://localhost:9010" : undefined;

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

// Dapp Status Section
const networkDiv = document.getElementById("network");
const chainIdDiv = document.getElementById("chainId");
const accountsDiv = document.getElementById("accounts");

const accountBalanceDiv = document.getElementById("accountBalance");

// Basic Actions Section
const onboardButton = document.getElementById("connectButton");

let accounts;
let vestingContract;
let onboarding;

const initialize = async () => {
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin });
  } catch (error) {
    console.error(error);
  }

  updateButtons();

  if (isMetaMaskInstalled()) {
    ethereum.autoRefreshOnNetworkChange = false;
    getNetworkAndChainId();

    ethereum.on("chainChanged", handleNewChain);
    ethereum.on("networkChanged", handleNewNetwork);
    ethereum.on("accountsChanged", handleNewAccounts);

    try {
      const newAccounts = await ethereum.request({
        method: "eth_accounts",
      });
      handleNewAccounts(newAccounts);
    } catch (err) {
      console.error("Error on init when getting accounts", err);
    }
  }
};

const isMetaMaskConnected = () => accounts && accounts.length > 0;

const onClickInstall = () => {
  onboardButton.innerText = "Onboarding in progress";
  onboardButton.disabled = true;
  onboarding.startOnboarding();
};

const onClickConnect = async () => {
  try {
    const newAccounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    handleNewAccounts(newAccounts);
  } catch (error) {
    console.error(error);
  }
};

const updateButtons = () => {
  if (!isMetaMaskInstalled()) {
    onboardButton.innerText = "Click here to install MetaMask!";
    onboardButton.onclick = onClickInstall;
    onboardButton.disabled = false;
  } else if (isMetaMaskConnected()) {
    onboardButton.innerText = "Connected";
    onboardButton.disabled = true;
    if (onboarding) {
      onboarding.stopOnboarding();
    }
  } else {
    onboardButton.innerText = "Connect";
    onboardButton.onclick = onClickConnect;
    onboardButton.disabled = false;
  }
};

function handleNewAccounts(newAccounts) {
  accounts = newAccounts;
  accountsDiv.innerHTML = accounts;
  if (isMetaMaskConnected()) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    refreshData();
  }
  updateButtons();
}

function handleNewChain(chainId) {
  chainIdDiv.innerHTML = chainId;
}

function handleNewNetwork(networkId) {
  if (networkId != 1) {
    alert("Please connect to the Ethereum mainnet");
  }

  networkDiv.innerHTML = networkId;
}

async function getNetworkAndChainId() {
  try {
    const chainId = await ethereum.request({
      method: "eth_chainId",
    });
    handleNewChain(chainId);

    const networkId = await ethereum.request({
      method: "net_version",
    });
    handleNewNetwork(networkId);
  } catch (err) {
    console.error(err);
  }
}

async function setBalance() {
  let balance = await getBalance();
  accountBalanceDiv.innerHTML = balance;
}

function refreshData() {
  setBalance();
}

window.addEventListener("DOMContentLoaded", initialize);
