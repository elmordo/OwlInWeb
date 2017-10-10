
export namespace OOW {

    export class DomManipulator {

        readonly window: Window;

        readonly rootElement: CommonHtmlElement;

        private _cache: MappedElementCache;

        constructor (window: Window, rootElement: HTMLElement) {
            this.window = window;
            this.rootElement = this.mapElement(rootElement);
        }

        public createNewFragment(html: string) : CommonHtmlElement {
            let parser: DOMParser = new DOMParser();
            let fragment: DocumentFragment = parser.parseFromString(html, "text/xml");
            let element: HTMLElement = <HTMLElement>fragment.firstChild;

            return this.mapElement(element);
        }

        public mapElement(element:HTMLElement) : CommonHtmlElement {
            // TODO: real mapping
            return new CommonHtmlElement(element);
        }

    }

    function domManipulatorFactory(window: Window, rootElement: HTMLElement) : DomManipulator {
        let manipulator: DomManipulator = new DomManipulator(window, rootElement);

        return manipulator;
    }


    /**
     * contains <cache id>-<mapped element> pairs
     */
    class MappedElementLookup {

        [key: number]: CommonHtmlElement;

    }

    /**
     * hold already mapped elements
     */
    class MappedElementCache {

        /**
         * attribute name where OOW internal id is stored
         * @type {String}
         */
        public static ELEMENT_INTERNAL_ID_NAME = "oow-id";

        /**
         * id of next cached element
         * @type {number}
         */
        private static _nextId: number;

        /**
         * container with cached elements
         * @type {MappedElementLookup}
         */
        private _cache: MappedElementLookup;

        /**
         * parent document
         * @type {Document}
         */
        readonly document: Document;

        /**
         * initialize instance
         */
        constructor() {
            this._cache = new MappedElementLookup();
        }

        /**
         * is element cached?
         * @param {HTMLElement} element element to test
         * @return {boolean} true if element is cached, false otherwise
         */
        public isCached(element: HTMLElement) : boolean {
            return this._hasElementId(element);
        }

        /**
         * add element to the cache
         * @param {CommonHtmlElement} mappedElement mapped element to add
         */
        public addElement(mappedElement: CommonHtmlElement) : void {
            let id:number = this._setElementId(mappedElement.element);
            this._cache[id] = mappedElement;
        }

        /**
         * get mapped element from the cache
         * @param {HTMLElement} element raw HTML element
         * @return {CommonHtmlElement} cached element
         * @throws Error element is not cached
         */
        public getCached(element: HTMLElement) : CommonHtmlElement {
            let id: number = this._getElementId(element);
            return this._cache[id];
        }

        /**
         * remove element from the cache
         * @param {HTMLElement} element raw HTML element to remove
         * @throws Error element is not in cache
         */
        public removeFromCache(element: HTMLElement) : void {
            let id: number = this._getElementId(element);
            delete this._cache[id];
        }

        /**
         * test if element has cache id
         * @param {HTMLElement} element raw HTML element to test
         * @return {boolean} true if element has cache id
         */
        private _hasElementId(element: HTMLElement) : boolean {
            return element.attributes.getNamedItem(MappedElementCache.ELEMENT_INTERNAL_ID_NAME) !== null;
        }

        /**
         * get element cache id
         * @param {HTMLElement} element raw HTML element
         * @return {number} element's cache id
         * @throws Error element has no cache id
         */
        private _getElementId(element: HTMLElement) : number {
            let attr: Attr = element.attributes.getNamedItem(MappedElementCache.ELEMENT_INTERNAL_ID_NAME);

            if (attr === null) throw new Error("Element is not cached");

            return Number(attr.value);
        }

        /**
         * set new cache id to the element
         * @param {HTMLElement} element raw HTML element
         * @return {number} new assigned cache id
         */
        private _setElementId(element: HTMLElement) : number {
            let id: number = MappedElementCache._nextId++;

            let attr: Attr = document.createAttribute(MappedElementCache.ELEMENT_INTERNAL_ID_NAME);
            attr.value = id.toString();
            element.attributes.setNamedItem(attr);

            return id;
        }

    }


    class AttributeCache {

        [key: string]: Attribute;

    }

    export class CommonHtmlElement {

        readonly element: HTMLElement;

        private _cachedAttributes: AttributeCache;

        private _manipulator: DomManipulator;

        constructor(element: HTMLElement, manipulator: DomManipulator) {
            this.element = element;
            this._manipulator = manipulator;
        }

    };

}
