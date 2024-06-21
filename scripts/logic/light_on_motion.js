function getAccessoriesForVL(serviceType)
 {

    var res = [{name: {ru: "---", en: "---"}, value: 0}];

    Hub.getAccessories().forEach(function(accessory) {
        // var accessoryName = accessory.getName();

        // log.info("accId: " + accessory.getUUID());
        var roomName = accessory.getRoom().getName();
        if (roomName.indexOf("src") !== -1) return;
        accessory.getServices(true, serviceType).forEach(function(service) {
            var serviceName = service.getName();
            var serviceFullName = roomName + " - " + serviceName;
            var item = {
                    name: { ru: serviceFullName, en: serviceFullName },
                    value: accessory.getUUID(),
                };
            // log.info(JSON.stringify(item));
            res.push(item);
        });
    });

    res.sort(function(a, b) {
        if (a.name.ru < b.name.ru) return -1;
        if (a.name.ru > b.name.ru) return 1;
        return 0;
    });
    // log.info(JSON.stringify(res));
    return res;
}

info = {
    name: "Включать освещение при движении",
    description: "",
    version: "0.3",
    author: "@cramen",
    onStart: false,

    sourceServices: [HS.MotionSensor],
    sourceCharacteristics: [HC.MotionDetected],

    variables: {
        turnOffTimeout: undefined
    },

    options: {
        lightAccessoryId: {
            name: {
                en: "Light to on",
                ru: "Светильник, которй включать"
            },
            type: "Integer",
            value: 0,
            fromType: "list",
            values: getAccessoriesForVL(HS.Lightbulb)
        },
        turnOffDelay: {
            name: {
                en: "Turn off delay (s)",
                ru: "Задержка выключения (s)"
            },
            type: "Integer",
            value: 60
        },
        conditionModeAccessoryId: {
            name: {
                en: "Condition switch",
                ru: "Выключатель-условие (можно оставить пустым)"
            },
            type: "Integer",
            value: 0,
            fromType: "list",
            values: getAccessoriesForVL(HS.Switch)
        }
    }
} 
 
function trigger(source, value, variables, options) {
    if (options.lightAccessoryId == 0 || options.lightAccessoryId == undefined) {
        log.info("no lightAccessoryId")
        return;
    }
    var hasConditionMode = true;
    if (options.conditionModeAccessoryId == 0 || options.conditionModeAccessoryId == undefined ) {
        hasConditionMode = false;
    }

    var lightAccessory = Hub.getAccessory(options.lightAccessoryId);
    var conditionModeAccessory = undefined;
    if (hasConditionMode) {
        conditionModeAccessory = Hub.getAccessory(options.conditionModeAccessoryId);
    }

    var lightService = lightAccessory.getServices(true, HS.Lightbulb)[0];
    var conditionModeService = undefined;
    if (hasConditionMode) {
        conditionModeService = conditionModeAccessory.getServices(true, HS.Switch)[0];
    }

    var lightOnCharacteristic = lightService.getCharacteristic(HC.On);

    var lightIsOn = lightService.getCharacteristic(HC.On).getValue();
    var conditionMode = undefined;
    if (hasConditionMode) {
        conditionMode = conditionModeService.getCharacteristic(HC.On).getValue();
    }

    var ligheName = "MotionLight: " + lightAccessory.getRoom().getName() + "/" + lightAccessory.getName() + "/" + lightService.getName()

    if (hasConditionMode && !conditionMode) {
        log.info(ligheName + " condition is false ant condition mode is on. exit.")
        return;
    }

    if (value) {
        if (variables.turnOffTimeout != undefined) {
            log.info(ligheName + " reset timeout")
            variables.turnOffTimeout.clear();
            variables.turnOffTimeout = undefined;
        }
        if (lightIsOn) {
            log.info(ligheName + " light is already on. exit.")
            return;
        }
        log.info(ligheName + " turn on light")
        lightOnCharacteristic.setValue(true);
    } else {
        log.info(ligheName + " set new timeout")
        variables.turnOffTimeout = setTimeout(
            function() {
                log.info(ligheName + " turn off light by timeout")
                variables.turnOffTimeout = undefined;
                if (!lightOnCharacteristic.getValue()) {
                    log.info(ligheName + " light is already off. exit.")
                    return
                }
                lightOnCharacteristic.setValue(false);
            },
            options.turnOffDelay * 1000
        )
    }
}
