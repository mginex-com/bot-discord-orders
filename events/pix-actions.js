const { AttachmentBuilder } = require("discord.js");
const { db } = require("../@shared");

module.exports = {
    type: "interactionCreate",
    execute: async (interaction) => {
        if (interaction.isButton() && interaction.customId === "pix-code") {
            const checkout = db.get(`checkout:${interaction.channel.id}`);

            interaction.reply({
                content: `Chave Pix gerada com sucesso:\n${checkout.order.payment.pixCode}`,
                ephemeral: true,
            });
        }

        if (interaction.isButton() && interaction.customId === "qr-code") {
            const checkout = db.get(`checkout:${interaction.channel.id}`);

            const attachment = new AttachmentBuilder(
                checkout.order.payment.qrCode.startsWith("data:image")
                    ? Buffer.from(checkout.order.payment.qrCode.split(",")[1], "base64")
                    : Buffer.from(checkout.order.qrCode, "base64"),
                { name: "qrcode.png" }
            );

            interaction.reply({
                embeds: [
                    {
                        title: `Seu código QR Code foi gerado com sucesso!`,
                        description:
                            "Agora para realizar o pagamento aponte a câmera do seu celular para o QR code, ou pague pela chave copia e cola.",
                        fields: [
                            {
                                name: `Chave Copia e Cola`,
                                value: `\`\`\`${checkout.order.payment.pixCode}\`\`\``,
                            },
                        ],
                        image: {
                            url: checkout.order.payment.qrCode.startsWith("https://")
                                ? checkout.order.payment.qrCode
                                : "attachment://qrcode.png",
                        },
                    },
                ],
                files: [attachment],
                ephemeral: true,
            });
        }
    },
};
