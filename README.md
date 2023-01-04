# etny-jupyter-notebook-extension
Jupyter Notebook extension to run python tasks on Ethernity Cloud Network.

## Requirements
You would need the following to successfully run the EC Jupyter Notebook Extension
```
Jupyter Notebook
Jupyter Notebook nbextensions
Desktop version of Linux (recommended) or Windows OS
Metamask addon
Internet Browser (e.g. Firefox)
```

## Installation instructions (Ubuntu)

### 1. Install Ubuntu with GUI (Gnome, KDE or X)
Step by step instructions on how to install a linux distro with a desktop environment are widely available on the internet.

### 2. Install & Configure Metamask addon
Your desktop Linux distribution should come with an internet browser like Firefox or Chromium. Install the MetaMask addon from the sources below:
- Firefox: https://addons.mozilla.org/en-GB/firefox/addon/ether-metamask/
- Chrome, Chromium, Brave, Opera, Edge: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en

Follow the on screen instructions to create a new or restore an existing wallet

### 3. Add bloxberg network on metamask
Afterwards, you will have to add the Bloxberg blockchain to MetaMask as shown in the below documentation
- https://docs.ethernity.cloud/wallet/connect-to-the-bloxberg-blockchain

### 4. Install pip
We need to install *pip* first, please open a console and type the following command:
```
sudo apt install pip -y
```
### 5. Install Jupyter Notebook
Then, we can continue to install jupyter notebook. Type in the same console:
```
pip install notebook
```
### 6. Install Jupyter Notebook nbextensions
And then we have to install the nbextensions by using the command below:
```
pip install jupyter_contrib_nbextensions
```
### 7. Clone the repository
Now, we are ready to clone the repository with our jupyter notebook addon
```
git clone https://github.com/ethernity-cloud/etny-jupyter-notebook-extension.git
```
### 8. Copy the repo folder to the required path 
```
copy cloned folder from location to /home/dim3nsi0n/.local/lib/python3.10/site-packages/jupyter_contrib_nbextensions/nbextensions/
```
### 9. Activate the extension for the current user
```
jupyter contrib nbextension install --user
```
### 10. Run Jupyter Notebook server
```
jupyter notebook
```
