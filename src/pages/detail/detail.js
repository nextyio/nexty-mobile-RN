import React, { Component } from 'react'
import { View, TouchableOpacity, Linking, StyleSheet, Text, Platform, Clipboard, ToastAndroid, Vibration, VibrationIOS } from 'react-native';
import GLOBALS from '../../helper/variables';
import CONSTANTS from '../../helper/constants'
// import Icon from "react-native-vector-icons/FontAwesome";
import {
    Container,
    Content,
    Left,
    Right,
    ListItem,
    Button,
    Body,
    List
} from "native-base";
import Icon from "react-native-vector-icons/FontAwesome";
import Language from '../../i18n/i18n';
import Gradient from 'react-native-linear-gradient';
import CustomToast from '../../components/toast'

export default class DetailHis extends Component {
    static navigationOptions = () => ({
        title: '',
        headerStyle: {
            backgroundColor: '#fafafa',
            borderBottomWidth: 0,
            elevation: 0
        },
        headerTitleStyle: {
            color: '#0C449A',
        },
        headerBackTitleStyle: {
            color: '#0C449A'
        },
        headerTintColor: '#0C449A',
    });

    copy = (value) => {
        Clipboard.setString(value)
        Vibration.vibrate(100)
        if (Platform.OS == "android") {
            ToastAndroid.show(Language.t('Backup.GetSuccess.TitleCopied'), ToastAndroid.BOTTOM)
        } else {
            this.refs.defaultToastBottom.ShowToastFunction(Language.t('Backup.GetSuccess.TitleCopied'));
        }
    }

    render() {
        var data = this.props.navigation.getParam('data');
        console.log("data: ", JSON.stringify(data));

        return (
            <Container style={{ backgroundColor: "#fafafa", padding: GLOBALS.hp('2%') }}>
                <View style={{
                    paddingHorizontal: GLOBALS.wp('4%'),
                    paddingVertical: GLOBALS.hp('3%'),
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 0,
                    },
                    shadowOpacity: 0.34,
                    shadowRadius: 2.27,
                    elevation: 5,
                    borderRadius: 10,
                    flex: 1,
                    backgroundColor: '#fff',
                    justifyContent: 'center'
                }} >
                    <Text style={{
                        fontSize: GLOBALS.hp('4%'),
                        fontWeight: '400',
                        color: '#444444',
                        fontFamily: GLOBALS.font.Poppins,
                        marginBottom: GLOBALS.hp('5%'),
                        textAlign: 'center'
                    }}>{Language.t('DetailHistory.Title')}</Text>

                    <ListItem icon style={{ marginTop: 5, marginBottom: 5, marginLeft: 0 }} onPress={() => { this.copy(data.tx) }} >
                        <Body>
                            <Text style={styleText} >{Language.t('DetailHistory.Txhash')}</Text>
                            <Text style={styleText} note numberOfLines={1} ellipsizeMode="middle" >{data.tx}</Text>
                        </Body>
                    </ListItem>

                    <ListItem icon style={{ marginTop: 5, marginBottom: 5, marginLeft: 0, marginLeft: 0 }} onPress={() => { data.type == "arrow-up" ? this.copy(data.data.to) : this.copy(data.data.from) }}>
                        <Body>
                            <Text style={styleText}>{data.type == "arrow-up" ? Language.t('DetailHistory.To') : Language.t('DetailHistory.From')}</Text>
                            <Text
                                style={styleText}
                                note
                                numberOfLines={1}
                                ellipsizeMode="middle"
                            >
                                {data.type == "arrow-up" ? data.data.to : data.data.from}
                            </Text>
                        </Body>
                    </ListItem>

                    <ListItem icon style={{ marginTop: 5, marginBottom: 5, marginLeft: 0 }}>
                        <Body>
                            <Text style={styleText}>{Language.t('DetailHistory.Amount')}</Text>
                            {
                                Platform.OS == "ios" ?
                                    <Text style={styleText} note numberOfLines={1}>{
                                        parseFloat(data.quantity) % 1 == 0
                                            ? parseFloat(data.quantity).toLocaleString()
                                            : parseFloat(data.quantity).toFixed(2).toLocaleString()
                                    }</Text>
                                    :
                                    <Text style={styleText} note numberOfLines={1}>{
                                        parseFloat(data.quantity) % 1 == 0
                                            ? (parseFloat(data.quantity).toLocaleString()).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                            : (parseFloat(data.quantity).toFixed(2).toLocaleString()).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }</Text>
                            }
                        </Body>
                    </ListItem>

                    <ListItem icon style={{ marginTop: 5, marginBottom: 5, marginLeft: 0 }}>
                        <Body>
                            <Text style={styleText}>{Language.t('DetailHistory.Date')}</Text>
                            <Text note numberOfLines={1} style={styleText}>{data.datetime}</Text>
                        </Body>
                    </ListItem>

                    <ListItem icon style={{ marginTop: 5, marginBottom: 5, marginLeft: 0 }}>
                        <Body>
                            <Text style={styleText}>{Language.t('DetailHistory.Status')}</Text>
                            <Text style={{ color: "green", fontFamily: GLOBALS.font.Poppins }} note numberOfLines={1} >COMPLETE</Text>
                        </Body>
                    </ListItem>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => Linking.openURL(CONSTANTS.EXPLORER_API + '/#/tx/' + data.tx)}
                    >
                        <Gradient
                            colors={['#0C449A', '#082B5F']}
                            start={{ x: 1, y: 0.7 }}
                            end={{ x: 0, y: 3 }}
                            style={{ paddingVertical: GLOBALS.hp('2%'), borderRadius: 5 }}
                        >
                            <Text style={styles.TextButton}>{Language.t('DetailHistory.TitleButton')}</Text>
                        </Gradient>

                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <CustomToast ref="defaultToastBottom" position="bottom" />
                    </View>
                </View>
            </Container>
        )
    }
}
const styleText = {
    fontFamily: GLOBALS.font.Poppins
}
const styles = StyleSheet.create({
    TextButton: {
        color: 'white',
        textAlign: 'center',
        fontSize: GLOBALS.wp('4%'),
        fontFamily: GLOBALS.font.Poppins,
    },
    button: {
        justifyContent: 'center',
        shadowOffset: { width: 3, height: 3, },
        shadowColor: 'black',
        shadowOpacity: 0.2,
        marginVertical: GLOBALS.hp('4%'),
    },
})