import React, { Component } from 'react'
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    TouchableOpacity,
    Alert,
    Keyboard,
    Platform,
    TextInput,
    PixelRatio,
    Image,
    BackHandler
} from 'react-native';
import GLOBALS from '../../helper/variables';
import { GetInfoToken } from '../../services/wallet.service';
import { setData, getData, rmData } from '../../services/data.service'
import Language from '../../i18n/i18n';
import IconFeather from "react-native-vector-icons/Feather"
import Gradient from 'react-native-linear-gradient'
import { CheckExistToken, InsertNewToken } from '../../../realm/walletSchema'
import Header from '../../components/header';
import Icon from "react-native-vector-icons/FontAwesome";
import { getInforTRONToken } from '../../services/tron.service'


export default class Addtoken extends Component {
    componentDidMount() {
        BackHandler.addEventListener('BackHandler', () => {
            this.props.navigation.state.params.payload.refreshListToken()
        })
    }
    componentWillUnmount() {
        BackHandler.removeEventListener('BackHandler');
        this.props.navigation.state.params.payload.refreshListToken()
    }
    render() {
        return (
            <Gradient
                colors={['#F0F3F5', '#E8E8E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <Header
                    backgroundColor="transparent"
                    colorIconLeft="#328FFC"
                    colorTitle="#328FFC"
                    nameIconLeft="arrow-left"
                    title={Language.t('AddToken.Title')}
                    style={{ marginTop: 23 }}
                    pressIconLeft={() => this.props.navigation.goBack()}
                    nameIconRight="list"
                    colorIconRight="#328FFC"
                    pressIconRight={() => this.props.navigation.navigate('ListToken', { payload: { network: this.props.navigation.getParam('payload').network } })}
                />

                <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }} contentContainerStyle={{ flex: 1 }}>
                    <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={Platform.OS == "ios" ? 0 : GLOBALS.hp('-30%')} enabled style={{ flex: 1 }} contentContainerStyle={{ flex: 1 }}>
                        <FormAddToken {...this.props} />
                    </KeyboardAvoidingView>
                </ScrollView>
            </Gradient>
        )
    }
}

class FormAddToken extends Component {
    network: string = "Nexty"
    initState = {
        addressTK: '',
        txtErr: '',
        symbol: '',
        decimals: '',
        typeButton: true,
        ValidToken: false,
        ExistToken: false,
        balance: '',
    }
    constructor(props) {
        super(props)
        this.state = this.initState;
    };
    componentWillMount() {
        getData('Network').then(net => {
            this.network = net;
        })
    }

    async setValue(val: string, network: string, addressWL: string) {
        this.setState({ addressTK: val });
        if (val.length > 0) {
            if (network != 'tron') {
                GetInfoToken(val, network, addressWL).then(async data => {
                    if (data.symbol != null) {
                        await this.setState({ symbol: data.symbol, decimals: data.decimals, balance: data.balance, ValidToken: false, txtErr: '' }, () => {
                            this.disableButton()
                        })
                    }
                    else {
                        await this.setState({ ValidToken: true, txtErr: Language.t('AddToken.ValidToken'), symbol: '' }, () => {
                            this.disableButton()
                        })
                    }
                }).catch(async err => {
                    console.log(err);
                    await this.setState({ ValidToken: true, txtErr: Language.t('AddToken.ValidToken'), symbol: '' }, () => {
                        this.disableButton()
                    })
                })
            } else {
                getInforTRONToken(val, addressWL).then(async data => {
                    if (data.symbol != null) {
                        await this.setState({ symbol: data.symbol, decimals: data.decimals, balance: data.balance, ValidToken: false, txtErr: '' }, () => {
                            this.disableButton()
                        })
                    }
                    else {
                        await this.setState({ ValidToken: true, txtErr: Language.t('AddToken.ValidToken'), symbol: '' }, () => {
                            this.disableButton()
                        })
                    }
                }).catch(async err => {
                    console.log(err);
                    await this.setState({ ValidToken: true, txtErr: Language.t('AddToken.ValidToken'), symbol: '' }, () => {
                        this.disableButton()
                    })
                })
            }
        }
    }

    async disableButton() {
        if (this.state.ValidToken == true || this.state.ExistToken == true || this.state.symbol == '' || this.state.addressTK == '') {
            await this.setState({ typeButton: true })
        } else {
            await this.setState({ typeButton: false })
        }
    }

    addToken = () => {
        const { network } = this.props.navigation.getParam('payload')
        CheckExistToken(this.state.symbol, network).then(exist => {
            if (exist) {
                Alert.alert(
                    Language.t('AddToken.AlerError.Title'),
                    Language.t('AddToken.AlerError.Content'),
                    [{ text: Language.t('AddToken.AlerError.TitleButton'), onPress: () => this.setState(this.initState), style: 'cancel' }]
                )
            } else {
                var token = {
                    id: Math.floor(Date.now() / 1000) + 1,
                    walletId: Math.floor(Date.now() / 1000),
                    name: this.state.symbol,
                    addressToken: this.state.addressTK,
                    balance: parseFloat(this.state.balance),
                    network: network,
                    avatar: '',
                    exchagerate: '0',
                    change: '0'
                }
                console.log('token want add', token)
                InsertNewToken(token).then(ss => {
                    Alert.alert(
                        Language.t('AddToken.AlerSuccess.Title'),
                        Language.t('AddToken.AlerSuccess.Content'),
                        [{ text: Language.t('AddToken.AlerSuccess.TitleButton'), onPress: () => this.setState(this.initState), style: 'cancel' }]
                    )
                }).catch(e => console.log(e))
            }
        }).catch(er => console.log(er))
    }


    render() {
        const { network, addressWL } = this.props.navigation.getParam('payload');
        return (
            <View style={styles.container}>
                {/* <View style={styles.MainForm}> */}
                <View style={{ alignItems: 'center', paddingVertical: GLOBALS.hp('5%') }}>
                    <Image
                        source={require('../../images/Add-token.png')}
                        resizeMode="contain"
                        style={{ height: GLOBALS.wp('40%'), width: GLOBALS.wp('40%') }} />
                </View>
                <View style={styles.styleTextInput}>
                    <TextInput
                        placeholder={Language.t("AddToken.FormAdd.PlaceholderToken")}
                        value={this.state.addressTK}
                        onChangeText={(value) => { this.setValue(value, network, addressWL) }}
                        style={styles.TextInput}
                        underlineColorAndroid="transparent"
                    />
                </View>
                <Text style={{ color: GLOBALS.Color.danger, textAlign: 'left' }}>{this.state.txtErr}</Text>

                <View style={styles.styleTextInput}>
                    <TextInput
                        placeholder={Language.t("AddToken.FormAdd.PlaceholderSymbol")}
                        editable={false}
                        value={this.state.symbol}
                        style={styles.TextInput}
                        underlineColorAndroid="transparent"
                    />
                </View>
                <View style={{ alignItems: 'center', paddingVertical: GLOBALS.hp('2%') }}>
                    <TouchableOpacity onPress={this.addToken} disabled={this.state.typeButton}>
                        <Gradient
                            colors={this.state.typeButton ? ['#cccccc', '#cccccc'] : ['#328FFC', '#08AEEA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styleButton(this.state.typeButton).button}
                        >
                            <Text style={styles.TextButton}>{Language.t('AddToken.FormAdd.TitleButton')}</Text>
                        </Gradient>
                    </TouchableOpacity>
                </View>
                {/* </View> */}
            </View>
        )
    }
}

/* style button */
var styleButton = (type) => StyleSheet.create({
    button: {
        justifyContent: 'center',
        shadowOffset: {
            width: 3,
            height: 3,
        },
        shadowColor: '#000',
        shadowOpacity: type ? 0.2 : 0,
        borderRadius: 5,
        paddingHorizontal: GLOBALS.wp('20%'),
        paddingVertical: GLOBALS.hp('2%'),
    }
})

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: GLOBALS.hp('2%'),
        backgroundColor: 'transparent',
        justifyContent: 'center'

    },
    MainForm: {
        flex: 1,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: {
            width: -1,
            height: 3,
        },
        shadowOpacity: 0.24,
        shadowRadius: 2.27,
        elevation: 2,
        borderRadius: 5,
        padding: GLOBALS.hp('2.5%'),
        justifyContent: 'center'
    },
    TextButton: {
        color: 'white',
        textAlign: 'center',
        fontSize: 15,
        fontFamily: GLOBALS.font.Poppins,
        fontWeight: '400',
    },
    styleTextInput: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#E9E9E9',
        paddingVertical: Platform.OS === 'ios' ? GLOBALS.hp('1.5%') : 'auto',
        borderRadius: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    TextInput: {
        flex: 8,
        fontSize: GLOBALS.fontsize(2.5),
        paddingLeft: GLOBALS.wp('5%')
    },
})

