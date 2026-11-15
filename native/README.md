# iOS preparation (not a shipped native application)

Shared code: React views, domain.ts, WorkoutEngine, TelemetryProcessor, StandardAdapter parsers, statistics, storage and exports. Current browser-specific boundary is BluetoothManager; replace it with a manager implementing the same public view model and feed `onData` into TelemetryProcessor. The `NativeTransportContract` in domain.ts declares the minimum async read/write/subscribe interface. ResistanceController should be refactored to accept that transport's characteristic writer + FTMS indication stream, preserving its acknowledgment queue and generation cancellation.

Recommended native bridge: @capacitor-community/bluetooth-le (BLE central, iOS CoreBluetooth); review the maintained package version and Capacitor major together when installing. Do not execute CoreBluetooth in Safari JavaScript.

On macOS with Xcode, add @capacitor/core and @capacitor/ios, @capacitor/cli, and @capacitor-community/bluetooth-le; initialize, copy the example config to project root, run the web build, add ios, sync ios, and open Xcode. Set NSBluetoothAlwaysUsageDescription to an explanation in Spanish, choose signing team, connect a real iPhone/iPad, build and verify. No paid cloud build service is necessary if a Mac is available. BLE needs a real device. Windows alone cannot perform this native iOS toolchain.

An Apple Personal Team allows free personal device testing with restrictions and seven-day provisioning expiry. Stable App Store/TestFlight distribution normally requires Apple Developer membership. No account purchase, app installation or signing was performed here.

A native bridge provides radio access; it does not reveal or solve an unknown Smart Air proprietary protocol. Obtain the web diagnosis first, then a native GATT inventory if the Web Bluetooth allowlist prevents discovery. Do not copy BKOOL Bike/Pro proprietary UUIDs to Smart Air without exact-model evidence.

References: https://capacitorjs.com/docs/ios ; https://github.com/capacitor-community/bluetooth-le ; https://developer.apple.com/help/account/basics/about-your-developer-account
