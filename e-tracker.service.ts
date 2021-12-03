
declare const _etracker: any;
declare const et_UserDefinedEvent: (
	myObject: string, /* Source of etEvent, usually a page */
	myCategory: string
	myAction: string,
	myType: string) => void;

export type etCommerceEventType =
'order' |
'insertToBasket' |
'removeFromBasket' |
'viewProduct' |
'insertToWatchlist' |
'removeFromWatchlist' |
'removeFromBasket' |
'orderConfirmation' |
'orderPartialCancellation';

declare let etCommerce: {
	debugMode: boolean;
	sendEvent: (
		eCommerceEventType: etCommerceEventType,
		eCommerceObject: EtOrderObject | EtProductObject,
		quantity?: number
	) => void;
};

interface EtProductObject {
	id: string;
	name: string;
	category?: [string, string?, string?, string?];
	price: string;
	currency: 'EUR' | string;
	variants: {
		payment?: 'monthly' | 'yearly'
		[k: string]: string
	};
}

interface EtBasketObject {
	id: string;
	products: {
		product: EtProductObject;
		quantity: '1';
	}[];
}

interface EtOrderObject {
	orderNumber: string;
	status: 'lead' | 'sale' | 'cancellation' | 'partial_cancellation';
	orderPrice: string;
	currency: string;
	basket: EtBasketObject;
}
