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
                    url: new URL(
                      `/products/${product.info.slug}`,
                      store.url
                    ).toString(),
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
};
