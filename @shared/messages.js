const { ComponentType, ButtonStyle } = require("discord-api-types/v10");
const { api, getStore, db, formatPrice } = require(".");

module.exports = {
    ProductMessage: async (productId) => {
        const productRaw = db.get(`product:${productId}`);

        const req = await api.get(`/open-api/catalog/product/${productRaw.id}`);
        const product = req.data;

        const store = getStore();

        return {
            embeds: [
                {
                    title: productRaw.title,
                    description: productRaw.description,
                    image: productRaw.image ? { url: productRaw.image } : null,
                    footer: productRaw.footer ? { text: productRaw.footer } : null,
                },
            ],
            components:
                product.type === "DEFAULT"
                    ? [
                          {
                              type: ComponentType.ActionRow,
                              components: [
                                  {
                                      custom_id: `buy-product:${productRaw.id}`,
                                      label: "Comprar Produto",
                                      style: 5,
                                      type: ComponentType.Button,
                                      style: ButtonStyle.Success,
                                      disabled: !product.inventory.hasStock,
                                  },
                                  {
                                      style: ButtonStyle.Link,
                                      type: ComponentType.Button,
                                      label: "Ver no site",
                                      url: new URL(`/products/${product.info.slug}`, store.url).toString(),
                                  },
                              ],
                          },
                      ]
                    : [
                          {
                              type: ComponentType.ActionRow,
                              components: [
                                  {
                                      custom_id: `buy-product:${productRaw.id}`,
                                      type: ComponentType.StringSelect,
                                      placeholder: "Selecione uma variação",
                                      options: product.variants.map((variant) => ({
                                          label: variant.title.slice(0, 25),
                                          description: `${formatPrice(variant.price)} | ${
                                              variant.inventory.stock === null
                                                  ? "∞"
                                                  : variant.inventory.stock > 0
                                                  ? `${variant.inventory.stock} em estoque`
                                                  : "Esgotado"
                                          }`,
                                          value: variant.id,
                                          emoji: "📦",
                                      })),
                                  },
                              ],
                          },
                      ],
        };
    },
    CheckoutPanel: async ({ interaction, checkoutId, product = null }) => {
        const checkout = db.get(`checkout:${checkoutId}`);

        if (!product) {
            const req = await api.get("/open-api/catalog/product/" + checkout.productId);
            if (req.data) product = req.data;
        }

        const inventory =
            product.type === "VARIANT" ? product.variants.find((v) => v.id === checkout.variantId).inventory : product.inventory;

        checkout.total = checkout.quantity * checkout.unitPrice;
        if (checkout.coupon) {
            if (checkout.coupon.type === "PERCENTAGE") {
                checkout.total = checkout.total - checkout.total * (checkout.coupon.amount / 100);
            } else if (checkout.coupon.type === "FIXED") {
                checkout.total = checkout.total - checkout.coupon.amount;
            }
        }
        db.set(`checkout:${checkoutId}`, checkout);

        return {
            embeds: [
                {
                    title: "🛒・Carrinho de compras",
                    description: `Olá ${interaction.user}, este é o seu carrinho de compras, para finalizar o pedido, utilize o botão abaixo para iniciar o processo de checkout.`,
                },
                {
                    title: `📦 | ${product.info.title}`,
                    image: product.info.mainImage ? { url: product.info.mainImage } : undefined,
                    fields: [
                        {
                            name: "Preço:",
                            value: `\`\`\`${formatPrice(checkout.total)}\`\`\``,
                        },
                        {
                            name: "Quantidade:",
                            value: `\`\`\`${checkout.quantity}\`\`\``,
                        },
                        checkout.coupon
                            ? {
                                  name: "Cupom aplicado:",
                                  value: `\`\`\`${checkout.coupon.code} - ${
                                      checkout.coupon.type === "PERCENTAGE"
                                          ? `${checkout.coupon.amount}% de desconto`
                                          : `${formatPrice(checkout.coupon.amount)} de desconto`
                                  } \`\`\``,
                              }
                            : null,
                    ].filter(Boolean),
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            custom_id: "continue-checkout",
                            type: ComponentType.Button,
                            label: "Continuar",
                            style: ButtonStyle.Success,
                        },
                        {
                            custom_id: "remove-quantity",
                            type: ComponentType.Button,
                            label: "-",
                            style: ButtonStyle.Secondary,
                            disabled: checkout.quantity <= 1,
                        },
                        {
                            custom_id: "add-quantity",
                            type: ComponentType.Button,
                            label: "+",
                            style: ButtonStyle.Secondary,
                            disabled: inventory.stock !== null ? checkout.quantity >= inventory.stock : checkout.quantity >= 1000,
                        },
                        {
                            custom_id: "add-coupon",
                            type: ComponentType.Button,
                            label: "Adicionar cupom",
                            style: ButtonStyle.Primary,
                            disabled: !!checkout.coupon,
                        },
                        {
                            custom_id: "cancel-checkout",
                            type: ComponentType.Button,
                            label: "Cancelar compra",
                            style: ButtonStyle.Danger,
                        },
                    ],
                },
            ],
        };
    },
};
