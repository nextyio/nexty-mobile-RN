import React, { Component } from 'react';
import { View, Text, StatusBar, FlatList, TouchableOpacity, Image, Alert, ImageBackground } from 'react-native';
import { connect } from 'react-redux';
import { getStatusBarHeight } from 'react-native-iphone-x-helper'
import GLOBAL from '../../helper/variables'
import Header from '../../components/header';
import Gradient from 'react-native-linear-gradient';
import { RemoveWallet } from '../../services/auth.service'
import Dialog from "react-native-dialog";
import { SelectAllWallet, DeleteWallet } from '../../../realm/walletSchema'
import Language from '../../i18n/i18n';
import { bindActionCreators } from 'redux';
import { fetchAllWallet } from '../../../redux/actions/slideWalletAction'
import Icon from "react-native-vector-icons/FontAwesome";


interface item {
    bg_net: any,
    img_net: any,
    color_text_backup: string,
    name_token: string,
    color_gradient: Array,
    color_button: string
}


class PageDeleteWL extends Component {
    state = {
        listWallet: [],
        dialogVisible: false,
        passcode: '',
        id: '',
        visibleBtnRM: false
    }

    componentWillMount() {
        this.loadData()
    }

    loadData() {
        SelectAllWallet().then(data => {
            this.setState({ listWallet: data })
            if (data.length == 1) {
                this.setState({ visibleBtnRM: true })
            }
        })
    }

    DeleteWallet(id) {
        DeleteWallet(id).then(ss => {
            console.log(ss)
            this.loadData()
        }).catch(e => console.log(e))
    }
    async handleOK() {
        if (this.state.passcode == '') {
            Alert.alert(
                Language.t('Send.AlerError.Error'),
                Language.t('PrivateKey.Aler.Content'),
                [
                    { text: Language.t('PrivateKey.Aler.TitleButtonCancel'), onPress: () => { this.setState({ dialogVisible: false, privatekey: '' }) }, style: 'cancel' },
                    { text: Language.t('PrivateKey.Aler.TitleButtonTry'), onPress: () => this.setState({ dialogVisible: true, passcode: '' }) }
                ]
            )
            return;
        }
        await RemoveWallet(this.state.id, this.state.passcode)
            .then(ss => {
                this.setState({ dialogVisible: false, passcode: '' }, () => {
                    setTimeout(() => {
                        Alert.alert(
                            Language.t("ManageWallet.AlertSuccess.title"),
                            Language.t("ManageWallet.AlertSuccess.content"),
                            [{ text: 'Ok', onPress: () => { this.loadData(); this.props.fetchAllWallet() }, style: 'cancel' }]
                        )
                    }, 350)

                })

            }).catch((e) => {
                Alert.alert(
                    Language.t("Restore.Error"),
                    e,
                    [{ text: 'Ok', style: 'cancel' }]
                )
                console.log(e)
            })

    }

    handleCancel() {
        this.setState({ dialogVisible: false, passcode: '' })
    }

    _actionBtnRM = (id) => {
        if (this.state.visibleBtnRM) {
            Alert.alert(
                'Error',
                'Needs at least 1 wallet',
                [{ text: 'Ok', style: 'cancel' }]
            )
        } else {
            this.setState({ dialogVisible: true, id: id })
        }
    }

    render() {
        return (
            <Gradient
                colors={['#F0F3F5', '#E8E8E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}>
                <StatusBar
                    backgroundColor={'transparent'}
                    translucent
                    barStyle="dark-content"
                />
                <Header
                    backgroundColor="transparent"
                    colorIconLeft="#328FFC"
                    colorTitle="#328FFC"
                    nameIconLeft="align-left"
                    title={Language.t("ManageWallet.Title")}
                    style={{ paddingTop: getStatusBarHeight() }}
                    pressIconLeft={() => { this.props.navigation.openDrawer() }}
                />
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <View style={{ flex: 9 }}>
                        {
                            this.state.listWallet.length > 0 &&
                            <FlatList
                                data={this.state.listWallet}
                                // renderItem={this._renderItem}
                                contentContainerStyle={{ paddingHorizontal: GLOBAL.wp('2%') }}
                                renderItem={({ item, index }) => {
                                    let StyleItem: item;
                                    if (item.network.name) {
                                        switch (item.network.name) {
                                            case 'nexty':
                                                StyleItem = {
                                                    bg_net: require('../../images/dasboard/bgEntry/nexty/bg_nty.png'),
                                                    img_net: require('../../images/dasboard/bgEntry/nexty/img_nty.png'),
                                                    name_token: 'NTY',
                                                    color_gradient: ['#325EFC', '#2AA0F5'],
                                                    color_button: '#2B8FF6'
                                                }
                                                break;
                                            case 'ethereum':
                                                StyleItem = {
                                                    bg_net: require('../../images/dasboard/bgEntry/ethereum/bg_eth.png'),
                                                    img_net: require('../../images/dasboard/bgEntry/ethereum/img_eth.png'),
                                                    name_token: 'ETH',
                                                    color_gradient: ['#C4C4C4', '#979797'],
                                                    color_button: '#C4C4C4'
                                                }
                                                break;
                                            default:
                                                StyleItem = {
                                                    bg_net: require('../../images/dasboard/bgEntry/tron/bg_trx.png'),
                                                    img_net: require('../../images/dasboard/bgEntry/tron/img_trx.png'),
                                                    name_token: 'TRX',
                                                    color_gradient: ['#7D0202', '#F34C4C'],
                                                    color_button: '#D63A3A'
                                                }
                                                break;
                                        }
                                    }

                                    return (
                                        <View style={{
                                            marginBottom: GLOBAL.hp('1.5%'),
                                            flex: 1,
                                            flexDirection: 'row',
                                            shadowColor: "#000",
                                            shadowOffset: {
                                                width: 0,
                                                height: 2,
                                            },
                                            shadowOpacity: 0.44,
                                            shadowRadius: 2.27,
                                            elevation: 5,
                                        }}>
                                            <Gradient
                                                colors={StyleItem.color_gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={{
                                                    flex: 8.7,
                                                    borderTopStartRadius: 7,
                                                    borderBottomStartRadius: 7,
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <ImageBackground
                                                    source={StyleItem.bg_net}
                                                    style={{ flex: 4, justifyContent: "center", alignItems: 'center' }}
                                                    resizeMode="cover"

                                                >
                                                    <Image source={StyleItem.img_net} />
                                                </ImageBackground>
                                                <View
                                                    style={{
                                                        paddingRight: GLOBAL.wp('5%'),
                                                        flex: 6,
                                                        paddingVertical: GLOBAL.hp('4%')
                                                    }}>
                                                    <Text style={{
                                                        color: '#fff',
                                                        fontFamily: GLOBAL.font.Poppins,
                                                        textAlign: 'right',
                                                        fontSize: GLOBAL.fontsize(2)
                                                    }}>{item.name}</Text>
                                                    <Text style={{
                                                        fontWeight: 'bold',
                                                        color: '#fff',
                                                        fontFamily: GLOBAL.font.Poppins,
                                                        textAlign: 'right',
                                                        fontSize: GLOBAL.fontsize(3)
                                                    }}>{item.balance}</Text>
                                                </View>
                                            </Gradient>
                                            <TouchableOpacity
                                                onPress={() => this._actionBtnRM(item.id)}
                                                style={{
                                                    flex: 1.3,
                                                    backgroundColor: StyleItem.color_button,
                                                    borderTopEndRadius: 7,
                                                    borderBottomEndRadius: 7,
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                <Icon name="times" size={GLOBAL.fontsize(3)} color="#fff" />
                                            </TouchableOpacity>
                                        </View >

                                    )
                                }}
                            />
                        }
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: GLOBAL.wp('2%'), justifyContent: 'center' }}>
                        <TouchableOpacity
                            onPress={() => this.props.navigation.navigate('AddNewWallet')}
                        >
                            <Gradient
                                colors={['#328FFC', '#08AEEA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    borderRadius: 4,
                                    paddingVertical: GLOBAL.hp('1.5%'),
                                }}
                            >
                                <Text style={{
                                    textAlign: 'center',
                                    color: '#fff',
                                    fontFamily: GLOBAL.font.Poppins,
                                    fontWeight: 'bold'
                                }}>Add new wallet</Text>
                            </Gradient>
                        </TouchableOpacity>
                    </View>

                </View>

                <Dialog.Container visible={this.state.dialogVisible} >
                    <Dialog.Title
                        style={{ fontFamily: GLOBAL.font.Poppins }}
                    >
                        {Language.t("ManageWallet.AlertConfirm.title")}
                    </Dialog.Title>
                    <Dialog.Description style={{ fontFamily: GLOBAL.font.Poppins }}>
                        {Language.t("ManageWallet.AlertConfirm.content")}
                    </Dialog.Description>
                    <Dialog.Input
                        placeholder={Language.t("ManageWallet.AlertConfirm.placeholderInput")}
                        onChangeText={(val) => this.setState({ passcode: val })}
                        secureTextEntry={true} value={this.state.passcode}
                        autoFocus={true}
                    />
                    <Dialog.Button
                        label={Language.t("ManageWallet.AlertConfirm.cancel")}
                        onPress={this.handleCancel.bind(this)}
                    />
                    <Dialog.Button
                        label={Language.t("ManageWallet.AlertConfirm.ok")}
                        onPress={this.handleOK.bind(this)}
                    />
                </Dialog.Container>
            </Gradient>
        )
    }
}


const mapDispatchToProps = dispatch => {
    return bindActionCreators({ fetchAllWallet }, dispatch)
}

export default connect(null, mapDispatchToProps)(PageDeleteWL)
