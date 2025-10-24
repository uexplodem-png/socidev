import Web3 from 'web3';
import { ApiError } from '../../utils/ApiError.js';
import logger from '../../config/logger.js';

export class CryptoService {
  constructor() {
    this.web3 = new Web3(process.env.WEB3_PROVIDER_URL);
    this.merchantAddress = process.env.MERCHANT_ETH_ADDRESS;
  }

  async createPayment(amount, currency = 'ETH') {
    try {
      // Generate unique payment address
      const account = this.web3.eth.accounts.create();
      
      // Convert amount to Wei if ETH
      const weiAmount = currency === 'ETH' 
        ? this.web3.utils.toWei(amount.toString(), 'ether')
        : amount;

      return {
        address: account.address,
        privateKey: account.privateKey,
        amount: weiAmount,
        currency
      };
    } catch (error) {
      logger.error('Crypto payment creation failed:', error);
      throw new ApiError(500, 'Payment processing failed');
    }
  }

  async verifyPayment(address, expectedAmount, currency = 'ETH') {
    try {
      const balance = await this.web3.eth.getBalance(address);
      const expectedWei = currency === 'ETH'
        ? this.web3.utils.toWei(expectedAmount.toString(), 'ether')
        : expectedAmount;

      return {
        received: balance >= expectedWei,
        amount: this.web3.utils.fromWei(balance, 'ether'),
        currency
      };
    } catch (error) {
      logger.error('Crypto payment verification failed:', error);
      throw new ApiError(500, 'Payment verification failed');
    }
  }

  async transferFunds(fromAddress, privateKey, amount) {
    try {
      const nonce = await this.web3.eth.getTransactionCount(fromAddress);
      const gasPrice = await this.web3.eth.getGasPrice();
      
      const tx = {
        from: fromAddress,
        to: this.merchantAddress,
        value: amount,
        gas: 21000,
        gasPrice,
        nonce
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      return {
        transactionHash: receipt.transactionHash,
        status: receipt.status
      };
    } catch (error) {
      logger.error('Crypto funds transfer failed:', error);
      throw new ApiError(500, 'Funds transfer failed');
    }
  }

  async processRefund(toAddress, amount, currency = 'ETH') {
    try {
      const weiAmount = currency === 'ETH'
        ? this.web3.utils.toWei(amount.toString(), 'ether')
        : amount;

      const gasPrice = await this.web3.eth.getGasPrice();
      const nonce = await this.web3.eth.getTransactionCount(this.merchantAddress);

      const tx = {
        from: this.merchantAddress,
        to: toAddress,
        value: weiAmount,
        gas: 21000,
        gasPrice,
        nonce
      };

      const receipt = await this.web3.eth.sendTransaction(tx);
      
      return {
        transactionHash: receipt.transactionHash,
        status: receipt.status
      };
    } catch (error) {
      logger.error('Crypto refund failed:', error);
      throw new ApiError(500, 'Refund processing failed');
    }
  }

  async getTransactionStatus(txHash) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      return {
        status: receipt ? (receipt.status ? 'confirmed' : 'failed') : 'pending',
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed
      };
    } catch (error) {
      logger.error('Transaction status check failed:', error);
      throw new ApiError(500, 'Transaction status check failed');
    }
  }
}