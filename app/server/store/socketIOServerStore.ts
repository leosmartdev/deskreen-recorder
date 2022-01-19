import Io from 'socket.io';

class SocketIOServerStore {
  ioServer = ({} as unknown) as Io.Server;

  setServer(server: Io.Server) {
    this.ioServer = server;
  }

  getServer() {
    return this.ioServer;
  }
}

const store = new SocketIOServerStore();

export default store;
