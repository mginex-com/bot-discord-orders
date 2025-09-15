const { AttachmentBuilder } = require("discord.js");
const { db } = require("../@shared");

function isBase64(str) {
    try {
        return Buffer.from(str, "base64").toString("base64") === str.replace(/\s/g, "");
    } catch (e) {
        return false;
    }
}

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
            const qrCode = checkout.order.payment.qrCode;

            let attachment = null;
            let imageUrl = qrCode;

            if (qrCode.startsWith("data:image")) {
                const base64Data = qrCode.split(",")[1];
                attachment = new AttachmentBuilder(Buffer.from(base64Data, "base64"), {
                    name: "qrcode.png",
                });
                imageUrl = "attachment://qrcode.png";
            } else if (isBase64(qrCode)) {
                attachment = new AttachmentBuilder(Buffer.from(qrCode, "base64"), {
                    name: "qrcode.png",
                });
                imageUrl = "attachment://qrcode.png";
            } else if (!qrCode.startsWith("http")) {
                imageUrl = null;
            }

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
                        ...(imageUrl
                            ? {
                                  image: { url: imageUrl },
                              }
                            : {}),
                    },
                ],
                files: [attachment],
                ephemeral: true,
            });
        }
    },
};
