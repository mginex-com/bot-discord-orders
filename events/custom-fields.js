module.exports = {
    type: "interactionCreate",
    execute: async (interaction) => {
        if ((!interaction.isStringSelectMenu() && !interaction.isButton()) || !interaction.customId.startsWith("buy-product:"))
            return;

        await api.get("/rest-api/v1/store/checkout/custom-field", {
            headers: {
                store_id: getStore().id,
                secret_key: "98470ad9-916f-4c6f-ad4c-333278507dd5",
            },
        }).then;

        const customFields = req.data.customFields;

        for (const customField of customFields) {
        }
    },
};
