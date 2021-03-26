import MetaMaskOnboarding from "@metamask/onboarding";

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

// Basic Actions Section
const onboardButton = document.getElementById("connectButton");
const getAccountsButton = document.getElementById("getAccounts");
const getAccountsResults = document.getElementById("getAccountsResult");

const initialize = async () => {
  let onboarding;
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin });
  } catch (error) {
    console.error(error);
  }

  let accounts;
  let vestingContract;
  let accountButtonsInitialized = false;

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

  const initializeAccountButtons = () => {
    if (accountButtonsInitialized) {
      return;
    }
    accountButtonsInitialized = true;

    getAccountsButton.onclick = async () => {
      try {
        const _accounts = await ethereum.request({
          method: "eth_accounts",
        });
        getAccountsResults.innerHTML =
          _accounts[0] || "Not able to get accounts";
      } catch (err) {
        console.error(err);
        getAccountsResults.innerHTML = `Error: ${err.message}`;
      }
    };
  };

  function handleNewAccounts(newAccounts) {
    accounts = newAccounts;
    accountsDiv.innerHTML = accounts;
    if (isMetaMaskConnected()) {
      initializeAccountButtons();
    }
    updateButtons();
  }

  function handleNewChain(chainId) {
    chainIdDiv.innerHTML = chainId;
  }

  function handleNewNetwork(networkId) {
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

window.addEventListener("DOMContentLoaded", initialize);
