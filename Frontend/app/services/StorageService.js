// services/NetworkService.js
import NetInfo from "@react-native-community/netinfo";

class NetworkService {
  static async isConnected() {
    const networkState = await NetInfo.fetch();
    return networkState.isConnected;
  }

  static addNetworkListener(callback) {
    return NetInfo.addEventListener(callback);
  }
}

export default NetworkService;
