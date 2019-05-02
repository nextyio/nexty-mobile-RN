import React, { Component } from 'react'
import {
    View,
    Platform,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Alert,
    Keyboard,
    TextInput,
    ScrollView,
    FlatList,
    PixelRatio,
    Image,
    Linking,
    Modal,
    ActivityIndicator
} from 'react-native';
import GLOBALS from '../../helper/variables';
import { Form, Item, Input, Label } from 'native-base'
import Icon from "react-native-vector-icons/Ionicons";
import { exchangeRate, exchangeRateETH, } from '../../services/rate.service';
import { Utils } from '../../helper/utils'
import Dialog from "react-native-dialog";
import { SendService, SendToken, updateBalance, SV_UpdateBalanceTk } from "../../services/wallet.service";
import { SendTRON, sendTokenTRON } from '../../services/tron.service'
import { ScaleDialog } from "../../services/loading.service";
import { getData } from '../../services/data.service';
import { Dropdown } from 'react-native-material-dropdown';
import Language from '../../i18n/i18n';
import PopupDialog, {
    ScaleAnimation, DialogTitle, DialogButton
} from "react-native-popup-dialog";
import Gradient from "react-native-linear-gradient"
import TouchID from "react-native-touch-id"
import CryptoJS from 'crypto-js';
import { cachePwd } from '../../services/auth.service'
import AlerModal from '../../components/Modal';
import { connect } from 'react-redux';
import Header from '../../components/header';
import { getBottomSpace, getStatusBarHeight } from 'react-native-iphone-x-helper'



const scaleAnimation = new ScaleAnimation();
const pt = PixelRatio.get()

class FormSend extends Component {
    mouted: boolean = true;
    spamPress: boolean = false;

    InitState = {
        addresswallet: '',
        TextErrorAddress: '',
        errorAddress: false,
        TextErrorNTY: '',
        errorNTY: false,
        VisibaleButton: true,
        NTY: '',
        USD: '',
        dialogSend: false,
        Password: '',
        titleDialog: '',
        contentDialog: '',
        ListToken: [],
        viewSymbol: this.props.Symbol,
        tokenSelected: {},
        selected: this.props.Symbol,
        extraData: '',
        editAddress: true,
        editNTY: true,
        editUSD: true,
        buttomReset: false,
        disabledButtomSend: false,
        showTouchID: false,
        deepLink: false,
        loading: false,
    }

    resetState = {
        addresswallet: '',
        TextErrorAddress: '',
        errorAddress: false,
        TextErrorNTY: '',
        errorNTY: false,
        VisibaleButton: true,
        NTY: '',
        USD: '',
        dialogSend: false,
        extraData: '',
        editAddress: true,
        editNTY: true,
        editUSD: true,
        buttomReset: false,
        disabledButtomSend: false
    }

    constructor(props) {
        super(props)
        this.state = this.InitState;
    };

    onSelect = data => {
        console.log('data', data)
        if (data['result'] == 'cancelScan') {
            return;
        }
        this.setState(this.resetState)
        /** try-catch check QR **/
        try {
            let typeQR = JSON.parse(data['result']);
            var hexExtraData = '';
            for (let i = 0; i < data['result'].length; i++) {
                hexExtraData += '' + data['result'].charCodeAt(i).toString(16);
            }
            /* have amount*/
            if (typeQR['amount'] != null || typeQR['amount'] != '') {
                var val = parseFloat(typeQR['amount'])
                var usd = Utils.round(val * exchangeRate, 5);
                this.setState({
                    addresswallet: typeQR['walletaddress'],
                    NTY: (typeQR['amount']).toString(),
                    extraData: '0x' + hexExtraData,
                    USD: usd.toString(),
                    editAddress: false,
                    editNTY: true,
                    editUSD: true,
                    VisibaleButton: false,
                    buttomReset: true
                })
            } else {
                /* handle not yet amount*/
                this.setState({
                    addresswallet: typeQR['walletaddress'],
                    NTY: typeQR['amount'],
                    extraData: '0x' + hexExtraData,
                    editAddress: false,
                    editNTY: true,
                    editUSD: true,
                    buttomReset: true
                })
            }
        } catch (error) {
            this.setState({ addresswallet: data['result'] });
        }
    };

    navigateToScan() {
        this.props.navigation.navigate('QRscan', { onSelect: this.onSelect });
    }


    async CheckAddress(value) {
        await this.setState({ TextErrorAddress: '' });
        if (value.length < 1) {
            await this.setState({ addresswallet: value, errorAddress: true, TextErrorAddress: Language.t('Send.ValidAddress'), VisibaleButton: true })
        } else {
            await this.setState({ addresswallet: value, errorAddress: false })
        }
        if (this.state.errorNTY == true || this.state.errorAddress == true || this.state.addresswallet == '' || this.state.NTY == '') {
        } else {
            await this.setState({ VisibaleButton: false });
        }
    }

    async CheckNTY(value) {
        var val = await parseFloat(value)
        await this.setState({ TextErrorNTY: '' });
        if (isNaN(val)) {
            await this.setState({ NTY: '', errorNTY: true, TextErrorNTY: Language.t('Send.ValidAmount'), VisibaleButton: true, USD: '' })
            return
        }

        if (val < 0 || value.length < 1) {
            await this.setState({ NTY: '', errorNTY: true, TextErrorNTY: Language.t('Send.ValidAmount'), VisibaleButton: true, USD: '' })
        } else {

            switch (this.state.viewSymbol) {
                case this.props.Symbol:
                    var usd = await Utils.round(val * this.props.rate, 5);
                    break;
                default:
                    var usd = 0;
                    break;
            }
            await this.setState({ errorNTY: false, USD: usd.toString(), NTY: value });
        }
        if (this.state.errorNTY == true || this.state.errorAddress == true || this.state.addresswallet == '' || this.state.NTY == '') {
        } else {
            await this.setState({ VisibaleButton: false });
        }
    }
    async CheckUSD(value) {
        var val = await parseFloat(value)
        await this.setState({ TextErrorNTY: '' });
        if (isNaN(val)) {
            await this.setState({ errorNTY: true, TextErrorNTY: Language.t('Send.ValidAmount'), VisibaleButton: true, USD: '', NTY: '' })
            return
        }
        if (val < 0 || value.length < 1) {
            await this.setState({ USD: '', errorNTY: true, TextErrorNTY: Language.t('Send.ValidAmount'), VisibaleButton: true, NTY: '' })
        } else {
            switch (this.state.viewSymbol) {
                case this.props.Symbol:
                    var nty = await Utils.round(val / this.props.rate);
                    await this.setState({ errorNTY: false, NTY: nty.toString(), USD: value })
                    break;

                default:
                    var nty = 0;
                    await this.setState({ errorNTY: false, NTY: nty.toString(), USD: value })

                    break;
            }
        }
        if (this.state.errorNTY == true || this.state.errorAddress == true || this.state.addresswallet == '' || this.state.NTY == '') {
        } else {
            await this.setState({ VisibaleButton: false });
        }
    }

    Send() {
        this.setState(this.InitState);
        this.doSend.bind(this)
    }

    async  doSend() {
        this.spamPress = true;
        Keyboard.dismiss();
        this.setState({ dialogSend: false }, () => {
            setTimeout(() => {
                this.setState({ loading: true })
                if (this.state.walletaddress == '') {
                    console.log('chay vao day')
                    return;
                }
                if (this.state.viewSymbol == this.props.Symbol) {
                    if (this.props.network != 'tron') {
                        SendService(
                            this.props.DataToken.network,
                            this.state.addresswallet,
                            this.props.DataToken.addressWL,
                            parseFloat(this.state.NTY),
                            this.state.Password,
                            this.props.DataToken.PK_WL,
                            this.state.extraData,
                        ).then(data => {
                            this.setState(this.resetState)
                            console.log('send success: ' + data)
                            this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: data })
                            this.showScaleAnimationDialog('success', this.state.titleDialog, this.state.contentDialog);
                        }).catch(async error => {
                            // await this.setState({ dialogSend: false })
                            console.log('send error: ' + error)
                            console.log(error.slice(0, 34))
                            if (error.slice(0, 34) == "Returned error: known transaction:") {
                                this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: "0x" + error.slice(35, error.length) })
                                return;
                            }
                            if (error == 'Returned error: insufficient funds for gas * price + value') {
                                await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: Language.t('Send.AlerError.NotEnoughNTY') })
                            } else {
                                await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: error })
                            }
                            await this.showScaleAnimationDialog('error', this.state.titleDialog, this.state.contentDialog);
                        })
                    } else {
                        SendTRON(
                            this.state.addresswallet,
                            this.props.DataToken.addressWL,
                            parseFloat(this.state.NTY),
                            this.state.Password,
                            this.props.DataToken.PK_WL,
                            this.state.extraData
                        ).then(data => {
                            this.setState(this.resetState)
                            console.log('send success: ' + JSON.stringify(data))
                            this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: data.transaction.txID })
                            this.showScaleAnimationDialog('success', this.state.titleDialog, this.state.contentDialog);
                        }).catch(async error => {
                            console.log('send error: ' + error)
                            console.log(error.slice(0, 34))
                            if (error.slice(0, 34) == "Returned error: known transaction:") {
                                this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: "0x" + error.slice(35, error.length) })
                                return;
                            }
                            if (error == 'Returned error: insufficient funds for gas * price + value') {
                                await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: Language.t('Send.AlerError.NotEnoughNTY') })
                            } else {
                                await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: error })
                            }
                            await this.showScaleAnimationDialog('error', this.state.titleDialog, this.state.contentDialog);
                        })
                    }

                } else {
                    if (this.props.network != 'tron') {
                        SendToken(
                            this.props.DataToken.network,
                            this.state.tokenSelected.addressToken,
                            this.state.addresswallet,
                            this.props.DataToken.addressWL,
                            parseFloat(this.state.NTY),
                            this.state.Password,
                            this.props.DataToken.PK_WL,
                            this.state.extraData
                        )
                            .then(async data => {
                                await this.setState(this.resetState)
                                console.log('send success: ' + data)
                                await this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: data })
                                await this.showScaleAnimationDialog('success', this.state.titleDialog, this.state.contentDialog);
                            }).catch(async error => {
                                // await this.setState({ dialogSend: false })
                                console.log('send error: ' + error)
                                console.log(error.slice(0, 34))
                                if (error.slice(0, 34) == "Returned error: known transaction:") {
                                    this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: "0x" + error.slice(35, error.length) })
                                    return;
                                }
                                if (error == 'Returned error: insufficient funds for gas * price + value') {
                                    await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: Language.t('Send.AlerError.NotEnoughToken') })
                                } else {
                                    await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: error })
                                }
                                await this.showScaleAnimationDialog('error', this.state.titleDialog, this.state.contentDialog);
                            })
                    } else {
                        sendTokenTRON(
                            this.state.viewSymbol,
                            this.state.addresswallet,
                            this.props.DataToken.addressWL,
                            parseFloat(this.state.NTY),
                            this.state.Password,
                            this.props.DataToken.PK_WL,
                            this.state.extraData
                        )
                            .then(async data => {
                                await this.setState(this.resetState)
                                console.log('send success: ' + data)
                                await this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: data })
                                await this.showScaleAnimationDialog('success', this.state.titleDialog, this.state.contentDialog);
                            }).catch(async error => {
                                // await this.setState({ dialogSend: false })
                                console.log('send error: ' + error)
                                console.log(error.slice(0, 34))
                                if (error.slice(0, 34) == "Returned error: known transaction:") {
                                    this.setState({ titleDialog: Language.t('Send.SendSuccess.Title'), contentDialog: "0x" + error.slice(35, error.length) })
                                    return;
                                }
                                if (error == 'Returned error: insufficient funds for gas * price + value') {
                                    await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: Language.t('Send.AlerError.NotEnoughToken') })
                                } else {
                                    await this.setState({ titleDialog: Language.t('Send.AlerError.Error'), contentDialog: error })
                                }
                                await this.showScaleAnimationDialog('error', this.state.titleDialog, this.state.contentDialog);
                            })
                    }
                }
            }, Platform.OS == 'android' ? 0 : 350);
        })
    }

    handleCancel() {
        Keyboard.dismiss()
        this.setState({ dialogSend: false })
    }

    componentDidMount() {
        if (this.mouted) {
            getData('TouchID').then((touch) => {
                if (touch != null) {
                    this.setState({ showTouchID: true })
                } else {
                    this.setState({ showTouchID: false })
                }
            }).catch(() => {
                this.setState({ showTouchID: false })
            })
        }
    }

    componentWillUnmount() {
        this.mouted = false;
    }

    showScaleAnimationDialog = (typeModal, title, content) => {
        this.spamPress = false;
        this.setState({ loading: false }, () => {
            console.log(this.state.loading)
            setTimeout(() => {
                if (typeModal == "success") {
                    this.refs.PopupDialog.openModal(typeModal, title, content, true, this.state.deepLink)
                } else {
                    this.refs.PopupDialog.openModal(typeModal, title, content, false, this.state.deepLink)
                }
            }, 350);
        })
        // this.scaleAnimationDialog.show();

    }

    focusTheField = (id) => {
        this.inputs[id].focus();
    }
    inputs = {};

    selectToken = (token) => {
        console.log(token, this.props.Symbol)
        switch (token.name) {
            case this.props.Symbol:
                if (parseFloat(this.state.NTY) > 0) {
                    console.log('aaa')
                    let usd = Utils.round(parseFloat(this.state.NTY) * this.props.rate, 5);
                    this.setState({ viewSymbol: token.name, USD: usd.toString() })
                } else {
                    this.setState({ viewSymbol: token.name })
                }
                break;

            default:
                this.state.tokenSelected = token;
                if (parseFloat(this.state.NTY) > 0) {
                    this.setState({ viewSymbol: token.name, USD: "0" })
                } else {
                    this.setState({ viewSymbol: token.name, USD: "" })
                }
                break;
        }
    }
    Selected(item) {
        this.setState({ selected: item.name }, () => this.selectToken(item))
    }

    ButtonSend = () => {
        Keyboard.dismiss();
        if (this.state.VisibaleButton == true) {
            return;
        }
        if (this.state.showTouchID && !this.state.VisibaleButton) {
            getData('TouchID').then(data => {
                if (data != null) {
                    let options = {
                        title: "Nexty wallet", // Android
                        sensorDescription: Language.t("TouchID.Options.sensorDescription"), // Android
                        sensorErrorDescription: Language.t("TouchID.Options.sensorErrorDescription"), // Android
                        cancelText: Language.t("TouchID.Options.cancelText"), // Android
                        fallbackLabel: "", // iOS (if empty, then label is hidden)
                    };
                    var reason = Language.t("TouchID.Options.reason");

                    TouchID.authenticate(reason, options)
                        .then(success => {
                            try {
                                var passwordDecrypt = CryptoJS.AES.decrypt(data, cachePwd).toString(CryptoJS.enc.Utf8)
                                this.setState({ Password: passwordDecrypt }, () => {
                                    this.doSend()
                                })
                            } catch (error) {
                                console.log(error)
                            }

                        }).catch(err => {
                            setTimeout(() => {
                                this.setState({ dialogSend: true })
                            }, 350);
                        })
                } else {
                    this.setState({ dialogSend: true })
                }
            })
        } else {
            this.setState({ dialogSend: true })
        }

    }

    getBalance = () => {
        if (this.state.viewSymbol == this.props.Symbol) {
            console.log(this.props.DataToken.addressWL, this.props.network)
            updateBalance(this.props.DataToken.addressWL, this.props.network).then(balance => {
                console.log(balance)
                let usd = Utils.round(parseFloat(balance) * this.props.rate, 5);
                this.setState({ NTY: balance.toString(), USD: usd.toString() })
            }).catch(e => console.log(e))
        } else {
            SV_UpdateBalanceTk(this.state.tokenSelected.addressToken, this.props.network, this.props.DataToken.addressWL).then(balance => {
                this.setState({ NTY: balance, USD: '0' })
            })
        }
    }

    render() {
        const { ListToken } = this.props.DataToken;
        if (undefined !== ListToken && ListToken.length > 0) {
            if (ListToken[0].name != this.props.Symbol) {
                var ArrayToken = [{ name: this.props.Symbol }].concat(ListToken)
            }
        } else {
            var ArrayToken = [{ name: this.props.Symbol }]
        }

        return (
            <View style={Styles.container}>
                <Header
                    backgroundColor="transparent"
                    colorIconLeft="#328FFC"
                    colorTitle="#328FFC"
                    nameIconLeft="times"
                    title="Send"
                    style={{ paddingTop: getStatusBarHeight() }}
                    pressIconLeft={() => { this.props.navigation.goBack(); }}
                />
                <ScrollView style={{ backgroundColor: '#fafafa' }}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={'position'}
                        enabled
                        keyboardVerticalOffset={GLOBALS.hp('-10%')}
                    >
                        <View style={[Styles.container, { padding: GLOBALS.hp('2%') }]}>
                            {
                                ArrayToken.length > 0 &&
                                <FlatList
                                    style={{ paddingVertical: GLOBALS.hp('1%') }}
                                    horizontal={true}
                                    data={ArrayToken}
                                    renderItem={({ item, index }) => {
                                        return (
                                            <TouchableOpacity
                                                onPress={() => this.Selected(item)}
                                                style={
                                                    selectedBtn(this.state.selected === item.name).selected
                                                }
                                            >
                                                <Text style={[selectedBtn(this.state.selected === item.name).text]}>{item.name}</Text>
                                            </TouchableOpacity>
                                        )
                                    }}
                                    keyExtractor={(item, index) => item.name}
                                />
                            }
                            <View style={[Styles.Form, { height: GLOBALS.hp('11%') }]}>
                                <View style={{ flexDirection: 'row' }}>
                                    <TextInput
                                        value={this.state.addresswallet}
                                        editable={this.state.editAddress}
                                        style={Styles.InputToAddress}
                                        placeholder={Language.t('Send.SendForm.To')}
                                        onChangeText={(val) => this.CheckAddress(val)}
                                        returnKeyType={"next"}
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => { this.focusTheField('field2'); }}
                                        underlineColorAndroid="transparent"
                                    />
                                    <TouchableOpacity
                                        onPress={() => this.navigateToScan()}
                                        style={{ justifyContent: 'center', flex: 1, alignItems: 'center' }}
                                    >
                                        <Image source={require('../../images/icon/qr-code.png')} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={{
                                    color: GLOBALS.Color.danger,
                                    height: this.state.TextErrorAddress != '' ? 'auto' : 0
                                }}>{this.state.TextErrorAddress}</Text>
                            </View>

                            <View style={[Styles.Form, { height: GLOBALS.hp('50%') },]}>
                                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5 }}>
                                    <TextInput
                                        editable={this.state.editNTY}
                                        placeholder={this.state.viewSymbol}
                                        keyboardType="numeric"
                                        value={this.state.NTY}
                                        style={Styles.InputBalance}
                                        onChangeText={(val) => this.CheckNTY(val)}
                                        ref={input => { this.inputs['field2'] = input }}
                                        underlineColorAndroid="transparent"
                                    />
                                    <TouchableOpacity
                                        onPress={() => this.getBalance()}
                                    >
                                        <Text style={{ color: GLOBALS.Color.primary }}>Max</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5 }}>
                                    <TextInput
                                        editable={this.state.editUSD}
                                        placeholder="USD"
                                        keyboardType="numeric"
                                        value={this.state.USD}
                                        style={Styles.InputBalance}
                                        onChangeText={(val) => this.CheckUSD(val)}
                                        underlineColorAndroid="transparent"
                                    />
                                    <Image source={require('../../images/icon/dollar.png')} />
                                </View>

                                <Text style={{ color: GLOBALS.Color.danger, height: this.state.TextErrorAddress != '' ? 'auto' : 0 }}>{this.state.TextErrorNTY}</Text>

                                <TouchableOpacity style={Styles.button} disabled={this.state.VisibaleButton} onPress={() => { this.ButtonSend(); Keyboard.dismiss() }}>
                                    <Gradient
                                        colors={this.state.VisibaleButton ? ['#cccccc', '#cccccc'] : ['#328FFC', '#08AEEA']}
                                        style={{ paddingVertical: GLOBALS.hp('2%'), borderRadius: 5 }}
                                        start={{ x: 0.7, y: 0.0 }}
                                        end={{ x: 0.0, y: 0.0 }}
                                    >
                                        <Text style={Styles.TextButton}>{Language.t('Send.SendForm.TitleButton')}</Text>
                                    </Gradient>
                                </TouchableOpacity>

                                {this.state.buttomReset &&
                                    <TouchableOpacity style={{
                                        backgroundColor: '#fff',
                                        marginVertical: GLOBALS.hp('1%'),
                                        borderRadius: 5,
                                        flexDirection: 'row-reverse',
                                        justifyContent: 'center',
                                        paddingVertical: GLOBALS.hp('1%'),
                                        borderWidth: 2,
                                        borderColor: GLOBALS.Color.primary,
                                    }}
                                        onPress={() => this.setState(this.resetState)}>
                                        <Text style={{
                                            color: GLOBALS.Color.primary,
                                            textAlign: 'center',
                                            fontSize: 17,
                                            flex: 1,
                                            fontFamily: GLOBALS.font.Poppins
                                        }}>Reset</Text>
                                    </TouchableOpacity>
                                }


                            </View>
                            <View style={{ flex: 1 }} />
                        </View>

                        <Dialog.Container visible={this.state.dialogSend} >
                            <Dialog.Title>{Language.t('Send.ConfirmSend.Title')}</Dialog.Title>
                            <Dialog.Description>
                                {Language.t('Send.ConfirmSend.Content')}
                            </Dialog.Description>
                            <Dialog.Input placeholder={Language.t('Send.ConfirmSend.Placeholder')} onChangeText={(val) => this.setState({ Password: val })} secureTextEntry={true} autoFocus={true}></Dialog.Input>
                            <Dialog.Button label={Language.t('Send.ConfirmSend.TitleButtonCancel')} onPress={this.handleCancel.bind(this)} />
                            <Dialog.Button label={Language.t('Send.SendForm.TitleButton')} onPress={this.spamPress == true ? console.log('spam') : this.doSend.bind(this)} disabled={this.state.disabledButtomSend} />
                        </Dialog.Container>
                        <AlerModal ref="PopupDialog" />
                        {
                            this.state.loading ?
                                <Modal
                                    animationType='fade'
                                    transparent={true}
                                    visible={true}>
                                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.2)' }}>
                                        <ActivityIndicator size='large' color="#30C7D3" style={{ flex: 1 }} />
                                    </View>
                                </Modal>
                                : null
                        }
                    </KeyboardAvoidingView>
                </ScrollView >
            </View>
        )
    }
}


const Styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        // flexDirection: 'column'
    },
    Form: {
        padding: GLOBALS.hp('2%'),
        borderRadius: 7,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.24,
        shadowRadius: 1.27,
        elevation: 2,
        backgroundColor: '#fff',
        marginVertical: GLOBALS.hp('0.5%'),
        justifyContent: 'space-around'
    },
    button: {
        borderRadius: 5,
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.24,
        shadowRadius: 1.27,
        elevation: 2,
    },
    TextButton: {
        color: 'white',
        textAlign: 'center',
        fontSize: 17,
        fontFamily: GLOBALS.font.Poppins
    },
    ColumItem: {
        width: GLOBALS.WIDTH / 2.4,
    },

    TextButton: {
        color: 'white',
        textAlign: 'center',
        fontSize: 17,
        fontFamily: GLOBALS.font.Poppins
    },
    dialogContentView: {
        justifyContent: 'center',
    },

    InputToAddress: {
        fontSize: 20,
        flex: 9,
        fontFamily: GLOBALS.font.Poppins,
        paddingBottom: Platform.OS == 'ios' ? 'auto' : 0
    },
    InputBalance: {
        fontSize: 20,
        width: GLOBALS.WIDTH / 1.2,
        flex: 8,
        fontFamily: GLOBALS.font.Poppins,
        paddingBottom: Platform.OS == 'ios' ? 'auto' : 0
    }
})

const selectedBtn = (type) => StyleSheet.create({
    selected: {
        backgroundColor: type ? '#EDA420' : '#fafafa',
        borderRadius: 20,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        paddingRight: 15,
        margin: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: type ? 0.34 : 0,
        shadowRadius: 2.27,
        elevation: type ? 5 : 0,
    },
    text: {
        fontWeight: type ? 'bold' : 'normal',
        color: type ? '#FFFFFF' : "#000",
        fontFamily: GLOBALS.font.Poppins
    }
})
const mapStateToProps = state => {
    let network = ''
    switch (state.getListToken.network) {
        case 'nexty':
            network = 'NTY'
            break;
        case 'ethereum':
            network = 'ETH'
            break;
        default:
            network = 'TRX'
            break;
    }
    return {
        Symbol: network,
        DataToken: state.getListToken,
        rate: state.snapToWallet.rate,
        network: state.getListToken.network
    }
}
export default connect(mapStateToProps, null)(FormSend)
