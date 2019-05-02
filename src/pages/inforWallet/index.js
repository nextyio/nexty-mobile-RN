import React, { Component } from 'react';
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ImageBackground,
    Platform,
    Share,
    ToastAndroid,
    Clipboard,
    Alert
} from 'react-native';
import { QRCode } from 'react-native-custom-qr-codes';
import QRCodeAndroid from 'react-native-qrcode-svg';
import Header from '../../components/header';
import GLOBAL from '../../helper/variables';
import CustomToast from '../../components/toast';
import { getBottomSpace, getStatusBarHeight } from 'react-native-iphone-x-helper'
import Gradient from 'react-native-linear-gradient';
import Language from '../../i18n/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchAllWallet } from '../../../redux/actions/slideWalletAction'
import { StackActions, NavigationActions } from 'react-navigation'
import Dialog from "react-native-dialog";
import { RemoveWallet, } from '../../services/auth.service';
import { GetInforWallet } from '../../../realm/walletSchema'

export default class InforWallet extends Component {

    _getPrivatekey(pk_en) {
        this.props.navigation.navigate('Privatekey', {
            payload: {
                pk_en
            }
        })
    }

    _goHistory(address, network) {
        this.props.navigation.navigate('History', {
            payload: {
                address,
                network
            }
        })
    }
    _copyAddress(address) {
        Clipboard.setString(address)
        if (Platform.OS == 'ios') {
            this.refs.toastBottom.ShowToastFunction(Language.t('Request.Toast'));
        } else {
            ToastAndroid.show(Language.t('Request.Toast'), ToastAndroid.SHORT)
        }
    }


    render() {
        const item = this.props.navigation.getParam('payload');
        let logo_net;
        switch (item.network.name) {
            case 'ethereum':
                logo_net = require('../../images/AddWallet/network/eth.png')
                break;
            case 'nexty':
                logo_net = require('../../images/AddWallet/network/nty.png')
                break;
            default:
                logo_net = require('../../images/AddWallet/network/tron.png')
                break;
        }

        return (
            <Gradient
                colors={['#F0F3F5', '#E8E8E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}>
                <StatusBar
                    backgroundColor={'transparent'}
                    translucent
                    barStyle="dark-content"
                />
                <Header
                    backgroundColor="transparent"
                    colorIconLeft="#328FFC"
                    colorTitle="#328FFC"
                    nameIconLeft="times"
                    title={item.name}
                    style={{ paddingTop: getStatusBarHeight() }}
                    pressIconLeft={() => { this.props.navigation.goBack(); }}
                />
                <View style={styles.body}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ textAlign: 'center', fontFamily: GLOBAL.font.Poppins }}>{Language.t('Request.TitleCopy')}</Text>
                    </View>
                    <View style={{ flex: 6, justifyContent: 'center' }}>
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            onPress={() => this._copyAddress(item.address)}
                        >
                            <ImageBackground
                                source={require('../../images/bg-qr.png')}
                                style={{ padding: GLOBAL.wp('6%') }}
                                resizeMode="contain"
                            >
                                {
                                    Platform.OS == 'android' ?
                                        <QRCodeAndroid
                                            value={item.address}
                                            logo={logo_net}
                                            logoSize={GLOBAL.wp('20%')}
                                            logoBackgroundColor='transparent'
                                            backgroundColor='transparent'
                                            size={GLOBAL.wp('60%')}
                                        />
                                        :
                                        <QRCode
                                            content={item.address}
                                            backgroundColor='transparent'
                                            logo={logo_net}
                                            logoSize={GLOBAL.wp('20%')}
                                            size={GLOBAL.wp('60%')}
                                        />
                                }
                            </ImageBackground>
                        </TouchableOpacity>
                        <Text
                            style={{
                                textAlign: 'center',
                                fontFamily: GLOBAL.font.Poppins,
                                fontWeight: 'bold',
                                marginVertical: GLOBAL.hp('2%')
                            }}
                            numberOfLines={1}
                            ellipsizeMode="middle"
                        >{item.address}</Text>
                    </View>

                    <View style={{ flex: 3, paddingHorizontal: GLOBAL.wp('20%') }}>
                        <TouchableOpacity
                            style={styles.buttonShare}
                            onPress={() => this._getPrivatekey(item.pk_en)}
                        >
                            <Gradient
                                style={{ paddingVertical: GLOBAL.hp('1.5%'), borderRadius: 5, }}
                                colors={['#08AEEA', '#328FFC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: GLOBAL.font.Poppins }}>Export private key</Text>
                            </Gradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.buttonShare}
                            onPress={() => this._goHistory(item.address, item.network.name)}
                        >
                            <Gradient
                                style={{ paddingVertical: GLOBAL.hp('1.5%'), borderRadius: 5 }}
                                colors={['#08AEEA', '#328FFC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: GLOBAL.font.Poppins }}>History</Text>
                            </Gradient>
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center', zIndex: 100 }}>
                            <CustomToast ref="toastBottom" position="bottom" />
                        </View>
                        <TouchableOpacity
                            style={styles.buttonShare}
                            onPress={() => Share.share({ message: item.address })}
                        >
                            <Gradient
                                style={{ paddingVertical: GLOBAL.hp('1.5%'), borderRadius: 5 }}
                                colors={['#08AEEA', '#328FFC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: GLOBAL.font.Poppins }}>Share</Text>
                            </Gradient>
                        </TouchableOpacity>

                    </View>
                </View>
            </Gradient>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    body: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'column',
        paddingVertical: GLOBAL.hp('2%'),
        // alignItems: 'center'
    },
    buttonShare: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 2.27,
        elevation: 7,
        marginVertical: GLOBAL.hp('1%'),
    }
})