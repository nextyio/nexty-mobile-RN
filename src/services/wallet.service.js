import React, { Component } from 'react';
import '../../shim.js';
import crypto from 'crypto'
import '../../global';
import moment from 'moment';
const Web3 = require('web3');
// import Web3 from 'web3'
import { forkJoin, of, interval, throwError, fromEvent, Observable, merge } from 'rxjs';
import GLOBALS from "../helper/constants";
import { Address, initAuth, validatePassword, getPrivateKey } from '../services/auth.service';
import CONSTANTS from '../helper/constants';
import { sign } from '@warren-bank/ethereumjs-tx-sign';
import bigInt from "big-integer";
import { getData, setData } from './data.service';
import Language from '../i18n/i18n';
import ABI from '../../ABI';
import { UpdateBalanceTRON, ConvertFromAddressTron, ConvertToAddressTron, UpdateBalanceTokenTRON } from './tron.service'

const WEB3 = new Web3();
export var balance: number = 0


export function updateBalance(address, network) {
    return new Promise((resolve, reject) => {
        if (network != 'tron') {
            WEB3.setProvider(new WEB3.providers.HttpProvider(getProvider(network)));
            WEB3.eth.getBalance(address).then(value => {
                if (value > 0) {
                    if (parseFloat(value / CONSTANTS.BASE_NTY) % 1 == 0) {
                        resolve(parseFloat(value / CONSTANTS.BASE_NTY))
                    } else {
                        resolve(parseFloat(value / CONSTANTS.BASE_NTY).toFixed(2))
                    }
                } else {
                    resolve(0)
                }
            }).catch(e => {
                console.log(e)
                reject(0)
            })
        } else {
            UpdateBalanceTRON(address).then(value => {
                if (value > 0) {
                    if (parseFloat(value / CONSTANTS.BASE_TRON) % 1 == 0) {
                        resolve(parseFloat(value / CONSTANTS.BASE_TRON))
                    } else {
                        resolve(parseFloat(value / CONSTANTS.BASE_TRON).toFixed(2))
                    }
                } else {
                    resolve(0)
                }
            }).catch(e => {
                console.log(e)
                reject(0)
            })
        }
    })
}

export async function getBalance(address) {
    return new Promise((resolve, reject) => {
        resolve(WEB3.eth.getBalance(address))
    })
}

export const SV_UpdateBalanceTk = (addressTK, network, addressWL) => new Promise(async (resolve, reject) => {
    try {
        if (network != 'tron') {
            WEB3.setProvider(new WEB3.providers.HttpProvider(getProvider(network)))
            var contract = await new WEB3.eth.Contract(ABI, addressTK);
            await contract.methods.balanceOf(addressWL).call().then(bal => {
                if (bal > 0) {
                    contract.methods.decimals().call().then(decimal => {
                        if (parseFloat(bal / Math.pow(10, decimal)) % 1 == 0) {
                            resolve(parseFloat(bal / Math.pow(10, decimal)).toLocaleString())
                        } else {
                            resolve(parseFloat(bal / Math.pow(10, decimal)).toFixed(2).toLocaleString())
                        }
                    })
                } else {
                    resolve(0)
                }
            })
        } else {
            UpdateBalanceTokenTRON(addressTK, addressWL).then(bal => {
                console.log(bal)
                resolve(bal)
            })
        }

    } catch (error) {
        console.log(error)
        reject(error)
    }
})

function getProvider(network): String {
    switch (network) {
        case 'nexty':
            return CONSTANTS.WEB3_API
        case 'ethereum':
            return CONSTANTS.WEB3_ETH
        default:
            return CONSTANTS.WEB3_TRX
    }
}

interface Tx {
    nonce?: string | number,
    chainId?: string | number,
    from?: string,
    to?: string,
    data?: string,
    value?: string | number,
    gas?: string | number,
    gasPrice?: string | number

}
/**
 * Function send coin default of network
 * @param {string} network network want send
 * @param {string} address_receive address wallet receive coin
 * @param {string} address_send address wallet send
 * @param {number} value number coin want send
 * @param {string} password local passcode 
 * @param {string} exData extra data want send, stringify json
 * @param {string} pk private key encrypt
 */
export async function SendService(network: string, address_receive: string, address_send: string, value: number, password: string, pk: string, exData?: string) {
    if (! await validatePassword(password)) {
        throw (Language.t('Send.AlerError.Content'))
    }
    // check address
    if (! await WEB3.utils.isAddress(address_receive)) {
        throw (Language.t('Send.ValidAddress'));
    }
    console.log(address_receive, address_send)
    let sendValue = CONSTANTS.BASE_NTY2.valueOf() * value;
    let hexValue = '0x' + bigInt(sendValue).toString(16);
    let txData: Tx;
    if (exData || exData != null || exData != '') {
        txData = await getTxData(network, address_send, address_receive, hexValue, exData)
    } else {
        txData = await getTxData(network, address_send, address_receive, hexValue, '')
    }
    console.log('xx', txData)
    return new Promise((resolve, reject) => {
        console.log(network)
        WEB3.setProvider(new WEB3.providers.HttpProvider(getProvider(network)))
        WEB3.eth.getTransactionCount(address_send)
            .then(async (nonce) => {
                txData.nonce = nonce;
                await estimateGas(txData).then(async (gas) => {
                    txData.gas = gas;
                    let rawTx;
                    try {
                        rawTx = '0x' + await signTransaction(txData, await getPrivateKey(password, pk))
                    } catch (ex) {
                        console.log(ex);
                        reject('cannot sign transaction')
                        return;
                    }

                    WEB3.eth.sendSignedTransaction(rawTx, (error, hash) => {
                        if (error) {
                            reject(error.message);
                        } else {
                            resolve(hash)
                        }
                    })
                })
            }).catch(err => {
                console.log('err', err)
                reject(Language.t('Send.AlerError.TransactionFail'))
            })

    })

}

async function getTxData(network, from, to, value, data, ): Tx {
    switch (network) {
        case 'ethereum':
            return {
                from: from,
                to: to,
                value: value,
                data: data,
                gasPrice: await getGasPrice()
            }
        case 'nexty':
            return {
                from: from,
                to: to,
                value: value,
                data: data,
            }
        default:
            return {
                from: from,
                to: to,
                value: value,
                data: data,
                gasPrice: 0.000000008
            }
            break;
    }
}

export async function Redeem(AddressSend: string, nty: number, privateKey: string) {

    let sendValue = CONSTANTS.BASE_NTY2.valueOf() * nty;
    let hexValue = '0x' + bigInt(sendValue).toString(16);
    let txData: Tx = {
        from: AddressSend,
        to: Address,
        value: hexValue
    }
    return new Promise((resolve, reject) => {
        WEB3.eth.getTransactionCount(AddressSend)
            .then(async (nonce) => {
                console.log('getTransactionCount')
                txData.nonce = nonce;

                await estimateGas(txData).then(async (gas) => {
                    console.log("gas first: " + gas)
                    console.log('estimateGas')
                    txData.gas = gas;
                    let rawTx;
                    try {
                        rawTx = '0x' + await signTransaction(txData, privateKey)
                    } catch (ex) {
                        console.log(ex);
                        reject('cannot sign transaction')
                        return;
                    }

                    console.log('gas: ' + txData.gas)

                    WEB3.eth.sendSignedTransaction(rawTx, (error, hash) => {
                        console.log('sendSignedTransactionCount')
                        if (error) {
                            reject(error.message);
                            console.log('error' + error.message)
                        } else {
                            // update balance
                            console.log('send success')
                            updateBalance().then(() => {
                                console.log('update balance')
                                resolve(hash)
                            });
                        }
                    })
                })
            }).catch(err => {
                console.log('err', err)
                reject(Language.t('Send.AlerError.TransactionFail'))
            })

    })

}
/**
 * function send token
 * @param {string} network network want send
 * @param {string} tokenAddress address of smart contract (address token)
 * @param {string} address_receive address wallet receive token
 * @param {string} address_send address wallet send token
 * @param {number} token amount token want send
 * @param {string} password local passcode
 * @param {string} pk private of wallet send
 * @param {string} exData extra data want send (stringify json hex)
 */
export async function SendToken(network: string, tokenAddress: string, address_receive: string, address_send: string, token: number, password: string, pk: string, exData?: string) {
    if (! await validatePassword(password)) {
        throw (Language.t('Send.AlerError.Content'))
    }
    // check address
    if (! await WEB3.utils.isAddress(address_receive)) {
        throw (Language.t('Send.ValidAddress'));
    }
    await WEB3.setProvider(new WEB3.providers.HttpProvider(getProvider(network)))
    var Contract = new WEB3.eth.Contract(ABI, tokenAddress, { from: address_send });
    let txData: Tx;

    await Contract.methods.decimals().call().then(decimal => {
        console.log(decimal);
        var valueToken = (token * bigInt(10).pow(decimal).valueOf()).toString(16);
        var hexValueToken = '0x' + valueToken;
        console.log(hexValueToken, parseFloat(valueToken))
        txData = {
            from: address_send,
            to: tokenAddress,
            value: '0x0',
            data: Contract.methods.transfer(address_receive, hexValueToken).encodeABI(),
            chainId: 66666,
            gasPrice: 0
        }
    })

    return new Promise((resolve, reject) => {
        WEB3.eth.getTransactionCount(address_send)
            .then(async (nonce) => {
                console.log('getTransactionCount')
                txData.nonce = nonce;

                await estimateGas(txData).then(async (gas) => {
                    console.log("gas first: " + gas)
                    console.log('estimateGas')
                    txData.gas = gas;
                    let rawTx;
                    try {
                        rawTx = '0x' + await signTransaction(txData, await getPrivateKey(password, pk))
                    } catch (ex) {
                        console.log(ex);
                        reject('cannot sign transaction')
                        return;
                    }

                    console.log('gas: ' + txData.gas)

                    WEB3.eth.sendSignedTransaction(rawTx, (error, hash) => {
                        console.log('sendSignedTransactionCount')
                        if (error) {
                            reject(error.message);
                            console.log('error' + error.message)
                        } else {
                            // update balance
                            resolve(hash)
                            // console.log('send success')
                            // updateBalance().then(() => {
                            //     console.log('update balance')
                            //     resolve(hash)
                            // });
                        }
                    })
                })
            }).catch(err => {
                console.log('err', err)
                reject('Returned error: insufficient funds for gas * price + value')
            })

    })

}
export async function signTransaction(txData: Tx, privateKey: string) {
    let { rawTx } = sign(txData, privateKey);
    return rawTx
}
export async function estimateGas(transaction: Tx): number {
    let gas = WEB3.eth.estimateGas(transaction);
    return gas;
}
function getGasPrice(): string {
    let gasPrice = WEB3.eth.getGasPrice()
    return gasPrice
}

export async function getAddressFromPK(privateKey) {
    try {
        var account = WEB3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    } catch (error) {
        console.log(error)
    }
    return new Promise((resolve) => {
        resolve(account.address)
    })
}
export function GetInfoToken(TokenAddress, network, addressWL) {
    return new Promise(async (resolve, reject) => {
        try {
            WEB3.setProvider(new WEB3.providers.HttpProvider(getProvider(network)));
            var ContractABI = await new WEB3.eth.Contract(ABI, TokenAddress);
        } catch (error) {
            reject(error);
            console.log(error)
        }
        await forkJoin([
            ContractABI.methods.balanceOf(addressWL).call().catch(err => {
                return null;
            }),
            ContractABI.methods.symbol().call().catch(err => {
                return null;
            }),
            ContractABI.methods.decimals().call().catch(err => {
                return null;
            }),
        ]).subscribe(data => {
            if ((parseFloat(data[0]) / Math.pow(10, data[2])) % 1 == 0) {
                balance = (parseFloat(data[0]) / Math.pow(10, data[2])).toLocaleString()
                var infoTK = {
                    "balance": balance,
                    "symbol": data[1],
                    "decimals": data[2],
                }
            } else {
                balance = (parseFloat(data[0]) / Math.pow(10, data[2])).toFixed(2).toLocaleString()
                var infoTK = {
                    "balance": balance,
                    "symbol": data[1],
                    "decimals": data[2],
                }
            }
            resolve(infoTK)
        }), err => {
            reject('get info fail')
        }
    })
}