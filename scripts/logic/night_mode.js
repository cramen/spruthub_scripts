info = {
    name: "Приглушение света в ночном режиме",
    description: "",
    version: "0.2",
    author: "@cramen",
    onStart: true,

    sourceServices: [HS.Lightbulb],
    sourceCharacteristics: [HC.On],

    options: {
        HasNightMode: {
            name: {
                en: "Switch to night mode",
                ru: "Переключать в режим ночника"
            },
            type: "Boolean",
            value: true
        },
        NightModeBrightness: {
            name: {
                en: "NightMode brightness",
                ru: "Яркость в ночном режиме"
            },
            type: "Integer",
            value: 1
        }
    }
}

function trigger(source, value, variables, options) {
    if (value) {
        let service = source.getService();
        let accessory = service.getAccessory();

        global.lightUpdateNightMode(accessory, options);
    }
}
