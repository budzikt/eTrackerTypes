import { Injectable } from '@angular/core';
import { APP_LOCATION, PROCESS_ENUM } from '../types/app.types';
import { PRODUCT_FETCH_TRIES } from '../modules/order/types/steps/stepOne.types';
import { environment } from '@env/environment';
import { EnvironmentType } from '@env/environment.types';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../types/Product.class';
import { SECTION_ENUM } from '../modules/order/types/order.types';

declare const _etracker: any;
declare const et_UserDefinedEvent: (
	myObject: string, /* Source of etEvent, usually a page */
	myCategory: 'BRILLANT' | 'BRILLANT_TEST',
	myAction: string,
	myType: string) => void;

export type etCommerceEventType =
'order' |
'insertToBasket' |
'removeFromBasket' |
'viewProduct' | 'insertToWatchlist' |
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



const category = environment.environmentType === 'prod' ? 'BRILLANT' : 'BRILLANT_TEST';

/* Represents source of trackable event, mainly view page context */
export enum ET_EVENT_SOURCE {
	START_PAGE = 'Start',
	LOGIN_PAGE = 'Kundenlogin',
	IMPRESSUM_PAGE = 'Impressum',
	ENERGY_EFFICIENCY_PAGE = 'Energieeffizienz',
	MARKET_COMMUNICATION_PAGE = 'Marktkommunikation',
	RATE_PAGE = 'Tarifauswahl',
	STEP_1_PAGE = 'Schritt_1',
	STEP_2_PAGE = 'Schritt_2',
	STEP_3_PAGE = 'Schritt_3',
	SUMMARY_PAGE = 'Bestellzusammenfassung',
	CONFIRMATION_PAGE_MISSING_DATA = 'Bestätigung ohne vollständige Daten',
	CONFIRMATION_PAGE_DATA_FULL = 'Bestätigung mit vollständigen Daten',
	REMINDER_PAGE = 'Nachreichen',
	HELP_AND_CONTACT = 'Hilfe und kontakt',
	PRIVACY_DOWNLOAD = 'Datenschutzinformation',
	TERMS_CONDITIONS_DOWNLOAD = 'AGB',
	DATA_PROTECTION = 'Datenschutzerklärung',
	CLP = 'CLP'
}

enum EVENT_TYPE {
	PAGE_NAVIGATION = 'Seitennavigation',
	RATE_SEARCH = 'Tarifsuche',
	ORDER_PLACEMENT = 'Bestellung aufgeben',
	DOCUMENT_DOWNLOAD = 'Dokumente herunterladen',
	FORM_ACTION = 'Formular ausfüllen',
	CREDIT_SCORE_EVENT = 'Bonitätsprüfung',
	CLP = 'CLP'
}

export enum ET_PAGE_NAVIGATION_SUBTYPE {
	VIEWED = 'Besucht',
	LEAVED = 'Verlassen',
	REDIRECTED = 'Umgeleitet'
}

export enum ET_RATE_SEARCH_SUBTYPE {
	RATE_SEARCH_BASIC_DATA = 'Tarifsuche mit Basisdaten',
	RATE_SEARCH_EXTENDED_DATA = 'Tarifsuche mit erweiterten Daten',
	RATE_SEARCH_FULL_DATA = 'Tarifsuche mit allen Daten',
	RATE_SEARCH_FAILED = 'Tarif ist nicht verfügbar',
}

export enum ET_ORDER_SUBTYPE {
	ORDER_MISSING_METER = 'Bestellung ohne Zaehlernummer',
	ORDER_MISSING_PREV_SUPPLIER = 'Bestellung ohne Lieferanten',
	ORDER_MISSING_BOTH = 'Bestellung ohne Zaehlernummer und Lieferanten',
	ORDER_COMPLETE = 'Bestellung mit komplettem Datensatz',
}

export enum ET_CREDIT_SCORE_EVENT {
	CREDIT_SCORE_PASS = 'Kreditwürdig',
	CREDIT_SCORE_FAIL = 'Nicht kreditwürdig',
	CREDIT_SCORE_ERROR = 'Fehler bei Bonitätsprüfung',
}

export enum ET_CLP_EVENT {
	MALO_CLP = 'Malo angegeben',
	DATA_CLP = 'Vertragsdaten angepasst',
}

export enum ET_CLP_EVENT_VALUE {
	CLP_SUCCESS = 'Erfolg',
	CLP_FAIL = 'Niederlage',
}

export enum ET_FORM {
	REMINDER_FORM = 'Nachreichen form'
}


@Injectable({
	providedIn: 'root'
})
export class ETrackerService {

	private envType: EnvironmentType;
	constructor() {
		try {
			this.envType = environment.environmentType;
		} catch (e) {
			/* Fallback */
			this.envType = 'local';
		}
	}

	private sendRealData(): boolean {
		return this.envType === 'prep' || this.envType === 'prod';
	}

	public etOnPageView(page: ET_EVENT_SOURCE) {
		this.sendPageInOut(page, ET_PAGE_NAVIGATION_SUBTYPE.VIEWED);
	}


	public etOnPageLeave(page: ET_EVENT_SOURCE) {
		this.sendPageInOut(page, ET_PAGE_NAVIGATION_SUBTYPE.LEAVED);
	}

	etOnPageReject(page: ET_EVENT_SOURCE) {
		this.sendPageInOut(page, ET_PAGE_NAVIGATION_SUBTYPE.REDIRECTED);
	}


	public etOnDownloadDocViaLink(appLocRef: APP_LOCATION) {
		const odcMap = [
			{ loc: APP_LOCATION.PRIVACY, evt_str: ET_EVENT_SOURCE.PRIVACY_DOWNLOAD },
			{ loc: APP_LOCATION.TERMS_AND_CONDITIONS, evt_str: ET_EVENT_SOURCE.TERMS_CONDITIONS_DOWNLOAD },
			{ loc: APP_LOCATION.DATA_PROTECTION, evt_str: ET_EVENT_SOURCE.TERMS_CONDITIONS_DOWNLOAD },
			{ loc: APP_LOCATION.ABG_AUTOAID, evt_str: ET_EVENT_SOURCE.TERMS_CONDITIONS_DOWNLOAD },
		].filter(el => el.loc === appLocRef);

		if (odcMap.length > 0) {
			this.sendDocDownload(odcMap[0].evt_str);
		}
	}

	public etOnRateSearch(searchLevel: PRODUCT_FETCH_TRIES) {
		const src = [
			{ fetchLevel: PRODUCT_FETCH_TRIES.MINIMAL_DATA, search: ET_RATE_SEARCH_SUBTYPE.RATE_SEARCH_BASIC_DATA },
			{ fetchLevel: PRODUCT_FETCH_TRIES.ADDITIONAL_DATA, search: ET_RATE_SEARCH_SUBTYPE.RATE_SEARCH_EXTENDED_DATA },
			{ fetchLevel: PRODUCT_FETCH_TRIES.FULL_DATA, search: ET_RATE_SEARCH_SUBTYPE.RATE_SEARCH_FULL_DATA },
			{ fetchLevel: PRODUCT_FETCH_TRIES.SEARCH_FAILED, search: ET_RATE_SEARCH_SUBTYPE.RATE_SEARCH_FAILED }
		].find(obj => obj.fetchLevel === searchLevel).search;
		this.sendRateSearch(src);
	}

	public etOnPostOrder(prodId: string, value: string, prodName: string, process: PROCESS_ENUM, section: SECTION_ENUM, runtime: string) {
		this.sendOrder(prodId, value, prodName, PROCESS_ENUM[process], section, runtime);
	}

	public etOnProductSeen(product: Product) {
		const id = '' + product.apiIfc.priceInformation[product.getDataIndexByRuntime(product.getActiveRuntime())].tariff.id;
		const val = '' + product.prices[product.getDataIndexByRuntime(product.getActiveRuntime())].monthly;
		const name = '' + product.apiIfc.priceInformation[product.getDataIndexByRuntime(product.getActiveRuntime())].tariff.nameExtern;
		this.seenProduct(id, val, name);
	}

	public etBasketPlacement(product: Product) {
		const id = '' + product.apiIfc.priceInformation[product.getDataIndexByRuntime(product.getActiveRuntime())].tariff.id;
		const val = '' + product.prices[product.getDataIndexByRuntime(product.getActiveRuntime())].monthly;
		const name = '' + product.apiIfc.priceInformation[product.getDataIndexByRuntime(product.getActiveRuntime())].tariff.nameExtern;
		this.basketProduct(id, val, name);
	}

	public etOnFormFill(sourceForm: ET_FORM, msg: string) {
		this.formFillAction(sourceForm, msg);
	}

	public etOnCredistScore(creditScore: ET_CREDIT_SCORE_EVENT) {
		this.onCredistScore(creditScore);
	}

	public etOnClpValidation(clpValidationSource: ET_CLP_EVENT, result: ET_CLP_EVENT_VALUE) {
		this.onClp(clpValidationSource, result);
	}

	private sendPageInOut(sourcePage: ET_EVENT_SOURCE, pageNavType: ET_PAGE_NAVIGATION_SUBTYPE) {
		if (this.sendRealData()) {
			try {
				_etracker.sendEvent(new et_UserDefinedEvent(sourcePage, category, EVENT_TYPE.PAGE_NAVIGATION, pageNavType));
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Page event '%s', Event Action '%s' was sent", sourcePage, pageNavType);
		}
	}

	private sendDocDownload(sourceDoc: string) {
		if (this.sendRealData()) {
			try {
				_etracker.sendEvent(new et_UserDefinedEvent(sourceDoc, category, EVENT_TYPE.DOCUMENT_DOWNLOAD, 'download'));
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Downloaded doc with name '%s'", sourceDoc);
		}
	}

	private sendRateSearch(searchLevel: string) {
		if (this.sendRealData()) {
			try {
				_etracker.sendEvent(new et_UserDefinedEvent(ET_EVENT_SOURCE.START_PAGE, category, EVENT_TYPE.RATE_SEARCH, searchLevel));
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Rate search event '%s'", searchLevel);
		}
	}

	private sendOrder(prodId: string, value: string, name: string, process: string, section: string, runtime: string) {
		if (this.sendRealData()) {
			try {

				const orderObj: EtOrderObject = {
					orderNumber: EtrackerHelper.generateOrderNumber() + (this.envType === 'prod' ? '' : '_TEST'),
					status: 'sale',
					orderPrice: value,
					currency: 'EUR',
					basket: {
						id: EtrackerHelper.generateBasketId() + (this.envType === 'prod' ? '' : '_TEST'),
						products: [
							{
								product: {
									category: [process, section, runtime],
									currency: 'EUR',
									id: prodId,
									price: value,
									variants: {
										runtime
									},
									name,
								},
								quantity: '1'
							}
						],
					},
				};
				etCommerce.sendEvent('order', orderObj);
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Order purchased '%s', '%s': '%s' Eur", prodId, name, value);
		}
	}

	private seenProduct(prodId: string, value: string, name: string) {
		if (this.sendRealData()) {
			const prod: EtProductObject = {
				category: ['strom'],
				currency: 'EUR',
				id: prodId + (this.envType === 'prod' ? '' : '_TEST'),
				price: value,
				variants: {},
				name: name + (this.envType === 'prod' ? '' : '_TEST'),
			};
			try {
				etCommerce.sendEvent('viewProduct', prod);
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Product seen: '%s', '%s': '%s' Eur", prodId, name, value);
		}
	}

	private basketProduct(id: string, val: string, name: string) {
		if (this.sendRealData()) {
			const prod: EtProductObject = {
				category: ['strom'],
				currency: 'EUR',
				id: id + (this.envType === 'prod' ? '' : '_TEST'),
				price: val,
				variants: {},
				name: name + (this.envType === 'prod' ? '' : '_TEST'),
			};
			try {
				etCommerce.sendEvent('insertToBasket', prod, 1);
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Product put to basket: '%s', '%s': '%s' Eur", id, name, val);
		}
	}

	private formFillAction(form: string, msg: string) {
		if (this.sendRealData()) {
			try {
				_etracker.sendEvent(new et_UserDefinedEvent(form, category, EVENT_TYPE.FORM_ACTION, msg));
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Form %s filled: '%s'", form, msg);
		}
	}

	private onCredistScore(creditScore: ET_CREDIT_SCORE_EVENT) {
		if (this.sendRealData()) {
			try {
				_etracker.sendEvent(new et_UserDefinedEvent(creditScore, category, EVENT_TYPE.CREDIT_SCORE_EVENT, creditScore));
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Credit scoreing ET event", creditScore);
		}
	}

	private onClp(clpEvent: ET_CLP_EVENT, clpResult: ET_CLP_EVENT_VALUE) {
		if (this.sendRealData()) {
			try {
				_etracker.sendEvent(new et_UserDefinedEvent(ET_EVENT_SOURCE.CLP, category, clpEvent, clpResult));
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log("Credit scoreing ET event", clpEvent);
		}
	}

}

class EtrackerHelper {
	public static generateOrderNumber(): string {
		return uuidv4();
	}
	public static generateBasketId(): string {
		return uuidv4();
	}
}
