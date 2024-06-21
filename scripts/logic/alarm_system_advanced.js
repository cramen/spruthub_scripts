info = {
    name: "Сигнализация (anvanced)",
    description: "",
    version: "0.4",
    author: "@cramen",
    onStart: true,

    sourceServices: [HS.SecuritySystem],
    sourceCharacteristics: [HC.SecuritySystemTargetState],

    variables: {
        active: false,
        motion: undefined,
        occupancy: undefined,
        alertTimeout: []
    },

    options: {
        alarmDelay: {
            name: {
                en: "Alarm delay",
                ru: "Задержка тревоги"
            },
            type: "Integer",
            value: 30000
        }
    }
}

function alarm_log(message) {
    log.info("Сигнализация: " + message);
}

function alarm(source, value, securitySystemCurrentState, variables, options) {
    alarm_log("вызов alarm (value=" + value + ")");
    if (value * 1 > 0) {
        alarm_log("установка задержки алерта на " + options.alarmDelay + "ms");
        variables.alertTimeout.push(setTimeout(
            function() {
                log.warn("Security system, alarm: {}", source.format());
                log.message("!!!ПРОНИКНОВЕНИЕ!!!\nСработал датчик: " + source.format());
                alarm_log("включение тревоги");
                securitySystemCurrentState.setValue(4);
                if (global.sendToTelegram !== undefined) {
                    global.sendToTelegram(["*!!!ПРОНИКНОВЕНИЕ!!!*", "Сработал датчик: " + source.format()]);
                }
            }, 
            options.alarmDelay
        ));
    }
}

function trigger(source, value, variables, options) {
    alarm_log("сработал триггер");
    let securitySystemCurrentState = source.getService().getCharacteristic(HC.SecuritySystemCurrentState);
    securitySystemCurrentState.setValue(value);

    if (value === 0) {
        alarm_log("режим 'дома'");
        variables.alertTimeout.forEach(function(timeout) {
            alarm_log("сброс таймаута тревоги");
            timeout.clear();
        });
        variables.alertTimeout = [];
    }

    if (value === 1 && !variables.active) {
        alarm_log("режим 'не дома'");
        alarm_log("подписка на срабатывание датчиков движения");
        variables.active = true;
        variables.motion = Hub.subscribeWithCondition(null, null, [HS.MotionSensor], [HC.MotionDetected], alarm, securitySystemCurrentState, variables, options);
        variables.occupancy = Hub.subscribeWithCondition(null, null, [HS.OccupancySensor], [HC.OccupancyDetected], alarm, securitySystemCurrentState, variables, options);
    } else if (variables.active) {
        alarm_log("сброс подписки на срабатывание датчиков движения");
        variables.active = false;
        variables.motion.clear();
        variables.occupancy.clear();
    }
}
