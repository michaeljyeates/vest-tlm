import MetaMaskOnboarding from "@metamask/onboarding";
import { ethers } from "ethers";
import {
  getMaxClaim,
  getTotalBalanceRemaining,
  claimTokens,
} from "./contracts/vesting";
import { getBalance } from "./contracts/tlm";

const currentUrl = new URL(window.location.href);
const forwarderOrigin =
  currentUrl.hostname === "localhost" ? "http://localhost:9010" : undefined;

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

// Dapp Status Section
const chainIdDiv = document.getElementById("chainId");
const accountsDiv = document.getElementById("accounts");

const accountBalanceDiv = document.getElementById("accountBalance");
const accountTotalBalanceRemainingDiv = document.getElementById(
  "accountTotalBalanceRemaining"
);
const accountMaxClaimDiv = document.getElementById("accountMaxClaim");

// Basic Actions Section
const onboardButton = document.getElementById("connectButton");
const claimButton = document.getElementById("claimButton");

const claimInput = document.getElementById("claimInput");

let accounts;
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
    claimButton.onclick = claimTLM;
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
    refreshData();
  }
  updateButtons();
}

function handleNewChain(chainId) {
  chainIdDiv.innerHTML = chainId;
}

function handleNewNetwork(networkId) {
  refreshData();
  if (networkId != 1) {
    alert("Please connect to the Ethereum mainnet");
    claimButton.disabled = true;
  } else {
    if (isMetaMaskConnected) {
      claimButton.disabled = false;
    }
  }
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
  accountBalanceDiv.innerHTML = parseInt(balance) + " TLM";
}

async function setTotalBalanceRemaining() {
  let balance = await getTotalBalanceRemaining();
  accountTotalBalanceRemainingDiv.innerHTML = parseInt(balance) + " VTLM";
}

async function setMaxClaim() {
  let amount = await getMaxClaim();
  accountMaxClaimDiv.innerHTML = parseInt(amount) + " VTLM";
  claimInput.value = parseInt(amount);
}

const claimTLM = async () => {
  claimButton.disabled = true;
  claimButton.innerText = "Waiting for blockchain confirmation...";
  let amount = claimInput.value;
  let transaction = await claimTokens(amount);
  if (transaction) {
    refreshData();
  }
  claimButton.disabled = false;
  claimButton.innerText = "Claim";
};

function refreshData() {
  setBalance();
  setTotalBalanceRemaining();
  setMaxClaim();
}

window.addEventListener("DOMContentLoaded", initialize);
