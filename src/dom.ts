
export class DomManipulator {

    readonly window: Window;

    readonly rootElement: CommonHtmlElement;

    private _cache: MappedElementCache;

    private _nodeTypeLookup: NodeMapperAbstractFactoryLookup;

    constructor (window: Window, rootElement: HTMLElement) {
        this.window = window;
        this._cache = new MappedElementCache(window.document);
        this._nodeTypeLookup = new NodeMapperAbstractFactoryLookup();

        this._initializeLookup();
        this.rootElement = <CommonHtmlElement>this.mapNode(rootElement);
    }

    public createNewFragment(html: string) : CommonHtmlElement {
        let parser: DOMParser = new DOMParser();
        let fragment: Document = parser.parseFromString(html, "text/html");
        let element: HTMLElement = <HTMLElement>fragment.body.firstChild;

        return <CommonHtmlElement>this.mapNode(element);
    }

    public createAttribute(name: string, value:string=null) : CommonHtmlAttribute {
        let attr = this.rootElement.element.ownerDocument.createAttribute(name);
        attr.value = value;
        return <CommonHtmlAttribute>this.mapNode(attr);
    }

    public createElement(tagName: string) : CommonHtmlElement {
        let element = this.window.document.createElement(tagName);
        return <CommonHtmlElement>this.mapNode(element);
    }

    public mapNode(node:Node) : CommonHtmlNode {
        if (this._cache.isCached(node))
            return this._cache.getCached(node);

        let nodeType = node.nodeType;
        let factory: NodeMapperAbstractFactory = this._nodeTypeLookup[nodeType];

        if (factory === undefined)
            throw new Error("Factory for node type '" + nodeType + "' not found");

        let mappedNode: CommonHtmlNode = factory.getFactory(node).createMapper(node, this);
        this._cache.addElement(mappedNode);

        return mappedNode;
    }

    private _initializeLookup() : void {
        this._initializeAttrLookup();
        this._initializeTextLookup();
        this._initializeElementLookup();
        this._initializeCommentLookup();
    }

    private _initializeAttrLookup() : void {
        this._createAndSetAbstractFactory(Node.ATTRIBUTE_NODE, new CommonAttributeMapper());
    }

    private _initializeTextLookup() : void {
        this._createAndSetAbstractFactory(Node.TEXT_NODE, new CommonTextMapper());
    }

    private _initializeElementLookup() : void {
        this._createAndSetAbstractFactory(Node.ELEMENT_NODE, new CommonElementMapper());
    }

    private _initializeCommentLookup() : void {
        this._createAndSetAbstractFactory(Node.COMMENT_NODE, new CommonCommentMapper());
    }

    private _createAndSetAbstractFactory(nodeType: number, fallback: INodeMapperFactory) {
        let factory: NodeMapperAbstractFactory = new NodeMapperAbstractFactory();
        factory.fallback = fallback;

        this._nodeTypeLookup[nodeType] = factory;
    }
}


export function domManipulatorFactory(window: Window, rootElement: HTMLElement) : DomManipulator {
    let manipulator: DomManipulator = new DomManipulator(window, rootElement);

    return manipulator;
}


class NodeMapperAbstractFactoryLookup {
    [key: number]: NodeMapperAbstractFactory;
}


class NodeMapperAbstractFactory {

    private _fallback: INodeMapperFactory;

    public getFactory(node: Node) : INodeMapperFactory {
        let factory: INodeMapperFactory = null;

        if (factory == null) {
            if (this._fallback == null)
                throw new Error("Factory for node not found");

            factory = this._fallback;
        }

        return factory;
    }

    get fallback(): INodeMapperFactory {
        return this._fallback;
    }

    set fallback(val: INodeMapperFactory) {
        this._fallback = val;
    }
}


/**
 * inteface for all node mappers
 */
export interface INodeMapperFactory {

    /**
     * map node
     * @param {Node} node raw html node to map
     * @param {DomManipulator} manipulator parent dom manipulator
     * @return {CommonHtmlNode} mapped node
     */
    createMapper(node: Node, manipulator: DomManipulator) : CommonHtmlNode;

    /**
     * return true if node can be mapped by this factory
     * @param {Node} node node to test
     * @return {boolean} true if node can be mapped
     */
    isNodeMappable(node: Node) : boolean;
}


/**
 * map node to the common element mapper
 */
export class CommonElementMapper implements INodeMapperFactory {

    /**
     * map node
     * @param {Node} node raw html node to map
     * @param {DomManipulator} manipulator parent dom manipulator
     * @return {CommonHtmlNode} mapped node
     */
    createMapper(node: Node, manipulator: DomManipulator) : CommonHtmlNode {
        return new CommonHtmlElement(node, manipulator);
    }

    /**
     * return true if node can be mapped by this factory
     * @param {Node} node node to test
     * @return {boolean} true if node can be mapped
     */
    isNodeMappable(node: Node) : boolean {
        return node.nodeType == Node.ELEMENT_NODE;
    }
}


/**
 * map node to common attribute mapper
 */
export class CommonAttributeMapper implements INodeMapperFactory {

    /**
     * map node
     * @param {Node} node raw html node to map
     * @param {DomManipulator} manipulator parent dom manipulator
     * @return {CommonHtmlNode} mapped node
     */
    createMapper(node: Node, manipulator: DomManipulator) : CommonHtmlNode {
        return new CommonHtmlAttribute(node, manipulator);
    }

    /**
     * return true if node can be mapped by this factory
     * @param {Node} node node to test
     * @return {boolean} true if node can be mapped
     */
    isNodeMappable(node: Node) : boolean {
        return node.nodeType == Node.ATTRIBUTE_NODE;
    }
}


/**
 * map node to common text mapper
 */
export class CommonTextMapper implements INodeMapperFactory {

    /**
     * map node
     * @param {Node} node raw html node to map
     * @param {DomManipulator} manipulator parent dom manipulator
     * @return {CommonHtmlNode} mapped node
     */
    createMapper(node: Node, manipulator: DomManipulator) : CommonHtmlNode {
        return new CommonHtmlText(node, manipulator);
    }

    /**
     * return true if node can be mapped by this factory
     * @param {Node} node node to test
     * @return {boolean} true if node can be mapped
     */
    isNodeMappable(node: Node) : boolean {
        return node.nodeType == Node.TEXT_NODE;
    }
}


/**
 * map node to common comment mapper
 */
export class CommonCommentMapper implements INodeMapperFactory {

    /**
     * map node
     * @param {Node} node raw html node to map
     * @param {DomManipulator} manipulator parent dom manipulator
     * @return {CommonHtmlNode} mapped node
     */
    createMapper(node: Node, manipulator: DomManipulator) : CommonHtmlNode {
        return new CommonHtmlComment(node, manipulator);
    }

    /**
     * return true if node can be mapped by this factory
     * @param {Node} node node to test
     * @return {boolean} true if node can be mapped
     */
    isNodeMappable(node: Node) : boolean {
        return node.nodeType == Node.COMMENT_NODE;
    }
}


/**
 * contains <cache id>-<mapped element> pairs
 */
class MappedNodeLookup {
    [key: number]: CommonHtmlNode;
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
    private static _nextId: number = 1;

    /**
     * container with cached elements
     * @type {MappedNodeLookup}
     */
    private _cache: MappedNodeLookup;

    /**
     * parent document
     * @type {Document}
     */
    private _document: Document;

    /**
     * initialize instance
     */
    constructor(document: Document) {
        this._cache = new MappedNodeLookup();
        this._document = document;
    }

    /**
     * is element cached?
     * @param {HTMLElement} element element to test
     * @return {boolean} true if element is cached, false otherwise
     */
    public isCached(element: Node) : boolean {
        return this._hasNodeId(element);
    }

    /**
     * add element to the cache
     * @param {CommonHtmlNode} mappedNode mapped element to add
     */
    public addElement(mappedNode: CommonHtmlNode) : void {
        let id:number = this._setNodeId(mappedNode.node);
        this._cache[id] = mappedNode;
    }

    /**
     * get mapped element from the cache
     * @param {Node} element raw HTML element
     * @return {CommonHtmlElement} cached element
     * @throws Error element is not cached
     */
    public getCached(node: Node) : CommonHtmlNode {
        let id: number = this._getNodeId(node);
        return this._cache[id];
    }

    /**
     * remove element from the cache
     * @param {Node} element raw HTML element to remove
     * @throws Error element is not in cache
     */
    public removeElement(node: Node) : void {
        let id: number = this._getNodeId(node);
        delete this._cache[id];
    }

    /**
     * test if element has cache id
     * @param {HTMLElement} element raw HTML element to test
     * @return {boolean} true if element has cache id
     */
    private _hasNodeId(node: Node) : boolean {
        let untyped:Object = <Object>node;
        return untyped[MappedElementCache.ELEMENT_INTERNAL_ID_NAME] !== undefined;
    }

    /**
     * get element cache id
     * @param {HTMLElement} element raw HTML element
     * @return {number} element's cache id
     * @throws Error element has no cache id
     */
    private _getNodeId(node: Node) : number {
        let untyped: Object = <Object>node;
        let idValue = untyped[MappedElementCache.ELEMENT_INTERNAL_ID_NAME];

        if (idValue === undefined) throw new Error("Element is not cached");

        return Number(idValue);
    }

    /**
     * set new cache id to the element
     * @param {HTMLElement} element raw HTML element
     * @return {number} new assigned cache id
     */
    private _setNodeId(node: Node) : number {
        let id: number = MappedElementCache._nextId++;
        let untyped: Object = <Object>node;

        untyped[MappedElementCache.ELEMENT_INTERNAL_ID_NAME] = id;
        return id;
    }
}


class AttributeManager {

    private _attributes: NamedNodeMap;

    private _manipulator: DomManipulator;

    private _originalElement: Element;

    constructor(element: Element, manipulator: DomManipulator) {
        this._attributes = element.attributes;
        this._originalElement = element;
        this._manipulator = manipulator;
    }

    public get(name: string) : CommonHtmlAttribute {
        let attr: Node = this._attributes.getNamedItem(name);

        if (!attr)
            throw new Error("Attribute '" + name + "' is not set");

        return <CommonHtmlAttribute>this._manipulator.mapNode(attr);
    }

    public has(name: string) : boolean {
        return !!this._attributes.getNamedItem(name);
    }

    public set(name: string, value: string) : void {
        let attr = this._attributes.getNamedItem(name);

        if (attr)
            attr.value = value;
        else {
            this._originalElement.setAttribute(name, value);
        }
    }

    /**
     * return list of attributes as common node list instance
     * @return {CommonNodeList} list of attributes
     */
    public toCommonNodeList(): CommonNodeList {
        let result = CommonNodeList.createInstance();

        for (let i = 0; i < this._attributes.length; ++i) {
            result.push(this._manipulator.mapNode(this._attributes.item(i)));
        }

        return result;
    }

    public getIterator() : CommonHtmlAttribute[] {
        let result: CommonHtmlAttribute[] = new Array<CommonHtmlAttribute>();

        for (let i = 0; i < this._attributes.length; ++i) {
            let attr = this._attributes.item(i);
            result.push(<CommonHtmlAttribute>this._manipulator.mapNode(attr));
        }

        return result;
    }
}

class StyleManager {

    private _styles: CSSStyleDeclaration;

    private _classes: DOMTokenList;

    constructor(element: HTMLElement) {
        this._styles = element.style;
        this._classes = element.classList;
    }

    public addClass(className: string) : void {
        this._classes.add(className);
    }

    public getClasses() : string[] {
        let result: string[] = new Array<string>();

        for (let i = 0; i < this._classes.length; ++i)
            result.push(this._classes.item(i));

        return result;
    }

    public removeClass(className: string) : void {
        this._classes.remove(className);
    }

    public set(name: string, val: string): void {
        this._styles[name] = val;
    }

    public get(name: string): string {
        return this._styles[name];
    }
}

export class CommonHtmlNode {

    protected _node: Node;

    protected _domManipulator: DomManipulator;

    constructor(node: Node, manipulator: DomManipulator) {
        this._node = node;
        this._domManipulator = manipulator;
    }

    public addEventListener(eventType: string, handler: EventListener) : void {
        this.node.addEventListener(eventType, handler);
    }

    get node() : Node {
        return this._node;
    }

    get parent() : CommonHtmlNode {
        return this._domManipulator.mapNode(this._node.parentNode);
    }

    get domManipulator() : DomManipulator {
        return this._domManipulator;
    }
}


export class CommonHtmlElement extends CommonHtmlNode {

    private _attributes: AttributeManager = null;

    private _styleManager: StyleManager = null;

    constructor(node: Node, manipulator: DomManipulator) {
        super(node, manipulator);
        this._attributes = new AttributeManager(this.element, manipulator);
        this._styleManager = new StyleManager(this.element);
    }

    public append(node: CommonHtmlNode) : void {
        this.element.appendChild(node.node);
    }

    public insertOnIndex(node: CommonHtmlNode, index: number) : void {
        if (index < 0 || index >= this.element.childNodes.length)
            throw new Error("Invalid index '" + index + "'");

        let refNode = this.element.childNodes.item(index);
        this.element.parentNode.insertBefore(node.node, refNode);
    }

    public insertBeforeNode(node: CommonHtmlNode, refNode: CommonHtmlNode) : void {
        if (refNode.parent !== this)
            throw new Error("Invalid subtree");

        this.node.insertBefore(node.node, refNode.node);
    }

    get attributes(): AttributeManager {
        return this._attributes;
    }

    get styles(): StyleManager {
        return this._styleManager;
    }

    get size(): Size {
        return new Size(this.element.offsetWidth, this.element.offsetHeight);
    }

    get position(): Position {
        return new Position(this.element.offsetLeft, this.element.offsetTop);
    }

    get element(): HTMLElement {
        return <HTMLElement>this.node;
    }

    get chidlren(): CommonNodeList {
        let children: NodeList = this.element.childNodes;
        let result: CommonNodeList = CommonNodeList.createInstance();

        for (var i = 0; i < children.length; ++i) {
            let node: Node = children.item(i);
            let mapped = this._domManipulator.mapNode(node);
            result.push(mapped);
        }

        return result;
    }
};

/**
 * wraps attribute (Attr class instance)
 */
export class CommonHtmlAttribute extends CommonHtmlNode {

    /**
     * initialize instance
     * @param {Node} node attribute to wrap
     * @param {DomManipulator} manipulator original manipulator
     */
    constructor(node: Node, manipulator: DomManipulator) {
        super(node, manipulator);
    }

    /**
     * wrapped attribute
     * @return {Attr} wrapped attribute
     */
    get attribute(): Attr {
        return <Attr>this.node;
    }

    /**
     * get attribute name
     * @return {string} attribute name
     */
    get name(): string {
        return this.attribute.name;
    }

    /**
     * get attribute value
     * @return {string} attribute value
     */
    get value(): string {
        return this.attribute.value;
    }

    /**
     * set attribute value
     * @param {string} val new attribute value
     */
    set value(val: string) {
        this.attribute.value = val;
    }
}

/**
 * wraps text node
 */
export class CommonHtmlText extends CommonHtmlNode {

    /**
     * initialize instance
     * @param {Node} node original raw text node
     * @param {DomManipulator} manipulator dom manipulator
     */
    constructor(node: Node, manipulator: DomManipulator) {
        super(node, manipulator);
    }

    /**
     * return wrapped raw node as Text
     * @return {Text} [description]
     */
    get text(): Text {
        return <Text> this.node;
    }

    /**
     * get text content
     * @return {string} stored content
     */
    get content(): string {
        return this.text.textContent;
    }

    /**
     * set stored content
     * @param {string} val new content of the text node
     */
    set content(val: string) {
        this.text.textContent = val;
    }
}

/**
 * represent comment node
 */
export class CommonHtmlComment extends CommonHtmlNode {

    /**
     * initialize instance
     * @param {Node} node node to wrap
     * @param {DomManipulator} manipulator manipulator
     */
    constructor(node: Node, manipulator: DomManipulator) {
        super(node, manipulator);
    }

    /**
     * get wrapped comment node
     */
    get comment(): Comment {
        return <Comment>this.node;
    }

    /**
     * get comment content
     * @return {string} comment content
     */
    get content(): string {
        return this.comment.text;
    }

    /**
     * set new comment content
     * @param {string} val new comment content
     */
    set content(val: string) {
        this.comment.text = val;
    }
}


export class CommonNodeList extends Array<CommonHtmlNode> {

    private constructor() {
        super();
    }

    public static createInstance(): CommonNodeList {
        return Object.create(CommonNodeList.prototype);
    }

    public getFirst() : CommonHtmlNode {
        if (this.length == 0)
            throw new Error("The list is empty");

        return this[0];
    }

    public getLast() : CommonHtmlNode {
        if (this.length == 0)
            throw new Error("The list is empty");
        return this[this.length - 1];
    }
}


export class Position {

    public x: number;

    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}


export class Size {

    public width: number;

    public height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}
