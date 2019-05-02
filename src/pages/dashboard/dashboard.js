import React, { Component } from 'react'
import { Text, View, ImageBackground, StatusBar, TouchableOpacity, BackHandler, Alert } from 'react-native'
import { SelectAllWallet, GetInforWallet } from '../../../realm/walletSchema';
import ListCoin from '../../components/listWallet';
import Header from '../../components/header';
import ComponentToken from '../../components/listToken';
import GLOBALS from '../../helper/variables';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchRate, fetchAllWallet, GetListToken, ONSNAPWALLET } from '../../../redux/actions/slideWalletAction'
import SegmentControl from 'react-native-segment-controller';
import Segment from './segmentComponent';
import { Avatar } from 'react-native-elements';
import Language from '../../i18n/i18n';
import { NavigationActions } from 'react-navigation';
import { getBottomSpace } from 'react-native-iphone-x-helper'

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ListWallet: [],
            index: 0,
            showListWL: true
        }
        this.backButtonClick = this.backButtonClick.bind(this)
    }

    componentWillMount() {
        // this.props.fetchRate('nexty', 0);
        this.fetchListWallet()
        SelectAllWallet().then(ListWallet => {
            this.setState({ ListWallet })
        })
    }

    componentWillUnmount() {
        BackHandler.removeEventListener("hardwareBackPress", this.backButtonClick);
        // this.setState({ showListWL: false })
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.backButtonClick);
    }

    backButtonClick() {
        const { dispatch } = this.props.navigation;
        const parent = this.props.navigation.dangerouslyGetParent();
        const isDrawerOpen = parent && parent.state && parent.state.isDrawerOpen;
        if (this.props.navigation.isFocused() == true) {
            this.props.navigation.closeDrawer();
            if (isDrawerOpen == true) {
                this.props.navigation.closeDrawer();
                return true;
            } else {
                Alert.alert(
                    Language.t('ConfirmLogout.Title'),
                    Language.t('ConfirmLogout.exitapp'),
                    [
                        { text: Language.t('ConfirmLogout.ButtonCancel'), style: 'cancel', onPress: () => { return true } },
                        { text: Language.t('ConfirmLogout.ButtonAgree'), onPress: () => { BackHandler.exitApp(); return false } }
                    ]
                )
                return true
            }
        }
        else {
            dispatch(NavigationActions.back());
            this.props.navigation.goBack()
            return true;
        }
    }

    fetchListWallet = () => {
        this.props.fetchAllWallet()
    }

    RefreshListToken = () => {
        const { data } = this.props.ActionDB;
        GetInforWallet(this.props.snapToWallet.walletID).then(data => {
            this.props.GetListToken(data.network.name, data.address, data.name, data.pk_en)
        })
        // this.props.GetListToken(this.props.snapToWallet.network, data[0].address, data[0].name, data[0].pk_en)
    }


    render() {
        const { exchange, walletID } = this.props.snapToWallet;
        const { data } = this.props.ActionDB;
        let typeRender = true
        if (data.findIndex(x => x.id == 'accessing object of type walletschema which has been invalidated or deleted') > -1) {
            typeRender = false
        } else {
            typeRender = true
        }
        const { DataToken, status } = this.props
        return (
            <View style={{ flex: 1, backgroundColor: '#F2F2F2' }}>
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
                    title={exchange}
                    style={{ marginTop: 23 }}
                    pressIconLeft={() => { this.props.navigation.openDrawer(); }}
                />
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    {
                        data.length > 0 && typeRender == true ?
                            <ListCoin
                                Data={data}
                                navigation={this.props.navigation}
                            />
                            :
                            null
                    }
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        {
                            exchange != '' &&
                            <View style={{
                                flex: 1,
                                flexDirection: 'row',
                                marginVertical: GLOBALS.hp('1%'),
                                paddingHorizontal: GLOBALS.wp('3%'),
                            }}>
                                <Text style={{
                                    color: "#328FFC",
                                    fontSize: GLOBALS.fontsize(3),
                                    flex: 8,
                                    fontFamily: GLOBALS.font.Poppins
                                }}>Tokens</Text>
                                <Avatar
                                    icon={{
                                        name: 'plus',
                                        type: 'font-awesome',
                                        color: '#328FFC'
                                    }}
                                    overlayContainerStyle={{
                                        backgroundColor: 'transparent',
                                        borderWidth: 1,
                                        borderColor: '#328FFC',
                                        flex: 2
                                    }}
                                    onPress={() => this.props.navigation.navigate('Addtoken', {
                                        payload: {
                                            addressWL: DataToken.addressWL,
                                            network: this.props.snapToWallet.network,
                                            refreshListToken: this.RefreshListToken
                                        }
                                    })}
                                    rounded
                                />
                            </View>
                        }
                    </View>
                    <View style={{ flex: 4.5 }}>
                        {
                            DataToken.ListToken.length > 0 && !status &&
                            <ComponentToken
                                InforToken={DataToken.ListToken}
                                addressWL={DataToken.addressWL}
                                network={DataToken.network}
                                status={status}
                            />
                        }
                    </View>

                    <View style={{
                        flex: 0.7,
                        justifyContent: 'center',
                        paddingHorizontal: GLOBALS.wp('10%'),
                        paddingBottom: 10,
                    }}>
                        {
                            exchange != '' &&
                            <Segment
                                navigation={this.props.navigation}
                                Data={DataToken}
                                walletID={walletID}
                            />
                        }
                    </View>

                </View>

            </View>
        )
    }
}

function mapStateToProps(state) {
    return {
        snapToWallet: state.snapToWallet,
        ActionDB: state.ActionDB,
        DataToken: state.getListToken,
        status: state.eventSnap.status,
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ fetchRate, fetchAllWallet, GetListToken }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard)