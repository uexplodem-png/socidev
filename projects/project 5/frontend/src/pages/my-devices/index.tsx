import { DeviceControlCenter } from '../../components/device/DeviceControlCenter';
import { DeviceTaskList } from '../../components/device/DeviceTaskList';

export const MyDevicesPage = () => {
  // Calculate statistics for DeviceControlCenter
  const onlineDevices = 8;
  const busyDevices = 3;
  const offlineDevices = 2;
  const averageCpu = 45;
  const averageMemory = 60;
  const averageNetwork = 25;

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Devices</h1>
        <p className="mt-2 text-gray-600">Manage and monitor your connected devices</p>
      </div>

      {/* Device Control Center */}
      <div className="mb-8">
        <DeviceControlCenter
          onlineDevices={onlineDevices}
          busyDevices={busyDevices}
          offlineDevices={offlineDevices}
          averageCpu={averageCpu}
          averageMemory={averageMemory}
          averageNetwork={averageNetwork}
          onBulkStart={() => { }}
          onBulkStop={() => { }}
          onBulkRestart={() => { }}
        />
      </div>

      {/* Automated Tasks */}
      <div className="mb-8">
        <DeviceTaskList deviceId="DEV-001" />
      </div>
    </div>
  );
};