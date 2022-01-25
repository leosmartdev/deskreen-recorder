/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable react/destructuring-assignment */
// import { remote } from 'electron';
import React, { useCallback, useEffect } from 'react';
import { Button, H5, Icon, Text } from '@blueprintjs/core';
import { Row, Col } from 'react-flexbox-grid';
import { useTranslation } from 'react-i18next';

const { handleDataAvailable, handleStop } = require('./handlers');

const { invokeContextMenu } = require('./events/ipc');

// import SharingSessionService from '../../features/SharingSessionService';

// const sharingSessionService = remote.getGlobal(
//   'sharingSessionService'
// ) as SharingSessionService;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaRecorder?: any;
  }
}

interface SuccessStepProps {
  handleReset: () => void;
  screenCaptureId: string;
}

const SuccessStep: React.FC<SuccessStepProps> = (props: SuccessStepProps) => {
  const { t } = useTranslation();

  const [isRecordingReady, setIsRecordingReady] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isRecordingRestored, setIsRecordingRestored] = React.useState(false);

  const { screenCaptureId } = props;

  useEffect(() => {
    document
      .querySelector('#top-panel-connected-devices-list-button')
      ?.classList.remove('pulse-not-infinite');

    document
      .querySelector('#top-panel-connected-devices-list-button')
      ?.classList.add('pulse-not-infinite');

    setTimeout(() => {
      document
        .querySelector('#top-panel-connected-devices-list-button')
        ?.classList.remove('pulse-not-infinite');
    }, 4000);

    console.log('useEffect()');

    setTimeout(async () => {
      console.log(screenCaptureId);
      const videoElement = document.querySelector('video');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaDevices = navigator.mediaDevices as any;
      const videoStream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: screenCaptureId,
          },
        },
      });
      const audioStream = await mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      if (videoElement) {
        videoElement.srcObject = combinedStream;
        videoElement.play();
      }
      const options = { mimeType: 'video/webm; codecs=vp9' };
      window.mediaRecorder = new MediaRecorder(combinedStream, options);
      window.mediaRecorder.ondataavailable = handleDataAvailable;
      window.mediaRecorder.onstop = handleStop;
      setIsRecordingReady(true);
    }, 3000);
  }, [screenCaptureId]);

  const handleTextConnectedListMouseEnter = useCallback(() => {
    document
      .querySelector('#top-panel-connected-devices-list-button')
      ?.classList.add('pulsing');
  }, []);

  const handleTextConnectedListMouseLeave = useCallback(() => {
    document
      .querySelector('#top-panel-connected-devices-list-button')
      ?.classList.remove('pulsing');
  }, []);

  const handleRecordStart = (e: any) => {
    const { target } = e;

    setIsRecording(true);
    setIsRecordingRestored(false);

    window.mediaRecorder.start();

    target.classList.add('is-danger');

    target.textContent = 'Recording';
  };

  const handleRecordStop = () => {
    const startBtn = document.getElementById('startBtn');
    // const saveBtn = document.getElementById('saveBtn');
    // const { target } = e;

    window.mediaRecorder.stop();

    if (startBtn !== null) {
      startBtn?.classList.remove('is-danger');
      startBtn.textContent = 'Start';
    }

    // target?.setAttribute('disabled', 'disabled');

    // startBtn?.removeAttribute('disabled');
    // saveBtn?.removeAttribute('disabled');

    setIsRecording(false);
    setIsRecordingRestored(true);
  };

  const handleRecordSave = () => {
    invokeContextMenu(
      [
        { id: 'mp4', name: 'mp4' },
        { id: 'webm', name: 'webm' },
        { id: 'gif', name: 'gif' },
        { id: 'webp', name: 'webp' },
        { id: 'apng', name: 'apng' },
      ],
      'output'
    );
  };

  return (
    <Col
      xs={8}
      md={6}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Row center="xs">
        <Col xs={12}>
          <Icon icon="endorsed" iconSize={35} color="#0F9960" />
          <H5>{t('Done!')}</H5>
        </Col>
      </Row>
      <Row center="xs">
        <Col xs={10}>
          <div style={{ marginBottom: '10px' }}>
            <Text>{t('Now you can see your screen on other device')}</Text>
          </div>
          <div
            id="connected-devices-list-text-success"
            onMouseEnter={handleTextConnectedListMouseEnter}
            onMouseLeave={handleTextConnectedListMouseLeave}
            style={{
              marginBottom: '25px',
              textDecoration: 'underline dotted',
            }}
          >
            <Text className="">
              {t(
                'You can manage connected devices by clicking Connected Devices button in top panel'
              )}
            </Text>
          </div>
        </Col>
      </Row>
      <Button
        intent="primary"
        onClick={props.handleReset}
        icon="repeat"
        style={{ borderRadius: '100px' }}
      >
        {t('Connect New Device')}
      </Button>
      <Row center="xs">
        <Col xs={10}>
          <video width={320} height={200}>
            <track kind="captions" />
          </video>
        </Col>
        <Col xs={10}>
          <Button
            id="startBtn"
            onClick={handleRecordStart}
            disabled={!isRecordingReady || isRecording}
          >
            Start
          </Button>
          <Button
            id="stopBtn"
            disabled={!isRecordingReady || !isRecording}
            onClick={handleRecordStop}
          >
            Stop
          </Button>
          <Button
            id="saveBtn"
            disabled={!isRecordingReady || isRecording || !isRecordingRestored}
            onClick={handleRecordSave}
          >
            Save as
          </Button>
        </Col>
        <Col xs={10}>
          <progress
            id="saveProgressBar"
            max="100"
            // style={{ width: '100%', display: 'none' }}
          />
        </Col>
      </Row>
    </Col>
  );
};

export default SuccessStep;
