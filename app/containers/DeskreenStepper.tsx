/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useCallback, useContext, useEffect } from 'react';
import { ipcRenderer, remote } from 'electron';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { Row, Col, Grid } from 'react-flexbox-grid';
import settings from 'electron-settings';
import {
  Button,
  Dialog,
  H1,
  H3,
  H4,
  H5,
  Icon,
  Spinner,
  Text,
} from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { useToasts } from 'react-toast-notifications';
import SuccessStep from '../components/StepsOfStepper/SuccessStep';
import IntermediateStep from '../components/StepsOfStepper/IntermediateStep';
import AllowConnectionForDeviceAlert from '../components/AllowConnectionForDeviceAlert';
import DeviceConnectedInfoButton from '../components/StepperPanel/DeviceConnectedInfoButton';
import ColorlibStepIcon, {
  StepIconPropsDeskreen,
} from '../components/StepperPanel/ColorlibStepIcon';
import ColorlibConnector from '../components/StepperPanel/ColorlibConnector';
import { SettingsContext } from './SettingsProvider';
import SharingSessionService from '../features/SharingSessionService';
import ConnectedDevicesService from '../features/ConnectedDevicesService';
import SharingSessionStatusEnum from '../features/SharingSessionService/SharingSessionStatusEnum';
import Logger from '../utils/LoggerWithFilePrefix';
import LanguageSelector from '../components/LanguageSelector';
import { getShuffledArrayOfHello } from '../configs/i18next.config.client';
import ToggleThemeBtnGroup from '../components/ToggleThemeBtnGroup';

const log = new Logger(__filename);

const sharingSessionService = remote.getGlobal(
  'sharingSessionService'
) as SharingSessionService;
const connectedDevicesService = remote.getGlobal(
  'connectedDevicesService'
) as ConnectedDevicesService;

const Fade = require('react-reveal/Fade');

const useStyles = makeStyles(() =>
  createStyles({
    stepContent: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepLabelContent: {
      marginTop: '10px !important',
      height: '110px',
    },
    stepperComponent: {
      paddingBottom: '0px',
    },
  })
);

function getSteps(t: TFunction) {
  return [t('Connect'), t('Select'), t('Confirm')];
}

// eslint-disable-next-line react/display-name
const DeskreenStepper = React.forwardRef((_props, ref) => {
  const { t } = useTranslation();

  const classes = useStyles();

  const { isDarkTheme } = useContext(SettingsContext);

  const { addToast } = useToasts();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserAllowedConnection, setIsUserAllowedConnection] = useState(false);
  const [isNoWiFiError, setisNoWiFiError] = useState(false);
  const [isSelectLanguageDialogOpen, setIsSelectLanguageDialogOpen] = useState(
    false
  );
  const [isDisplayHelloWord, setIsDisplayHelloWord] = useState(true);
  const [helloWord, setHelloWord] = useState('Hello');

  const [
    pendingConnectionDevice,
    setPendingConnectionDevice,
  ] = useState<Device | null>(null);

  useEffect(() => {
    const ipInterval = setInterval(async () => {
      const gotIP = await ipcRenderer.invoke('get-local-lan-ip');
      if (gotIP === undefined) {
        setisNoWiFiError(true);
      } else {
        setisNoWiFiError(false);
      }
    }, 1000);

    return () => {
      clearInterval(ipInterval);
    };
  }, []);

  useEffect(() => {
    sharingSessionService
      .createWaitingForConnectionSharingSession()
      // eslint-disable-next-line promise/always-return
      .then((waitingForConnectionSharingSession) => {
        waitingForConnectionSharingSession.setOnDeviceConnectedCallback(
          (device: Device) => {
            connectedDevicesService.setPendingConnectionDevice(device);
          }
        );
      })
      .catch((e) => log.error(e));

    connectedDevicesService.addPendingConnectedDeviceListener(
      (device: Device) => {
        setPendingConnectionDevice(device);
        setIsAlertOpen(true);
      }
    );
  }, []);

  useEffect(() => {
    const isFirstTimeStart = !settings.hasSync('isNotFirstTimeAppStart');
    setIsSelectLanguageDialogOpen(isFirstTimeStart);

    if (!isFirstTimeStart) return () => {};

    const helloWords = getShuffledArrayOfHello();

    let pos = 0;
    const helloInterval = setInterval(() => {
      setIsDisplayHelloWord(false);
      if (pos + 1 === helloWords.length) {
        pos = 0;
      } else {
        pos += 1;
      }
      setHelloWord(helloWords[pos]);
      setIsDisplayHelloWord(true);
    }, 4000);

    return () => {
      clearInterval(helloInterval);
    };
  }, []);

  const [activeStep, setActiveStep] = useState(0);
  const [isEntireScreenSelected, setIsEntireScreenSelected] = useState(false);
  const [
    isApplicationWindowSelected,
    setIsApplicationWindowSelected,
  ] = useState(false);
  const steps = getSteps(t);

  const handleNext = useCallback(() => {
    if (activeStep === steps.length - 1) {
      setIsEntireScreenSelected(false);
      setIsApplicationWindowSelected(false);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  }, [activeStep, steps]);

  const handleNextEntireScreen = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setIsEntireScreenSelected(true);
  }, []);

  const handleNextApplicationWindow = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setIsApplicationWindowSelected(true);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  const handleReset = useCallback(() => {
    setActiveStep(0);
    setPendingConnectionDevice(null);
    setIsUserAllowedConnection(false);

    sharingSessionService
      .createWaitingForConnectionSharingSession()
      // eslint-disable-next-line promise/always-return
      .then((waitingForConnectionSharingSession) => {
        waitingForConnectionSharingSession.setOnDeviceConnectedCallback(
          (device: Device) => {
            connectedDevicesService.setPendingConnectionDevice(device);
          }
        );
      })
      .catch((e) => log.error(e));
  }, []);

  const handleResetWithSharingSessionRestart = useCallback(() => {
    setActiveStep(0);
    setPendingConnectionDevice(null);
    setIsUserAllowedConnection(false);

    const sharingSession =
      sharingSessionService.waitingForConnectionSharingSession;
    sharingSession?.disconnectByHostMachineUser();
    sharingSession?.destroy();
    sharingSessionService.sharingSessions.delete(sharingSession?.id as string);
    sharingSessionService.waitingForConnectionSharingSession = null;

    sharingSessionService
      .createWaitingForConnectionSharingSession()
      // eslint-disable-next-line promise/always-return
      .then((waitingForConnectionSharingSession) => {
        waitingForConnectionSharingSession.setOnDeviceConnectedCallback(
          (device: Device) => {
            connectedDevicesService.setPendingConnectionDevice(device);
          }
        );
      })
      .catch((e) => log.error(e));
  }, []);

  React.useImperativeHandle(ref, () => ({
    handleReset() {
      handleResetWithSharingSessionRestart();
    },
  }));

  const handleCancelAlert = async () => {
    setIsAlertOpen(false);

    if (sharingSessionService.waitingForConnectionSharingSession !== null) {
      const sharingSession =
        sharingSessionService.waitingForConnectionSharingSession;
      sharingSession.denyConnectionForPartner();
      sharingSession.destroy();
      sharingSession.setStatus(SharingSessionStatusEnum.NOT_CONNECTED);
      sharingSessionService.sharingSessions.delete(sharingSession.id);

      const prevRoomID =
        sharingSessionService.waitingForConnectionSharingSession.roomID;

      sharingSessionService.waitingForConnectionSharingSession = null;
      sharingSessionService
        .createWaitingForConnectionSharingSession(prevRoomID)
        // eslint-disable-next-line promise/always-return
        .then((waitingForConnectionSharingSession) => {
          waitingForConnectionSharingSession.setOnDeviceConnectedCallback(
            (device: Device) => {
              connectedDevicesService.setPendingConnectionDevice(device);
            }
          );
        })
        .catch((e) => log.error(e));
    }
  };

  const handleConfirmAlert = useCallback(async () => {
    setIsAlertOpen(false);
    setIsUserAllowedConnection(true);
    handleNext();

    if (sharingSessionService.waitingForConnectionSharingSession !== null) {
      const sharingSession =
        sharingSessionService.waitingForConnectionSharingSession;
      sharingSession.setStatus(SharingSessionStatusEnum.CONNECTED);
    }
  }, [handleNext]);

  const handleUserClickedDeviceDisconnectButton = useCallback(async () => {
    handleResetWithSharingSessionRestart();

    addToast(
      <Text>
        {t(
          'Device is successfully disconnected by you You can connect a new device'
        )}
      </Text>,
      {
        appearance: 'info',
        autoDismiss: true,
        // @ts-ignore: works fine here
        isdarktheme: `${isDarkTheme}`,
      }
    );
  }, [addToast, handleResetWithSharingSessionRestart, isDarkTheme, t]);

  const renderIntermediateOrSuccessStepContent = useCallback(() => {
    return activeStep === steps.length ? (
      <div style={{ width: '100%' }}>
        <Row middle="xs" center="xs">
          <SuccessStep handleReset={handleReset} />
        </Row>
      </div>
    ) : (
      <div id="intermediate-step-container" style={{ width: '100%' }}>
        <IntermediateStep
          activeStep={activeStep}
          steps={steps}
          handleNext={handleNext}
          handleBack={handleBack}
          handleNextEntireScreen={handleNextEntireScreen}
          handleNextApplicationWindow={handleNextApplicationWindow}
          resetPendingConnectionDevice={
            () => setPendingConnectionDevice(null)
            // eslint-disable-next-line react/jsx-curly-newline
          }
          resetUserAllowedConnection={() => setIsUserAllowedConnection(false)}
        />
      </div>
    );
  }, [
    activeStep,
    steps,
    handleReset,
    handleNext,
    handleBack,
    handleNextEntireScreen,
    handleNextApplicationWindow,
  ]);

  const renderStepLabelContent = useCallback(
    (label, idx) => {
      return (
        <StepLabel
          id="step-label-deskreen"
          className={classes.stepLabelContent}
          StepIconComponent={ColorlibStepIcon}
          StepIconProps={
            {
              isEntireScreenSelected,
              isApplicationWindowSelected,
            } as StepIconPropsDeskreen
          }
        >
          {pendingConnectionDevice && idx === 0 && isUserAllowedConnection ? (
            <DeviceConnectedInfoButton
              device={pendingConnectionDevice}
              onDisconnect={handleUserClickedDeviceDisconnectButton}
            />
          ) : (
            <Text className="bp3-text-muted">{label}</Text>
          )}
        </StepLabel>
      );
    },
    [
      classes.stepLabelContent,
      handleUserClickedDeviceDisconnectButton,
      isApplicationWindowSelected,
      isEntireScreenSelected,
      isUserAllowedConnection,
      pendingConnectionDevice,
    ]
  );

  return (
    <>
      <Row style={{ width: '100%' }}>
        <Col xs={12}>
          <Stepper
            className={classes.stepperComponent}
            activeStep={activeStep}
            alternativeLabel
            style={{ background: 'transparent' }}
            connector={<ColorlibConnector />}
          >
            {steps.map((label, idx) => (
              <Step key={label}>{renderStepLabelContent(label, idx)}</Step>
            ))}
          </Stepper>
        </Col>
        <Col className={classes.stepContent} xs={12}>
          {renderIntermediateOrSuccessStepContent()}
        </Col>
      </Row>
      <AllowConnectionForDeviceAlert
        device={pendingConnectionDevice}
        isOpen={isAlertOpen}
        onCancel={handleCancelAlert}
        onConfirm={handleConfirmAlert}
      />
      <Dialog isOpen={isNoWiFiError} autoFocus usePortal>
        <Grid>
          <div style={{ padding: '10px' }}>
            <Row center="xs" style={{ marginTop: '10px' }}>
              <Icon icon="offline" iconSize={50} color="#8A9BA8" />
            </Row>
            <Row center="xs" style={{ marginTop: '10px' }}>
              <H3>No WiFi and LAN connection.</H3>
            </Row>
            <Row center="xs">
              <H5>Deskreen works only with WiFi and LAN networks.</H5>
            </Row>
            <Row center="xs">
              <Spinner size={50} />
            </Row>
            <Row center="xs" style={{ marginTop: '10px' }}>
              <H4>Waiting for connection.</H4>
            </Row>
          </div>
        </Grid>
      </Dialog>
      <Dialog isOpen={isSelectLanguageDialogOpen} autoFocus usePortal>
        <Grid>
          <div style={{ padding: '10px' }}>
            <Row center="xs" style={{ marginTop: '10px' }}>
              <Fade collapse opposite when={isDisplayHelloWord} duration={700}>
                <H1>{helloWord}</H1>
              </Fade>
            </Row>
            <Row>
              <Col xs>
                <Row center="xs" style={{ marginTop: '20px' }}>
                  <Icon icon="translate" iconSize={50} color="#8A9BA8" />
                </Row>
                <Row center="xs" style={{ marginTop: '20px' }}>
                  <H5>{t('Language')}</H5>
                </Row>
                <Row center="xs" style={{ marginTop: '10px' }}>
                  <LanguageSelector />
                </Row>
              </Col>
              <Col xs>
                <Row center="xs" style={{ marginTop: '20px' }}>
                  <Icon icon="style" iconSize={50} color="#8A9BA8" />
                </Row>
                <Row center="xs" style={{ marginTop: '20px' }}>
                  <H5>{t('Color Theme')}</H5>
                </Row>
                <Row center="xs" style={{ marginTop: '10px' }}>
                  <ToggleThemeBtnGroup />
                </Row>
              </Col>
            </Row>
            <Row center="xs" style={{ marginTop: '20px' }}>
              <Button
                minimal
                rightIcon="chevron-right"
                onClick={() => {
                  setIsSelectLanguageDialogOpen(false);
                  settings.setSync('isNotFirstTimeAppStart', true);
                }}
                style={{ borderRadius: '50px' }}
              >
                {t('Continue')}
              </Button>
            </Row>
          </div>
        </Grid>
      </Dialog>
    </>
  );
});

export default DeskreenStepper;
