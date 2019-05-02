const TronWeb = require('tronweb');
import Language from '../i18n/i18n';
import { validatePassword, getPrivateKey } from './auth.service'
import CONSTANTS from '../helper/constants'
import { forkJoin, of, interval, throwError, fromEvent, Observable, merge } from 'rxjs';

const TESTNET = "https://api.shasta.trongrid.io/";
const MAINNET = 'https://api.trongrid.io';
const TRONWEB = new TronWeb({
    fullHost: MAINNET,
});
import ABI from '../../ABI';

export const ConvertToAddressTron = (address: string) => {
    return TRONWEB.address.fromHex(address);
}

export const ConvertFromAddressTron = (address: string) => {
    return TRONWEB.address.toHex(address)
}
export const UpdateBalanceTRON = (address: string) => {
    return new Promise((resolve, reject) => {
        resolve(TRONWEB.trx.getBalance(address))
    })
}

export const UpdateBalanceTokenTRON = (addressTK, addressWL) => new Promise(async (resolve, reject) => {
    try {
        let res = await TRONWEB.trx.getContract(addressTK)
        var contract = await TRONWEB.contract().at(res['contract_address'])
        await contract.balanceOf(addressWL).call().then(bal => {
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
    } catch (error) {
        console.log(error)
        reject(error)
    }

})
/**
 * Function send trx
 * @param {string} address_receive address wallet receive trx
 * @param {string} address_send address wallet send trx
 * @param {number} value number trx want send
 * @param {string} password local passcode
 * @param {string} pk private key encrypt
 * @param {string} exData extra data
 */
export const SendTRON = async (address_receive: string, address_send: string, value: number, password: string, pk: string, exData?: string) => {
    if (! await validatePassword(password)) {
        throw (Language.t('Send.AlerError.Content'))
    }
    console.log(TRONWEB.isAddress(address_receive), address_receive)
    if (!TRONWEB.isAddress(address_receive)) {
        throw (Language.t('Send.ValidAddress'));
    }
    let sendValue = await CONSTANTS.BASE_TRON.valueOf() * value;
    let hexValue = await '0x' + TRONWEB.toBigNumber(sendValue).toString(16);

    let hexAddress_receive = await TRONWEB.address.toHex(address_receive);
    let hexAddress_send = await TRONWEB.address.toHex(address_send);
    var transaction = await TRONWEB.transactionBuilder.sendTrx(hexAddress_receive, hexValue, hexAddress_send);
    console.log(transaction)
    const singedTransaction = await TRONWEB.trx.sign(transaction, await getPrivateKey(password, pk));
    return new Promise((resolve, reject) => {
        TRONWEB.trx.sendRawTransaction(singedTransaction).then(result => {
            resolve(result)
        }).catch(e => {
            reject(e)
        })
    })
}

export const sendTokenTRON = async (TokenID: string, address_receive: string, address_send: string, value: number, password: string, pk: string, exData?: string) => {
    if (!await validatePassword(password)) {
        throw (Language.t('Send.Alert.Content'))
    }
    if (!TRONWEB.isAddress(address_receive)) {
        throw (Language.t('Send.ValidAddress'));
    }
    let sendValue = await CONSTANTS.BASE_TRON.valueOf() * value;
    let hexValue = await '0x' + TRONWEB.toBigNumber(sendValue).toString(16);
    let hexAddress_receive = await TRONWEB.address.toHex(address_receive);
    let hexAddress_send = await TRONWEB.address.toHex(address_send);
    var transaction = await TRONWEB.transactionBuilder.sendToken(hexAddress_receive, hexValue, TokenID, hexAddress_send);
    const singedTransaction = await TRONWEB.trx.sign(transaction, await getPrivateKey(password, pk));
    return new Promise((resolve, reject) => {
        TRONWEB.trx.sendRawTransaction(singedTransaction).then(result => {
            resolve(result)
        }).catch(e => {
            reject(e)
        })
    })
}

export const getInforTRONToken = (addressTK, addressWL) => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await TRONWEB.trx.getContract(addressTK)
            var contract = await TRONWEB.contract().at(res['contract_address'])
            console.log(res, contract)
        } catch (error) {
            reject(error)
        }
        await forkJoin([
            contract.balanceOf(addressWL).call().catch(e => { return null }),
            contract.symbol().call().catch(e => { return null }),
            contract.decimals().call().catch(e => { return null })
        ]).subscribe(data => {
            console.log('data', data)
            var balance = 0;
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
            reject('get infor fail')
        }
    })
}


