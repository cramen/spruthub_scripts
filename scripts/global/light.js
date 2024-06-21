LIGHTS_WITH_NIGHT_MODE = [
    ];
LIGHTS_WITHOUT_NIGHT_MODE = [
    ];

NIGHT_MODE_SWITCH_ACCESSORY_ID = XXXX;

//Установка яркости/ночника в зависимости от того, включен-ли ночной режим
//options: HasNightMode(Boolean), NightModeBrightness(Integer)
function lightUpdateNightMode(accessory, options) {
    let service = accessory.getService(HS.Lightbulb);
    log.info(service);
    if (!service.isVisible()) return;
    let isDeviceOnCharacteristic = service.getCharacteristic(HC.On);
    let isDeviceOn = isDeviceOnCharacteristic.getValue();
    let nightModeOn = Hub
        .getAccessory(NIGHT_MODE_SWITCH_ACCESSORY_ID)
        .getService(HS.Switch)
        .getCharacteristic(HC.On)
        .getValue();
    
    if (!isDeviceOn) return;

    if (options.HasNightMode) {
        accessory.getService(HS.Switch).getCharacteristic(HC.On).setValue(nightModeOn);
    } else {
        let brightness = service.getCharacteristic(HC.Brightness);
        if (brightness == null) {
            log.info("Лампочка {}, не умеет изменять яркость", accessory)
            return;
        }        
        brightness.setValue(nightModeOn ? options.NightModeBrightness : 100);
    }
}

//Установка яркости/ночника для всех светильников в зависимости от того, включен-ли ночной режим
function lightAllUpdateNightMode() {
    LIGHTS_WITH_NIGHT_MODE.forEach(function (accessoryId) {
        setTimeout(function() {
            lightUpdateNightMode(Hub.getAccessory(accessoryId), {HasNightMode: true});
        }, 0);
    });
    LIGHTS_WITHOUT_NIGHT_MODE.forEach(function (accessoryId) {
        setTimeout(function() {
            lightUpdateNightMode(Hub.getAccessory(accessoryId), {HasNightMode: false, NightModeBrightness: 1});
        }, 0);
    });
}

//включение/выключение всего света
function lightAllSetState(isOn, excludeAccessoryIds) {
    if (excludeAccessoryIds === undefined) {
        excludeAccessoryIds = [];
    }
    let accessoryKeys = {};
    excludeAccessoryIds.forEach(function(aid) {
        accessoryKeys[Hub.getAccessory(aid)] = true;
    });

    Hub.getAccessories().forEach(function(accessory) {
        if (accessoryKeys[accessory]) return;
        if (accessory.getRoom().getName().indexOf("src") !== -1) return;
        accessory.getServices(true, HS.Lightbulb).forEach(function(service) {
            if (!service.isVisible()) return;
            setTimeout(function() {
                service.getCharacteristic(HC.On).setValue(isOn);
            }, 0);
        });
    });
}
