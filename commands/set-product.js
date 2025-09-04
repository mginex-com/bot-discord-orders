const { ApplicationCommandType, ApplicationCommandOptionType, ComponentType, TextInputStyle } = require("discord.js");
const { api } = require("../@shared");

module.exports = {
    options: {
        name: "setar-produto",
        type: ApplicationCommandType.ChatInput,
        description: "Setar o produto do servidor.",
        options: [
            {
                name: "id-produto",
                description: "Selecione o ID do produto",
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true,
            },
        ],
    },
    async execute(interaction) {
        const productId = interaction.options.getString("id-produto");

        api.get(`/open-api/catalog/product/${productId}`).then((response) => {
            const product = response.data;

            interaction.showModal({
                customId: `set-product:${productId}`,
                title: "Setar Produto",
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "title",
                                label: "Título",
                                type: ComponentType.TextInput,
                                style: TextInputStyle.Short,
                                value: product.info.title.slice(0, 100),
                            },
                        ],
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "description",
                                label: "Descrição",
                                type: ComponentType.TextInput,
                                style: TextInputStyle.Paragraph,
                                value: product.info.description.slice(0, 1000),
                                required: false,
                            },
                        ],
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "image",
                                label: "Imagem",
                                type: ComponentType.TextInput,
                                style: TextInputStyle.Short,
                                value: product.info.mainImage,
                                required: false,
                            },
                        ],
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "footer",
                                label: "Rodapé",
                                type: ComponentType.TextInput,
                                style: TextInputStyle.Short,
                                required: false,
                            },
                        ],
                    },
                ],
            });
        });
    },
};
