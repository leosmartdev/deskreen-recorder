import { ErrorMessage } from '../../components/ErrorDialog/ErrorMessageEnum';
import {
  getBrowserFromUAParser,
  getDeviceTypeFromUAParser,
  getOSFromUAParser,
} from '../../utils/userAgentParserHelpers';
import PeerConnectionSocketNotDefined from './errors/PeerConnectionSocketNotDefined';
import setAndShowErrorDialogMessage from './setAndShowErrorDialogMessage';

export function getMyIPCallback(
  peerConnection: PeerConnection,
  ip: string,
  userAgent: string
) {
  peerConnection.myDeviceDetails.myIP = ip;

  peerConnection.uaParser.setUA(userAgent);
  peerConnection.myDeviceDetails.myOS = getOSFromUAParser(
    peerConnection.uaParser
  );
  peerConnection.myDeviceDetails.myDeviceType = getDeviceTypeFromUAParser(
    peerConnection.uaParser
  );
  peerConnection.myDeviceDetails.myBrowser = getBrowserFromUAParser(
    peerConnection.uaParser
  );

  peerConnection.initApp(peerConnection.user, ip);
}

export default (peerConnection: PeerConnection) => {
  if (!peerConnection.socket) {
    throw new PeerConnectionSocketNotDefined();
  }

  peerConnection.socket.on('disconnect', () => {
    setAndShowErrorDialogMessage(peerConnection, ErrorMessage.DISCONNECTED);
  });

  peerConnection.socket.on('connect', () => {
    setTimeout(() => {
      peerConnection.socket.emit('GET_MY_IP', (ip: string) => {
        getMyIPCallback(peerConnection, ip, window.navigator.userAgent);
      });
    }, 500);
  });

  peerConnection.socket.on('NOT_ALLOWED', () => {
    setAndShowErrorDialogMessage(peerConnection, ErrorMessage.NOT_ALLOWED);
  });

  peerConnection.socket.on(
    'USER_ENTER',
    (payload: { users: PartnerPeerUser[] }) => {
      const filteredPartner = payload.users.filter((v) => {
        return peerConnection.user.publicKey !== v.publicKey;
      });

      peerConnection.partner = filteredPartner[0];

      if (!peerConnection.partner) return;

      peerConnection.sendEncryptedMessage({
        type: 'DEVICE_DETAILS',
        // TODO: add deviceIP in this payload
        payload: {
          os: peerConnection.myDeviceDetails.myOS,
          deviceType: peerConnection.myDeviceDetails.myDeviceType,
          browser: peerConnection.myDeviceDetails.myBrowser,
          deviceScreenWidth: window.screen.width,
          deviceScreenHeight: window.screen.height,
        },
      });

      peerConnection.sendEncryptedMessage({
        type: 'GET_APP_THEME',
        payload: {},
      });
      peerConnection.sendEncryptedMessage({
        type: 'GET_APP_LANGUAGE',
        payload: {},
      });

      setTimeout(() => {
        peerConnection.UIHandler.setMyDeviceDetails({
          myIP: peerConnection.myDeviceDetails.myIP,
          myOS: peerConnection.myDeviceDetails.myOS,
          myBrowser: peerConnection.myDeviceDetails.myBrowser,
          myDeviceType: peerConnection.myDeviceDetails.myDeviceType,
        });
      }, 100);
    }
  );

  // peerConnection.socket.on('USER_EXIT', (payload: any) => {
  //   // peerConnection.props.receiveUnencryptedMessage('USER_EXIT', payload);
  // });

  peerConnection.socket.on(
    'ENCRYPTED_MESSAGE',
    (payload: ReceiveEncryptedMessagePayload) => {
      peerConnection.receiveEncryptedMessage(payload);
    }
  );

  peerConnection.socket.on('ROOM_LOCKED', () => {
    setAndShowErrorDialogMessage(peerConnection, ErrorMessage.DENY_TO_CONNECT);
  });
};
