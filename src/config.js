module.exports = {
	PORT: process.env.PORT || 8000,
	MONGO_URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/jsonbox-data-dev',
	PAGE_LIMIT: process.env.PAGE_LIMIT || 50,
	PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || "ASAtcAk_uMa4_IMJWDj9aCQy17wKtaJVu6km4-2GxPJJ_JHvHo8fZUEARi6840g-Yppag4TDAq6cTGlZ",
	PAYPAL_SECRET: process.env.PAYPAL_SECRET || "EP7sBrBwcP_vR2kigmiuALR_vWHeM4AZD1_RxU4bFYhIczrTs9LZfYn9sVBNwCIk_ffgo4Zc1KP890jp",
	PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || 'https://api.sandbox.paypal.com',
	GMAIL_PASSWORD: process.env.GMAIL_PASSWORD || "Poiu&890"

}
