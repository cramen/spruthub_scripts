info = {
    name: "Сигнализация (anvanced)",
    description: "",
    version: "0.5",
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
        let timeoutId = setTimeout(
            function() {
                log.warn("Security system, alarm: {}", source.format());
                log.message("!!!ПРОНИКНОВЕНИЕ!!!\nСработал датчик: " + source.format());
                alarm_log("включение тревоги");
                securitySystemCurrentState.setValue(4);
                if (global.sendToTelegram !== undefined) {
                    global.sendToTelegram(["*!!!ПРОНИКНОВЕНИЕ!!!*", "Сработал датчик: " + source.format()]);
                }
                // Удаляем выполненный таймаут из массива
                variables.alertTimeout = variables.alertTimeout.filter(id => id !== timeoutId);
            },
            options.alarmDelay
        );
        variables.alertTimeout.push(timeoutId);
    }
}

function trigger(source, value, variables, options) {
    alarm_log("сработал триггер, value=" + value);
    let securitySystemCurrentState = source.getService().getCharacteristic(HC.SecuritySystemCurrentState);
    securitySystemCurrentState.setValue(value);

    if (value === 0) {
        alarm_log("режим 'дома'");
        // Сброс всех активных таймаутов
        variables.alertTimeout.forEach(function(timeoutId) {
            alarm_log("сброс таймаута тревоги ID: " + timeoutId);
            clearTimeout(timeoutId); // ИСПРАВЛЕНО: используем clearTimeout вместо timeout.clear()
        });
        variables.alertTimeout = [];

        // Сброс подписок если они активны
        if (variables.active) {
            alarm_log("сброс подписки на срабатывание датчиков движения");
            variables.active = false;
            if (variables.motion) variables.motion.clear();
            if (variables.occupancy) variables.occupancy.clear();
        }
    }

    if (value === 1 && !variables.active) {
        alarm_log("режим 'не дома'");
        alarm_log("подписка на срабатывание датчиков движения");
        variables.active = true;
        variables.motion = Hub.subscribeWithCondition(null, null, [HS.MotionSensor], [HC.MotionDetected], alarm, securitySystemCurrentState, variables, options);
        variables.occupancy = Hub.subscribeWithCondition(null, null, [HS.OccupancySensor], [HC.OccupancyDetected], alarm, securitySystemCurrentState, variables, options);
    }
}
